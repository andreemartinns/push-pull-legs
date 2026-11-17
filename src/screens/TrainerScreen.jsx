import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../utils/api';
import { avisar } from '../utils/notify';
import { P } from '../utils/theme';
import TelaEditorTreino from './WorkoutEditorScreen';

// No celular a animação roda no motor nativo (mais fluida). No navegador, não existe.
const USAR_NATIVO = Platform.OS !== 'web';

function diasDesde(dataIso) {
  if (!dataIso) return null;
  const ms = Date.now() - new Date(dataIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function textoUltimoTreino(dias) {
  if (dias === null) return 'Nunca treinou';
  if (dias === 0) return 'Treinou hoje';
  if (dias === 1) return 'Treinou ontem';
  return `Sem treinar há ${dias} dias`;
}

function textoCurtoDias(dias) {
  if (dias === null) return '—';
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  return `${dias}d`;
}

function formatarDataHora(dataIso) {
  if (!dataIso) return '';
  const d = new Date(dataIso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} ${hora}:${min}`;
}

// Tem risco quando o aluno marcou alguma condição ou informou restrição médica.
function temRiscoNaFicha(ficha) {
  if (!ficha) return false;
  const condicoes = Array.isArray(ficha.condicoes) ? ficha.condicoes : [];
  return condicoes.length > 0 || ficha.restricao_medica === true;
}

const MODOS = [
  { id: 'automatico', nome: 'Automático' },
  { id: 'manual', nome: 'Manual' },
  { id: 'desligado', nome: 'Desligado' },
];

const ABAS = [
  { id: 'treinos', nome: 'Treinos' },
  { id: 'saude', nome: 'Saúde' },
  { id: 'assistente', nome: 'Assistente' },
  { id: 'agua', nome: 'Água' },
];

// ----- Blocos visuais (mesmo padrão da tela de treino) -----

function Aparecer({ atraso = 0, children }) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(valor, {
      toValue: 1,
      duration: 450,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USAR_NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: valor,
        transform: [
          {
            translateY: valor.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function TituloSecao({ titulo, descricao }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSecao}>{titulo}</Text>
      {!!descricao && <Text style={styles.descricaoSecao}>{descricao}</Text>}
    </View>
  );
}

// Topo igual ao da tela de treino: mascote, nome da academia e botão em pílula à direita.
function Topo({ textoBotao, aoPressionar }) {
  return (
    <View style={styles.topo}>
      <View style={styles.marca}>
        <Image
          source={require('../../assets/mascot.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Text style={styles.nomeAcademia}>RITMO BRASIL</Text>
      </View>

      <Pressable
        onPress={aoPressionar}
        hitSlop={10}
        style={({ pressed }) => [styles.botaoTopo, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotaoTopo}>{textoBotao}</Text>
      </Pressable>
    </View>
  );
}

function EtiquetaRisco({ texto = 'Risco' }) {
  return (
    <View style={styles.etiquetaRisco}>
      <Text style={styles.textoEtiquetaRisco}>{texto}</Text>
    </View>
  );
}

function EtiquetaSemFicha() {
  return (
    <View style={styles.etiquetaSemFicha}>
      <Text style={styles.textoEtiquetaSemFicha}>Sem ficha</Text>
    </View>
  );
}

function CartaoNumero({ valor, rotulo, alerta }) {
  return (
    <View style={styles.cartaoNumero}>
      <Text style={[styles.numero, alerta && styles.numeroAlerta]}>{valor}</Text>
      <Text style={styles.rotuloNumero}>{rotulo}</Text>
    </View>
  );
}

export default function TelaProfessor({ usuario, aoSair }) {
  const [carregando, setCarregando] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [ultimos, setUltimos] = useState({}); // { alunoId: dataIso do último treino }
  const [riscos, setRiscos] = useState({}); // { alunoId: true } para quem tem risco
  const [semFicha, setSemFicha] = useState({}); // { alunoId: true } para quem não preencheu
  const [objetivos, setObjetivos] = useState({}); // { alunoId: objetivo }
  const [aberto, setAberto] = useState(null); // aluno com a ficha aberta
  const [editando, setEditando] = useState(false); // editor de treino aberto

  const carregar = useCallback(async () => {
    let lista = [];
    try {
      lista = (await api('GET', '/meus-alunos-resumo')) || [];
    } catch (e) {
      console.log('Erro ao carregar', e);
      avisar('Erro', 'Não foi possível carregar seus alunos.');
    }

    const mapa = {};
    const mapaRiscos = {};
    const mapaSemFicha = {};
    const mapaObjetivos = {};
    lista.forEach((aluno) => {
      if (aluno.ultimo) mapa[aluno.id] = aluno.ultimo;
      if (!aluno.tem_ficha) {
        mapaSemFicha[aluno.id] = true;
      } else {
        if (temRiscoNaFicha(aluno)) mapaRiscos[aluno.id] = true;
        if (aluno.objetivo) mapaObjetivos[aluno.id] = aluno.objetivo;
      }
    });

    setAlunos(lista.map((a) => ({ id: a.id, nome: a.nome })));
    setUltimos(mapa);
    setRiscos(mapaRiscos);
    setSemFicha(mapaSemFicha);
    setObjetivos(mapaObjetivos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (aberto && editando) {
    return (
      <TelaEditorTreino
        aluno={aberto}
        professorId={usuario.id}
        aoVoltar={() => setEditando(false)}
      />
    );
  }

  if (aberto) {
    return (
      <FichaAluno
        aluno={aberto}
        professorId={usuario.id}
        aoVoltar={() => setAberto(null)}
        aoMontarTreino={() => setEditando(true)}
      />
    );
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={P.verde} />
      </View>
    );
  }

  const totalRisco = alunos.filter((a) => riscos[a.id]).length;
  const totalParados = alunos.filter((a) => {
    const dias = diasDesde(ultimos[a.id]);
    return dias === null || dias >= 10;
  }).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Topo textoBotao="Sair" aoPressionar={aoSair} />

        <Aparecer atraso={0}>
          <View style={styles.cabecalho}>
            <Text style={styles.saudacao}>Olá, {usuario?.nome}</Text>
            <Text style={styles.titulo}>Meus alunos</Text>
          </View>
        </Aparecer>

        <Aparecer atraso={100}>
          <View style={styles.linhaNumeros}>
            <CartaoNumero valor={alunos.length} rotulo="Alunos" />
            <CartaoNumero valor={totalRisco} rotulo="Com risco" alerta={totalRisco > 0} />
            <CartaoNumero valor={totalParados} rotulo="Parados" alerta={totalParados > 0} />
          </View>
        </Aparecer>

        <Aparecer atraso={200}>
          <TituloSecao titulo="Alunos" descricao="Toque em um aluno para abrir a ficha" />

          {alunos.length === 0 && (
            <Text style={styles.vazio}>
              Você ainda não tem alunos vinculados. Peça ao administrador para vincular.
            </Text>
          )}

          {alunos.map((aluno) => {
            const dias = diasDesde(ultimos[aluno.id]);
            const alerta = dias === null || dias >= 10;
            const inicial = (aluno.nome || '?').trim().charAt(0).toUpperCase();
            return (
              <Pressable
                key={aluno.id}
                onPress={() => setAberto(aluno)}
                style={({ pressed }) => [
                  styles.cartaoAluno,
                  riscos[aluno.id] && styles.cartaoRisco,
                  pressed && styles.pressionado,
                ]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{inicial}</Text>
                </View>
                <View style={styles.corpoAluno}>
                  <View style={styles.linhaNome}>
                    <Text style={styles.nomeAluno} numberOfLines={1}>
                      {aluno.nome || 'Sem nome'}
                    </Text>
                    {riscos[aluno.id] && <EtiquetaRisco />}
                    {semFicha[aluno.id] && <EtiquetaSemFicha />}
                  </View>
                  {!!objetivos[aluno.id] && (
                    <Text style={styles.detalhe} numberOfLines={1}>
                      {objetivos[aluno.id]}
                    </Text>
                  )}
                  <Text style={[styles.detalhe, alerta && styles.textoErro]}>
                    {textoUltimoTreino(dias)}
                  </Text>
                </View>
                <Text style={styles.seta}>›</Text>
              </Pressable>
            );
          })}
        </Aparecer>
      </ScrollView>
    </View>
  );
}

function FichaAluno({ aluno, professorId, aoVoltar, aoMontarTreino }) {
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState('treinos');
  const [treinos, setTreinos] = useState([]);
  const [qtdMedidas, setQtdMedidas] = useState(0);
  const [anamnese, setAnamnese] = useState(null);
  const [peso, setPeso] = useState(null); // último peso registrado, se existir
  const [modoAgua, setModoAgua] = useState('automatico');
  const [metaAgua, setMetaAgua] = useState(2000);
  const [salvandoAgua, setSalvandoAgua] = useState(false);
  const [perguntas, setPerguntas] = useState([]); // perguntas ao assistente de IA

  useEffect(() => {
    async function carregar() {
      let falhou = false;
      const buscar = (caminho, padrao) =>
        api('GET', `${caminho}?aluno_id=${aluno.id}`).catch((e) => {
          console.log('Erro na ficha', caminho, e);
          falhou = true;
          return padrao;
        });

      const [historico, medidas, ficha, agua, listaIA] = await Promise.all([
        buscar('/historico', []),
        buscar('/medidas', []),
        buscar('/anamnese', null),
        buscar('/agua', null),
        buscar('/ia-perguntas', []),
      ]);

      if (falhou) avisar('Erro', 'Não foi possível carregar a ficha do aluno.');

      const listaMedidas = medidas || [];
      const pesoEncontrado = listaMedidas
        .map((m) => Number(m.dados?.valores?.peso))
        .find((p) => Number.isFinite(p) && p > 0);

      // Alertas primeiro (mais novos antes); depois as demais (mais novas antes).
      const listaPerguntas = (listaIA || []).slice(0, 50);
      const alertas = listaPerguntas.filter((p) => p.alerta);
      const normais = listaPerguntas.filter((p) => !p.alerta);
      setPerguntas([...alertas, ...normais].slice(0, 20));

      setTreinos(historico || []);
      setQtdMedidas(listaMedidas.length);
      setAnamnese(ficha || null);
      setPeso(pesoEncontrado || null);

      const sugerida = pesoEncontrado ? Math.round((pesoEncontrado * 35) / 50) * 50 : 2000;
      if (agua) {
        setModoAgua(agua.modo);
        setMetaAgua(agua.meta_ml || sugerida);
      } else {
        setMetaAgua(sugerida);
      }
      setCarregando(false);
    }
    carregar();
  }, [aluno.id]);

  function mudarMeta(delta) {
    setMetaAgua((m) => Math.min(6000, Math.max(500, m + delta)));
  }

  async function salvarAgua() {
    setSalvandoAgua(true);
    try {
      await api('PUT', '/agua', {
        aluno_id: aluno.id,
        modo: modoAgua,
        meta_ml: modoAgua === 'manual' ? metaAgua : null,
      });
    } catch (e) {
      setSalvandoAgua(false);
      console.log('Erro ao salvar água', e);
      avisar('Erro', 'Não foi possível salvar a configuração de água.');
      return;
    }
    setSalvandoAgua(false);
    avisar('Salvo', 'Configuração de água atualizada.');
  }

  const condicoes = Array.isArray(anamnese?.condicoes) ? anamnese.condicoes : [];
  const temRisco = temRiscoNaFicha(anamnese);
  const metaAutomatica = peso ? Math.round((peso * 35) / 50) * 50 : null;
  const qtdAlertas = perguntas.filter((p) => p.alerta).length;
  const diasUltimoTreino = diasDesde(treinos[0]?.criado_em);
  const treinoParado = diasUltimoTreino === null || diasUltimoTreino >= 10;
  const mostrarBanner = !anamnese || temRisco || qtdAlertas > 0;

  if (carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.conteudo}>
          <Topo textoBotao="Voltar" aoPressionar={aoVoltar} />
        </View>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={P.verde} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.conteudoFicha}
        showsVerticalScrollIndicator={false}
      >
        {/* 0: topo, resumo, alertas e ação principal */}
        <View style={styles.paddingLateral}>
          <Topo textoBotao="Voltar" aoPressionar={aoVoltar} />

          <Aparecer atraso={0}>
            <View style={styles.cabecalho}>
              <Text style={styles.saudacao} numberOfLines={1}>
                {anamnese?.objetivo ? anamnese.objetivo : 'Ficha do aluno'}
              </Text>
              <View style={styles.linhaNome}>
                <Text style={[styles.titulo, styles.tituloFlex]} numberOfLines={1}>
                  {aluno.nome || 'Sem nome'}
                </Text>
                {temRisco && <EtiquetaRisco />}
                {!anamnese && <EtiquetaSemFicha />}
              </View>
            </View>
          </Aparecer>

          <Aparecer atraso={100}>
            <View style={styles.linhaNumeros}>
              <CartaoNumero valor={treinos.length} rotulo="Treinos" />
              <CartaoNumero valor={qtdMedidas} rotulo="Medidas" />
              <CartaoNumero
                valor={textoCurtoDias(diasUltimoTreino)}
                rotulo="Último treino"
                alerta={treinoParado}
              />
            </View>
          </Aparecer>

          <Aparecer atraso={200}>
            {mostrarBanner && (
              <View style={styles.banner}>
                {!anamnese && (
                  <Pressable
                    style={({ pressed }) => [styles.bannerLinha, pressed && styles.pressionado]}
                    onPress={() => setAba('saude')}
                  >
                    <Text style={styles.bannerTextoNeutro}>
                      Ficha de saúde não preenchida. Evite montar o treino antes disso.
                    </Text>
                    <Text style={styles.bannerSetaNeutra}>›</Text>
                  </Pressable>
                )}
                {temRisco && (
                  <Pressable
                    style={({ pressed }) => [styles.bannerLinha, pressed && styles.pressionado]}
                    onPress={() => setAba('saude')}
                  >
                    <Text style={styles.bannerTexto}>
                      Condição de saúde informada. Considere liberação médica.
                    </Text>
                    <Text style={styles.bannerSeta}>›</Text>
                  </Pressable>
                )}
                {qtdAlertas > 0 && (
                  <Pressable
                    style={({ pressed }) => [styles.bannerLinha, pressed && styles.pressionado]}
                    onPress={() => setAba('assistente')}
                  >
                    <Text style={styles.bannerTexto}>
                      {qtdAlertas === 1
                        ? '1 pergunta com alerta no assistente'
                        : `${qtdAlertas} perguntas com alerta no assistente`}
                    </Text>
                    <Text style={styles.bannerSeta}>›</Text>
                  </Pressable>
                )}
              </View>
            )}

            <Pressable
              onPress={aoMontarTreino}
              style={({ pressed }) => [styles.botaoPrincipal, pressed && styles.pressionado]}
            >
              <Text style={styles.textoBotaoPrincipal}>Montar treino</Text>
            </Pressable>
          </Aparecer>
        </View>

        {/* 1: abas (ficam fixas ao rolar) */}
        <View style={styles.abasFundo}>
          <View style={styles.abas}>
            {ABAS.map((item, indice) => {
              const ativa = aba === item.id;
              const mostrarPonto =
                (item.id === 'saude' && temRisco) || (item.id === 'assistente' && qtdAlertas > 0);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setAba(item.id)}
                  style={[
                    styles.aba,
                    indice < ABAS.length - 1 && styles.abaEspaco,
                    ativa && styles.abaAtiva,
                  ]}
                >
                  <Text style={[styles.textoAba, ativa && styles.textoAbaAtiva]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  {mostrarPonto && (
                    <View style={[styles.pontoAba, ativa && styles.pontoAbaAtivo]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2: conteúdo da aba */}
        <View style={styles.paddingLateral}>
          <Aparecer key={aba}>
            {aba === 'treinos' && (
              <>
                <TituloSecao
                  titulo="Últimos treinos"
                  descricao="Os 20 treinos mais recentes do aluno"
                />

                {treinos.length === 0 && (
                  <Text style={styles.vazio}>Nenhum treino registrado ainda.</Text>
                )}

                {treinos.slice(0, 20).map((linha, indice) => {
                  const registro = linha.dados || {};
                  const qtd = Array.isArray(registro.exercicios) ? registro.exercicios.length : 0;
                  return (
                    <View key={registro.id || indice} style={styles.cartao}>
                      <Text style={styles.nomeCartao}>{registro.data || 'Sem data'}</Text>
                      <Text style={styles.detalhe}>
                        {qtd === 1 ? '1 exercício' : `${qtd} exercícios`}
                      </Text>
                      {!!registro.anotacao && (
                        <Text style={styles.anotacao}>Anotação: {registro.anotacao}</Text>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {aba === 'saude' && (
              <>
                <TituloSecao titulo="Ficha de saúde" descricao="Respostas do aluno no cadastro" />

                {!anamnese && (
                  <View style={styles.cartao}>
                    <Text style={styles.detalheSemTopo}>
                      O aluno ainda não preencheu a ficha de saúde. Evite montar o treino antes
                      disso.
                    </Text>
                  </View>
                )}

                {anamnese && (
                  <View style={[styles.cartao, temRisco && styles.cartaoRisco]}>
                    {temRisco && (
                      <Text style={styles.avisoRisco}>
                        Atenção: condição de saúde informada. Considere liberação médica.
                      </Text>
                    )}

                    <Text style={styles.rotuloPrimeiro}>Objetivo</Text>
                    <Text style={styles.valor}>{anamnese.objetivo || 'Não informado'}</Text>

                    <Text style={styles.rotulo}>Condições de saúde</Text>
                    <Text style={styles.valor}>
                      {condicoes.length > 0 ? condicoes.join(', ') : 'Nenhuma informada'}
                    </Text>

                    <Text style={styles.rotulo}>Restrição médica a exercícios</Text>
                    <Text style={styles.valor}>{anamnese.restricao_medica ? 'Sim' : 'Não'}</Text>

                    <Text style={styles.rotulo}>Lesões ou dores</Text>
                    <Text style={styles.valor}>{anamnese.lesoes || 'Nenhuma informada'}</Text>

                    <Text style={styles.rotulo}>Medicamentos</Text>
                    <Text style={styles.valor}>{anamnese.medicamentos || 'Nenhum informado'}</Text>
                  </View>
                )}
              </>
            )}

            {aba === 'assistente' && (
              <>
                <TituloSecao
                  titulo="Perguntas ao assistente"
                  descricao={
                    qtdAlertas > 0
                      ? `${qtdAlertas} ${qtdAlertas === 1 ? 'alerta' : 'alertas'} no topo da lista`
                      : 'O que o aluno perguntou à IA'
                  }
                />

                {perguntas.length === 0 && (
                  <Text style={styles.vazio}>O aluno ainda não fez perguntas ao assistente.</Text>
                )}

                {perguntas.map((p) => (
                  <View key={p.id} style={[styles.cartao, p.alerta && styles.cartaoRisco]}>
                    <View style={styles.linhaNome}>
                      {p.alerta && (
                        <View style={styles.etiquetaAlerta}>
                          <Text style={styles.textoEtiquetaRisco}>Alerta</Text>
                        </View>
                      )}
                      <Text style={[styles.dataPergunta, p.alerta && styles.textoErro]}>
                        {formatarDataHora(p.criado_em)}
                      </Text>
                    </View>
                    <Text style={styles.rotulo}>Pergunta</Text>
                    <Text style={styles.valor}>{p.pergunta}</Text>
                    <Text style={styles.rotulo}>Resposta do assistente</Text>
                    <Text style={styles.respostaIA}>{p.resposta}</Text>
                  </View>
                ))}
              </>
            )}

            {aba === 'agua' && (
              <>
                <TituloSecao titulo="Meta de água" descricao="Defina como o aluno vê a meta diária" />

                <View style={styles.cartao}>
                  {temRisco && (
                    <Text style={styles.avisoRisco}>
                      Aluno com condição de saúde. Cardíacos e renais podem ter restrição de
                      líquidos: confirme com o médico antes de definir meta.
                    </Text>
                  )}

                  <Text style={styles.detalheSemTopo}>
                    {peso
                      ? `Último peso: ${peso} kg. Sugestão automática: ${metaAutomatica} ml/dia (35 ml por kg).`
                      : 'Sem peso registrado. O aluno precisa registrar o peso em Medidas para a sugestão automática.'}
                  </Text>

                  <View style={styles.linhaModos}>
                    {MODOS.map((modo, indice) => {
                      const ativo = modoAgua === modo.id;
                      return (
                        <Pressable
                          key={modo.id}
                          onPress={() => setModoAgua(modo.id)}
                          style={[
                            styles.modo,
                            indice < MODOS.length - 1 && styles.modoEspaco,
                            ativo && styles.modoAtivo,
                          ]}
                        >
                          <Text style={[styles.textoModo, ativo && styles.textoModoAtivo]}>
                            {modo.nome}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {modoAgua === 'automatico' && (
                    <Text style={styles.detalheSemTopo}>
                      O aluno vê a sugestão por peso, com aviso de que é só uma estimativa.
                    </Text>
                  )}

                  {modoAgua === 'manual' && (
                    <View style={styles.linhaMeta}>
                      <Pressable
                        style={({ pressed }) => [styles.passoMeta, pressed && styles.pressionado]}
                        onPress={() => mudarMeta(-250)}
                      >
                        <Text style={styles.textoPassoMeta}>−</Text>
                      </Pressable>
                      <Text style={styles.valorMeta}>{metaAgua} ml</Text>
                      <Pressable
                        style={({ pressed }) => [styles.passoMeta, pressed && styles.pressionado]}
                        onPress={() => mudarMeta(250)}
                      >
                        <Text style={styles.textoPassoMeta}>+</Text>
                      </Pressable>
                    </View>
                  )}

                  {modoAgua === 'desligado' && (
                    <Text style={styles.detalheSemTopo}>
                      O aluno não verá meta nem lembretes de água.
                    </Text>
                  )}

                  <Pressable
                    onPress={salvarAgua}
                    disabled={salvandoAgua}
                    style={({ pressed }) => [
                      styles.botaoSalvar,
                      (pressed || salvandoAgua) && styles.pressionado,
                    ]}
                  >
                    <Text style={styles.textoBotaoPrincipal}>
                      {salvandoAgua ? 'Salvando...' : 'Salvar água'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Aparecer>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.fundo },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.fundo,
  },
  conteudo: { paddingHorizontal: 20, paddingBottom: 60 },
  conteudoFicha: { paddingBottom: 60 },
  paddingLateral: { paddingHorizontal: 20 },
  pressionado: { transform: [{ scale: 0.97 }], opacity: 0.9 },

  // Topo (igual ao da tela de treino)
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 24,
  },
  marca: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  mascot: { width: 24, height: 32 },
  nomeAcademia: { marginLeft: 8, fontSize: 15, fontWeight: '800', letterSpacing: 1.5, color: P.texto },
  botaoTopo: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  textoBotaoTopo: { fontSize: 13, fontWeight: '700', color: P.texto },

  // Cabeçalho da tela
  cabecalho: { marginBottom: 20 },
  saudacao: { fontSize: 15, color: P.textoSecundario, marginBottom: 6 },
  titulo: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: P.texto },
  tituloFlex: { flexShrink: 1 },

  // Títulos de seção
  secao: { marginTop: 12, marginBottom: 14 },
  tituloSecao: { fontSize: 18, fontWeight: '700', color: P.texto },
  descricaoSecao: { fontSize: 13, color: P.textoSecundario, marginTop: 4 },

  // Cartões de número
  linhaNumeros: { flexDirection: 'row', marginBottom: 16 },
  cartaoNumero: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 6,
    marginHorizontal: 4,
  },
  numero: { fontSize: 24, fontWeight: '800', color: P.texto },
  numeroAlerta: { color: P.erro },
  rotuloNumero: { fontSize: 11, color: P.textoSecundario, marginTop: 2, textAlign: 'center' },

  // Lista de alunos
  cartaoAluno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontSize: 20, fontWeight: '800', color: P.limao },
  corpoAluno: { flex: 1 },
  nomeAluno: { fontSize: 17, fontWeight: '800', color: P.texto, flexShrink: 1 },
  seta: { fontSize: 26, color: P.textoSecundario, marginLeft: 8 },

  // Etiquetas
  linhaNome: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  etiquetaRisco: {
    backgroundColor: P.erro,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  etiquetaAlerta: {
    backgroundColor: P.erro,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  textoEtiquetaRisco: { fontSize: 11, fontWeight: '800', color: P.fundo },
  etiquetaSemFicha: {
    backgroundColor: P.pontoVazio,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  textoEtiquetaSemFicha: { fontSize: 11, fontWeight: '700', color: P.texto },

  // Banner de alertas
  banner: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: P.erro,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  bannerLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  bannerTexto: { flex: 1, fontSize: 13, fontWeight: '700', color: P.erro },
  bannerTextoNeutro: { flex: 1, fontSize: 13, fontWeight: '700', color: P.textoSecundario },
  bannerSeta: { fontSize: 22, color: P.erro, marginLeft: 8 },
  bannerSetaNeutra: { fontSize: 22, color: P.textoSecundario, marginLeft: 8 },

  // Botões principais
  botaoPrincipal: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoSalvar: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  textoBotaoPrincipal: { fontSize: 16, fontWeight: '800', color: P.verde },

  // Abas
  abasFundo: {
    backgroundColor: P.fundo,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  abas: { flexDirection: 'row' },
  aba: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  abaEspaco: { marginRight: 6 },
  abaAtiva: { backgroundColor: P.verde },
  textoAba: { fontSize: 13, fontWeight: '700', color: P.textoSecundario },
  textoAbaAtiva: { color: P.textoSobreVerde },
  pontoAba: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: P.erro,
    marginLeft: 5,
  },
  pontoAbaAtivo: { backgroundColor: P.limao },

  // Cartões de conteúdo
  cartao: {
    backgroundColor: P.cartao,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
  },
  cartaoRisco: { borderColor: P.erro },
  avisoRisco: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: P.erro, marginBottom: 10 },
  nomeCartao: { fontSize: 17, fontWeight: '800', color: P.texto },
  vazio: { color: P.textoSecundario, textAlign: 'center', marginTop: 16, marginBottom: 12 },

  // Textos
  detalhe: { fontSize: 14, color: P.textoSecundario, marginTop: 2 },
  detalheSemTopo: { fontSize: 14, lineHeight: 20, color: P.textoSecundario },
  textoErro: { color: P.erro },
  rotuloPrimeiro: { fontSize: 12, fontWeight: '700', color: P.textoSecundario },
  rotulo: { fontSize: 12, fontWeight: '700', color: P.textoSecundario, marginTop: 12 },
  valor: { fontSize: 15, color: P.texto, marginTop: 2 },
  respostaIA: { fontSize: 14, lineHeight: 20, color: P.textoSecundario, marginTop: 2 },
  dataPergunta: { fontSize: 14, color: P.textoSecundario },
  anotacao: { fontSize: 14, color: P.texto, marginTop: 8 },

  // Água
  linhaModos: { flexDirection: 'row', marginTop: 14, marginBottom: 12 },
  modo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.fundo,
    borderRadius: 999,
    paddingVertical: 12,
  },
  modoEspaco: { marginRight: 8 },
  modoAtivo: { backgroundColor: P.verde },
  textoModo: { fontSize: 13, fontWeight: '700', color: P.texto },
  textoModoAtivo: { color: P.textoSobreVerde },
  linhaMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  passoMeta: {
    width: 48,
    height: 44,
    borderRadius: 999,
    backgroundColor: P.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPassoMeta: { fontSize: 20, fontWeight: '700', color: P.texto },
  valorMeta: { fontSize: 24, fontWeight: '800', color: P.texto, marginHorizontal: 20 },
});