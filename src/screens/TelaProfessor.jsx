import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';
import TelaEditorTreino from './TelaEditorTreino';

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

export default function TelaProfessor({ usuario, aoSair }) {
  const [carregando, setCarregando] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [ultimos, setUltimos] = useState({}); // { alunoId: dataIso do último treino }
  const [riscos, setRiscos] = useState({}); // { alunoId: true } para quem tem risco
  const [semFicha, setSemFicha] = useState({}); // { alunoId: true } para quem não preencheu
  const [aberto, setAberto] = useState(null); // aluno com a ficha aberta
  const [editando, setEditando] = useState(false); // editor de treino aberto

  const carregar = useCallback(async () => {
    const [respAlunos, respHistorico, respFichas] = await Promise.all([
      supabase.from('perfis').select('id, nome').eq('tipo', 'aluno').order('nome'),
      supabase.from('historico').select('user_id, criado_em').order('criado_em', { ascending: false }),
      supabase.from('anamneses').select('aluno_id, condicoes, restricao_medica'),
    ]);

    if (respAlunos.error || respHistorico.error || respFichas.error) {
      console.log('Erro ao carregar', respAlunos.error, respHistorico.error, respFichas.error);
      avisar('Erro', 'Não foi possível carregar seus alunos.');
    }

    // Como a lista vem da mais nova para a mais antiga, o primeiro de cada aluno é o último treino.
    const mapa = {};
    (respHistorico.data || []).forEach((linha) => {
      if (!mapa[linha.user_id]) mapa[linha.user_id] = linha.criado_em;
    });

    const listaAlunos = respAlunos.data || [];
    const fichas = {};
    (respFichas.data || []).forEach((ficha) => {
      fichas[ficha.aluno_id] = ficha;
    });

    const mapaRiscos = {};
    const mapaSemFicha = {};
    listaAlunos.forEach((aluno) => {
      const ficha = fichas[aluno.id];
      if (!ficha) mapaSemFicha[aluno.id] = true;
      else if (temRiscoNaFicha(ficha)) mapaRiscos[aluno.id] = true;
    });

    setAlunos(listaAlunos);
    setUltimos(mapa);
    setRiscos(mapaRiscos);
    setSemFicha(mapaSemFicha);
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
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>Meus alunos</Text>
          <Text style={styles.sub}>Olá, {usuario?.nome}</Text>
        </View>
        <Pressable style={styles.botaoSair} onPress={aoSair}>
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {alunos.length === 0 && (
          <Text style={styles.vazio}>
            Você ainda não tem alunos vinculados. Peça ao administrador para vincular.
          </Text>
        )}

        {alunos.map((aluno) => {
          const dias = diasDesde(ultimos[aluno.id]);
          const alerta = dias === null || dias >= 10;
          return (
            <Pressable key={aluno.id} style={styles.cartao} onPress={() => setAberto(aluno)}>
              <View style={styles.linhaNome}>
                <Text style={styles.nome}>{aluno.nome || 'Sem nome'}</Text>
                {riscos[aluno.id] && (
                  <View style={styles.etiquetaRisco}>
                    <Text style={styles.textoEtiquetaRisco}>Risco</Text>
                  </View>
                )}
                {semFicha[aluno.id] && (
                  <View style={styles.etiquetaSemFicha}>
                    <Text style={styles.textoEtiquetaSemFicha}>Sem ficha</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.detalhe, alerta && styles.alerta]}>{textoUltimoTreino(dias)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FichaAluno({ aluno, professorId, aoVoltar, aoMontarTreino }) {
  const [carregando, setCarregando] = useState(true);
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
      const [respHistorico, respMedidas, respAnamnese, respAgua, respPerguntas] = await Promise.all([
        supabase
          .from('historico')
          .select('dados, criado_em')
          .eq('user_id', aluno.id)
          .order('criado_em', { ascending: false }),
        supabase
          .from('medidas')
          .select('id, dados, criado_em')
          .eq('user_id', aluno.id)
          .order('criado_em', { ascending: false }),
        supabase.from('anamneses').select('*').eq('aluno_id', aluno.id).maybeSingle(),
        supabase.from('agua_config').select('*').eq('aluno_id', aluno.id).maybeSingle(),
        supabase
          .from('ia_perguntas')
          .select('id, pergunta, resposta, alerta, criado_em')
          .eq('aluno_id', aluno.id)
          .order('criado_em', { ascending: false })
          .limit(50),
      ]);

      if (
        respHistorico.error ||
        respMedidas.error ||
        respAnamnese.error ||
        respAgua.error ||
        respPerguntas.error
      ) {
        console.log(
          'Erro na ficha',
          respHistorico.error,
          respMedidas.error,
          respAnamnese.error,
          respAgua.error,
          respPerguntas.error
        );
        avisar('Erro', 'Não foi possível carregar a ficha do aluno.');
      }

      const listaMedidas = respMedidas.data || [];
      const pesoEncontrado = listaMedidas
        .map((m) => Number(m.dados?.valores?.peso))
        .find((p) => Number.isFinite(p) && p > 0);

      // Alertas primeiro (mais novos antes); depois as demais (mais novas antes).
      const listaPerguntas = respPerguntas.data || [];
      const alertas = listaPerguntas.filter((p) => p.alerta);
      const normais = listaPerguntas.filter((p) => !p.alerta);
      setPerguntas([...alertas, ...normais].slice(0, 20));

      setTreinos(respHistorico.data || []);
      setQtdMedidas(listaMedidas.length);
      setAnamnese(respAnamnese.data || null);
      setPeso(pesoEncontrado || null);

      const sugerida = pesoEncontrado ? Math.round((pesoEncontrado * 35) / 50) * 50 : 2000;
      if (respAgua.data) {
        setModoAgua(respAgua.data.modo);
        setMetaAgua(respAgua.data.meta_ml || sugerida);
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
    const { error } = await supabase.from('agua_config').upsert({
      aluno_id: aluno.id,
      modo: modoAgua,
      meta_ml: modoAgua === 'manual' ? metaAgua : null,
      atualizado_por: professorId,
      atualizado_em: new Date().toISOString(),
    });
    setSalvandoAgua(false);
    if (error) {
      console.log('Erro ao salvar água', error);
      avisar('Erro', 'Não foi possível salvar a configuração de água.');
      return;
    }
    avisar('Salvo', 'Configuração de água atualizada.');
  }

  const condicoes = Array.isArray(anamnese?.condicoes) ? anamnese.condicoes : [];
  const temRisco = temRiscoNaFicha(anamnese);
  const metaAutomatica = peso ? Math.round((peso * 35) / 50) * 50 : null;
  const qtdAlertas = perguntas.filter((p) => p.alerta).length;

  return (
    <View style={styles.tela}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>{aluno.nome || 'Sem nome'}</Text>
          <Text style={styles.sub}>Ficha do aluno</Text>
        </View>
        <Pressable style={styles.botaoSair} onPress={aoVoltar}>
          <Text style={styles.botaoSairTexto}>Voltar</Text>
        </Pressable>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={CORES.destaque} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          <Text style={styles.secao}>Ficha de saúde</Text>

          {!anamnese && (
            <View style={styles.cartao}>
              <Text style={styles.detalhe}>
                O aluno ainda não preencheu a ficha de saúde. Evite montar o treino antes disso.
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

              <Text style={styles.rotulo}>Objetivo</Text>
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

          <Text style={styles.secao}>
            Perguntas ao assistente{qtdAlertas > 0 ? ` (${qtdAlertas} alerta${qtdAlertas > 1 ? 's' : ''})` : ''}
          </Text>

          {perguntas.length === 0 && (
            <Text style={styles.vazio}>O aluno ainda não fez perguntas ao assistente.</Text>
          )}

          {perguntas.map((p) => (
            <View key={p.id} style={[styles.cartao, p.alerta && styles.cartaoRisco]}>
              <View style={styles.linhaNome}>
                {p.alerta && (
                  <View style={[styles.etiquetaRisco, styles.etiquetaSemMargem]}>
                    <Text style={styles.textoEtiquetaRisco}>Alerta</Text>
                  </View>
                )}
                <Text style={[styles.detalhe, p.alerta && styles.dataComAlerta]}>
                  {formatarDataHora(p.criado_em)}
                </Text>
              </View>
              <Text style={styles.rotulo}>Pergunta</Text>
              <Text style={styles.valor}>{p.pergunta}</Text>
              <Text style={styles.rotulo}>Resposta do assistente</Text>
              <Text style={styles.respostaIA}>{p.resposta}</Text>
            </View>
          ))}

          <Text style={styles.secao}>Água</Text>
          <View style={styles.cartao}>
            {temRisco && (
              <Text style={styles.avisoRisco}>
                Aluno com condição de saúde. Cardíacos e renais podem ter restrição de líquidos:
                confirme com o médico antes de definir meta.
              </Text>
            )}

            <Text style={styles.detalhe}>
              {peso
                ? `Último peso: ${peso} kg. Sugestão automática: ${metaAutomatica} ml/dia (35 ml por kg).`
                : 'Sem peso registrado. O aluno precisa registrar o peso em Medidas para a sugestão automática.'}
            </Text>

            <View style={styles.linhaModos}>
              {MODOS.map((modo) => {
                const ativo = modoAgua === modo.id;
                return (
                  <Pressable
                    key={modo.id}
                    onPress={() => setModoAgua(modo.id)}
                    style={[styles.modo, ativo && styles.modoAtivo]}
                  >
                    <Text style={[styles.textoModo, ativo && styles.textoModoAtivo]}>
                      {modo.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {modoAgua === 'automatico' && (
              <Text style={styles.detalhe}>
                O aluno vê a sugestão por peso, com aviso de que é só uma estimativa.
              </Text>
            )}

            {modoAgua === 'manual' && (
              <View style={styles.linhaMeta}>
                <Pressable style={styles.passoMeta} onPress={() => mudarMeta(-250)}>
                  <Text style={styles.textoPassoMeta}>−</Text>
                </Pressable>
                <Text style={styles.valorMeta}>{metaAgua} ml</Text>
                <Pressable style={styles.passoMeta} onPress={() => mudarMeta(250)}>
                  <Text style={styles.textoPassoMeta}>+</Text>
                </Pressable>
              </View>
            )}

            {modoAgua === 'desligado' && (
              <Text style={styles.detalhe}>
                O aluno não verá meta nem lembretes de água.
              </Text>
            )}

            <Pressable style={styles.botaoMontar} onPress={salvarAgua} disabled={salvandoAgua}>
              <Text style={styles.botaoMontarTexto}>
                {salvandoAgua ? 'Salvando...' : 'Salvar água'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.secao}>Acompanhamento</Text>
          <View style={styles.cartao}>
            <Text style={styles.detalhe}>Treinos concluídos: {treinos.length}</Text>
            <Text style={styles.detalhe}>Medidas registradas: {qtdMedidas}</Text>
            <Pressable style={styles.botaoMontar} onPress={aoMontarTreino}>
              <Text style={styles.botaoMontarTexto}>Montar treino</Text>
            </Pressable>
          </View>

          <Text style={styles.secao}>Últimos treinos</Text>

          {treinos.length === 0 && <Text style={styles.vazio}>Nenhum treino registrado ainda.</Text>}

          {treinos.slice(0, 20).map((linha, indice) => {
            const registro = linha.dados || {};
            const qtd = Array.isArray(registro.exercicios) ? registro.exercicios.length : 0;
            return (
              <View key={registro.id || indice} style={styles.cartao}>
                <Text style={styles.nome}>{registro.data || 'Sem data'}</Text>
                <Text style={styles.detalhe}>
                  {qtd === 1 ? '1 exercício' : `${qtd} exercícios`}
                </Text>
                {!!registro.anotacao && (
                  <Text style={styles.anotacao}>Anotação: {registro.anotacao}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.fundo,
  },
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingTop: 48,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  sub: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  botaoSair: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  botaoSairTexto: {
    color: '#FFFFFF',
  },
  lista: {
    padding: 20,
    paddingBottom: 48,
  },
  vazio: {
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  secao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 12,
  },
  cartao: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cartaoRisco: {
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  avisoRisco: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  linhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  etiquetaRisco: {
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  etiquetaSemMargem: {
    marginLeft: 0,
    marginRight: 8,
  },
  textoEtiquetaRisco: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  etiquetaSemFicha: {
    borderWidth: 1,
    borderColor: '#BBBBBB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginLeft: 8,
  },
  textoEtiquetaSemFicha: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  rotulo: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 10,
  },
  valor: {
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
  },
  respostaIA: {
    fontSize: 14,
    color: '#BBBBBB',
    marginTop: 2,
  },
  dataComAlerta: {
    color: '#FF6B6B',
  },
  nome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detalhe: {
    fontSize: 14,
    color: '#BBBBBB',
    marginTop: 2,
  },
  alerta: {
    color: '#FF6B6B',
  },
  anotacao: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
  },
  botaoMontar: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: CORES.destaque,
  },
  botaoMontarTexto: {
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  linhaModos: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  modo: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#555555',
    alignItems: 'center',
    marginRight: 6,
  },
  modoAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoModo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textoModoAtivo: {
    color: CORES.textoSobreDestaque,
  },
  linhaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  passoMeta: {
    width: 48,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#555555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPassoMeta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  valorMeta: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
  },
});