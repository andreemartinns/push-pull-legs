import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BarraProgresso from '../components/BarraProgresso';
import CartaoExercicio from '../components/CartaoExercicio';
import Comemoracao from '../components/Comemoracao';
import ContadorSequencia from '../components/ContadorSequencia';
import Logo from '../components/Logo';
import ModalCarga from '../components/ModalCarga';
import ModalDivisao from '../components/ModalDivisao';
import ModalExercicios from '../components/ModalExercicios';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { DIVISOES } from '../utils/divisoes';
import { GRUPOS } from '../utils/grupos';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

// No celular a animação roda no motor nativo (mais fluida). No navegador, não existe.
const USAR_NATIVO = Platform.OS !== 'web';

// Converte "12,5" ou "12.5" em número. Se não for número, devolve 0.
function paraNumero(valor) {
  const numero = Number(String(valor || '').replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

// Lê o histórico e guarda, para cada exercício, a carga mais recente.
// Considera que o registro mais recente é o primeiro da lista.
function montarUltimasCargas(historico) {
  const mapa = {};

  for (const registro of historico) {
    const lista = Array.isArray(registro) ? registro : registro.exercicios || [];

    for (const ex of lista) {
      if (ex.peso && mapa[ex.nome] === undefined) {
        mapa[ex.nome] = {
          peso: ex.peso,
          series: ex.series,
          repeticoes: ex.repeticoes,
        };
      }
    }
  }

  return mapa;
}

// Lê o histórico e guarda, para cada exercício, a MAIOR carga já usada.
function montarRecordes(historico) {
  const mapa = {};

  for (const registro of historico) {
    const lista = Array.isArray(registro) ? registro : registro.exercicios || [];

    for (const ex of lista) {
      const peso = paraNumero(ex.peso);
      if (peso > 0 && (mapa[ex.nome] === undefined || peso > mapa[ex.nome])) {
        mapa[ex.nome] = peso;
      }
    }
  }

  return mapa;
}

// Mesmo formato de data que o App.jsx usa ao salvar o treino (ex: "09/10/2026").
function formatarData(data) {
  return data.toLocaleDateString('pt-BR');
}

// Lista as datas em que houve treino concluído.
function montarDatasTreino(historico) {
  return historico.map((registro) => registro.data).filter(Boolean);
}

// Conta quantos dias seguidos você treinou.
// Se hoje ainda não treinou, a sequência continua valendo a partir de ontem.
function calcularSequencia(datas) {
  const conjunto = new Set(datas);
  const dia = new Date();

  if (!conjunto.has(formatarData(dia))) {
    dia.setDate(dia.getDate() - 1);
  }

  let total = 0;
  while (conjunto.has(formatarData(dia))) {
    total += 1;
    dia.setDate(dia.getDate() - 1);
  }

  return total;
}

// Bom dia, boa tarde ou boa noite, conforme a hora.
function saudacaoDoDia() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ----- Treino sugerido -----

// Descobre a que divisão (Push, Pull ou Legs) cada exercício pertence.
// Primeiro pelo nome, nos treinos prontos. Se não achar, pelo grupo muscular.
// Braços fica de fora do grupo porque mistura bíceps e tríceps.
const DIVISAO_POR_NOME = {};
DIVISOES.forEach((divisao) => {
  divisao.exercicios.forEach((ex) => {
    DIVISAO_POR_NOME[ex.nome] = divisao.nome;
  });
});

const DIVISAO_POR_GRUPO = {
  Peito: 'Push',
  Ombros: 'Push',
  Costas: 'Pull',
  Pernas: 'Legs',
};

// Diz qual divisão foi um treino, pela que tem mais exercícios.
function divisaoDoTreino(lista) {
  const contagem = {};

  for (const ex of lista) {
    const nome = DIVISAO_POR_NOME[ex.nome] || DIVISAO_POR_GRUPO[ex.grupo];
    if (nome) {
      contagem[nome] = (contagem[nome] || 0) + 1;
    }
  }

  let melhor = null;
  for (const divisao of DIVISOES) {
    if ((contagem[divisao.nome] || 0) > (contagem[melhor] || 0)) {
      melhor = divisao.nome;
    }
  }

  return melhor;
}

// Monta a sugestão: a divisão que vem depois da que foi feita por último.
function sugerirProxima(nomeAtual, treinouHoje) {
  if (!nomeAtual) return null;

  const indice = DIVISOES.findIndex((divisao) => divisao.nome === nomeAtual);
  return {
    nome: DIVISOES[(indice + 1) % DIVISOES.length].nome,
    hoje: !treinouHoje,
  };
}

// Olha o treino mais recente do histórico e sugere o próximo.
function sugestaoDoHistorico(historico) {
  const ultimo = historico[0];
  if (!ultimo) return null;

  const lista = Array.isArray(ultimo) ? ultimo : ultimo.exercicios || [];
  const treinouHoje = ultimo.data === formatarData(new Date());

  return sugerirProxima(divisaoDoTreino(lista), treinouHoje);
}

// Pega o treino mais recente do histórico, para o botão "Repetir o último treino".
function ultimoTreinoDoHistorico(historico) {
  const ultimo = historico[0];
  if (!ultimo) return null;

  const lista = Array.isArray(ultimo) ? ultimo : ultimo.exercicios || [];
  if (lista.length === 0) return null;

  return { lista, divisao: divisaoDoTreino(lista) };
}

// ----- Animações e blocos visuais -----

// Faz o conteúdo aparecer subindo suavemente. "atraso" escalona a entrada dos blocos.
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

// Cabeçalho de seção: barrinha amarela, título e uma linha de explicação.
function TituloSecao({ titulo, descricao }) {
  return (
    <View style={styles.secao}>
      <View style={styles.barraSecao} />
      <View style={styles.textosSecao}>
        <Text style={styles.tituloSecao}>{titulo}</Text>
        <Text style={styles.descricaoSecao}>{descricao}</Text>
      </View>
    </View>
  );
}

// Estado vazio: uma barra que faz uma repetição (sobe, segura, desce, descansa).
// Se já existe um treino no histórico, mostra o botão para repeti-lo.
function EstadoVazio({ ultimoTreino, aoRepetir }) {
  const subida = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const repeticao = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(subida, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USAR_NATIVO,
        }),
        Animated.delay(280),
        Animated.timing(subida, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: USAR_NATIVO,
        }),
      ])
    );
    repeticao.start();
    return () => repeticao.stop();
  }, []);

  const levantar = subida.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const encolher = subida.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });
  const clarear = subida.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });

  const textoBotao = ultimoTreino
    ? ultimoTreino.divisao
      ? `Repetir o último treino (${ultimoTreino.divisao})`
      : 'Repetir o último treino'
    : '';

  return (
    <Aparecer atraso={450}>
      <View style={styles.vazio}>
        <View style={styles.palco}>
          <Animated.View style={[styles.barraCompleta, { transform: [{ translateY: levantar }] }]}>
            <View style={styles.anilhaGrande} />
            <View style={styles.anilhaPequena} />
            <View style={styles.manga} />
            <View style={styles.barra} />
            <View style={styles.manga} />
            <View style={styles.anilhaPequena} />
            <View style={styles.anilhaGrande} />
          </Animated.View>

          <Animated.View
            style={[styles.sombra, { opacity: clarear, transform: [{ scaleX: encolher }] }]}
          />
        </View>

        <Text style={styles.tituloVazio}>Nada na barra ainda</Text>
        <Text style={styles.textoVazio}>
          Escolha uma divisão ou um grupo acima e monte o treino de hoje.
        </Text>

        {ultimoTreino && (
          <Pressable
            onPress={aoRepetir}
            style={({ pressed }) => [styles.botaoRepetir, pressed && styles.botaoRepetirAtivo]}
          >
            {({ pressed }) => (
              <Text style={[styles.textoRepetir, pressed && styles.textoAtivo]}>{textoBotao}</Text>
            )}
          </Pressable>
        )}
      </View>
    </Aparecer>
  );
}

export default function TelaTreino({
  usuario,
  historico = [],
  aoSair,
  aoSalvarTreino,
  aoVerHistorico,
  aoVerMedidas,
  aoVerLembrete,
  aoVerAgua,
  aoVerAssistente,
}) {
  const [exercicios, setExercicios] = useState([]);
  const [personalizados, setPersonalizados] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [grupoModal, setGrupoModal] = useState(null);
  const [divisaoAberta, setDivisaoAberta] = useState(null);
  const [exercicioConcluindo, setExercicioConcluindo] = useState(null);
  const [temporizadorVisivel, setTemporizadorVisivel] = useState(false);
  const [anotacao, setAnotacao] = useState('');
  const [anotacaoFocada, setAnotacaoFocada] = useState(false);
  const [comemoracao, setComemoracao] = useState(null);
  const [prescrito, setPrescrito] = useState(null); // treino montado pelo professor
  const carregouInicial = useRef(false);

  // Tudo isso vem do histórico (que o App carrega do Supabase) e se atualiza sozinho.
  const ultimasCargas = useMemo(() => montarUltimasCargas(historico), [historico]);
  const recordes = useMemo(() => montarRecordes(historico), [historico]);
  const sequencia = useMemo(
    () => calcularSequencia(montarDatasTreino(historico)),
    [historico]
  );
  const sugestao = useMemo(() => sugestaoDoHistorico(historico), [historico]);
  const ultimoTreino = useMemo(() => ultimoTreinoDoHistorico(historico), [historico]);

  const concluidos = exercicios.filter((item) => item.concluido).length;

  // Sequência contando o treino de hoje (que ainda não está no histórico).
  const treinouHoje = historico[0] && historico[0].data === formatarData(new Date());
  const sequenciaComHoje = treinouHoje ? sequencia : sequencia + 1;

  // Carrega o treino em andamento da nuvem.
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('andamento')
        .select('exercicios')
        .maybeSingle();

      if (error) {
        console.log('Erro ao carregar treino em andamento', error);
        return;
      }

      setExercicios(data?.exercicios || []);
      carregouInicial.current = true;
    }
    carregar();
  }, []);

  // Carrega da nuvem os exercícios que o aluno criou.
  useEffect(() => {
    async function carregarPersonalizados() {
      const { data, error } = await supabase
        .from('exercicios_personalizados')
        .select('id, nome, grupo')
        .order('criado_em', { ascending: true });

      if (error) {
        console.log('Erro ao carregar exercícios personalizados', error);
        return;
      }

      setPersonalizados(data || []);
    }
    carregarPersonalizados();
  }, []);

  // Carrega o treino que o professor montou para este aluno (se houver).
  useEffect(() => {
    async function carregarPrescrito() {
      const { data, error } = await supabase
        .from('treinos_prescritos')
        .select('exercicios')
        .maybeSingle();

      if (error) {
        console.log('Erro ao carregar treino do professor', error);
        return;
      }

      setPrescrito(data?.exercicios?.length ? data.exercicios : null);
    }
    carregarPrescrito();
  }, []);

  // Salva o treino em andamento na nuvem a cada mudança.
  useEffect(() => {
    if (!carregouInicial.current) return;

    supabase
      .from('andamento')
      .upsert(
        { exercicios, atualizado_em: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .then(({ error }) => {
        if (error) console.log('Erro ao salvar treino em andamento', error);
      });
  }, [exercicios]);

  // Se a lista de exercícios ficar vazia, a anotação do treino é descartada.
  useEffect(() => {
    if (exercicios.length === 0) {
      setAnotacao('');
    }
  }, [exercicios.length]);

  // Quando todos os exercícios estão concluídos, começa a comemoração.
  // O treino só é salvo no histórico quando ela termina.
  useEffect(() => {
    if (exercicios.length > 0 && concluidos === exercicios.length && !comemoracao) {
      setTemporizadorVisivel(false);
      setComemoracao({
        exercicios,
        anotacao,
        recordes: exercicios.filter((ex) => ehNovoRecorde(ex)).length,
        nomesRecorde: exercicios.filter((ex) => ehNovoRecorde(ex)).map((ex) => ex.nome),
        divisao: divisaoDoTreino(exercicios),
      });
    }
  }, [concluidos]);

  // Fim da comemoração: salva o treino no histórico e limpa a lista.
  function terminarComemoracao() {
    if (!comemoracao) return;

    aoSalvarTreino(comemoracao.exercicios, comemoracao.anotacao);
    setComemoracao(null);
    setAnotacao('');
    setExercicios([]);
  }

  // É recorde quando o exercício já tem histórico e a carga atual passa da maior de antes.
  function ehNovoRecorde(exercicio) {
    const recorde = recordes[exercicio.nome];
    if (recorde === undefined) return false;
    return paraNumero(exercicio.peso) > recorde;
  }

  // A carga da última vez que o aluno fez esse exercício (ou vazio, se nunca fez).
  function cargaInicial(nome) {
    const ultima = ultimasCargas[nome];
    return ultima && ultima.peso ? String(ultima.peso) : '';
  }

  function abrirModal(nomeGrupo) {
    setGrupoModal(nomeGrupo);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
  }

  function abrirDivisao(divisao) {
    setDivisaoAberta(divisao);
  }

  function fecharDivisao() {
    setDivisaoAberta(null);
  }

  // Copia o treino mais recente do histórico para a lista de hoje.
  // Mantém séries, repetições e cargas, e deixa tudo como não concluído.
  function repetirUltimoTreino() {
    if (!ultimoTreino) return;

    const base = Date.now();

    const copia = ultimoTreino.lista.map((ex, indice) => ({
      id: (base + indice).toString(),
      nome: ex.nome,
      series: ex.series || '3',
      repeticoes: ex.repeticoes || '12',
      peso: ex.peso ? String(ex.peso) : '',
      grupo: ex.grupo,
      concluido: false,
    }));

    setExercicios(copia);
  }

  // Copia o treino do professor para a lista de hoje.
  function carregarTreinoDoProfessor() {
    if (!prescrito) return;

    const base = Date.now();

    const copia = prescrito.map((ex, indice) => ({
      id: (base + indice).toString(),
      nome: ex.nome,
      series: ex.series || '3',
      repeticoes: ex.repeticoes || '12',
      peso: ex.peso ? String(ex.peso) : cargaInicial(ex.nome),
      grupo: ex.grupo,
      concluido: false,
    }));

    setExercicios(copia);
  }

  // Adiciona vários exercícios de uma vez, sem repetir os que já estão na lista.
  function adicionarDaDivisao(lista) {
    const nomesAtuais = exercicios.map((item) => item.nome);
    const base = Date.now();

    const novos = lista
      .filter((item) => !nomesAtuais.includes(item.nome))
      .map((item, indice) => ({
        id: (base + indice).toString(),
        nome: item.nome,
        series: '3',
        repeticoes: '12',
        peso: cargaInicial(item.nome),
        grupo: item.grupo,
        concluido: false,
      }));

    if (novos.length > 0) {
      setExercicios([...exercicios, ...novos]);
    }
  }

  function adicionarExercicio(nomeExercicio) {
    const novoExercicio = {
      id: Date.now().toString(),
      nome: nomeExercicio,
      series: '3',
      repeticoes: '12',
      peso: cargaInicial(nomeExercicio),
      grupo: grupoModal,
      concluido: false,
    };

    setExercicios([...exercicios, novoExercicio]);
    setModalVisivel(false);
  }

  // Cria um exercício novo: guarda na nuvem para as próximas vezes e já o adiciona ao treino.
  async function criarPersonalizado(nome) {
    const grupo = grupoModal;
    const temporario = { id: `novo-${Date.now()}`, nome, grupo };

    setPersonalizados((atual) => [...atual, temporario]);
    adicionarExercicio(nome);

    const { data, error } = await supabase
      .from('exercicios_personalizados')
      .insert({ nome, grupo })
      .select('id, nome, grupo')
      .single();

    if (error) {
      console.log('Erro ao salvar exercício personalizado', error);
      setPersonalizados((atual) => atual.filter((item) => item.id !== temporario.id));
      return;
    }

    setPersonalizados((atual) =>
      atual.map((item) => (item.id === temporario.id ? data : item))
    );
  }

  // Apaga o exercício da lista do aluno. Treinos já feitos continuam no histórico.
  async function apagarPersonalizado(id) {
    setPersonalizados((atual) => atual.filter((item) => item.id !== id));

    if (String(id).startsWith('novo-')) return;

    const { error } = await supabase.from('exercicios_personalizados').delete().eq('id', id);

    if (error) console.log('Erro ao apagar exercício personalizado', error);
  }

  // Tocar no círculo: se vai concluir, abre a janelinha da carga.
  // Se já estava concluído, só desmarca.
  function alternarConcluido(id) {
    const exercicio = exercicios.find((item) => item.id === id);
    if (!exercicio) return;

    if (exercicio.concluido) {
      setExercicios(
        exercicios.map((item) => (item.id === id ? { ...item, concluido: false } : item))
      );
      return;
    }

    setExercicioConcluindo(exercicio);
  }

  // Confirmou a carga na janelinha: conclui o exercício com esse peso.
  function confirmarConclusao(peso) {
    const alvo = exercicioConcluindo;
    if (!alvo) return;

    const faltam = exercicios.filter((item) => !item.concluido).length;

    setExercicios(
      exercicios.map((item) =>
        item.id === alvo.id ? { ...item, peso, concluido: true } : item
      )
    );
    setExercicioConcluindo(null);

    // Só abre o descanso se ainda faltar exercício. No último, vem a comemoração.
    if (faltam > 1) {
      setTemporizadorVisivel(true);
    }
  }

  function limparConcluidos() {
    setExercicios(exercicios.filter((item) => !item.concluido));
  }

  // Tudo que fica acima da lista de exercícios.
  // Está dentro da lista para a tela inteira rolar junto.
  const cabecalhoDaLista = (
    <View>
      <View style={styles.topo}>
        <View style={styles.marca}>
          <Logo tamanho={56} style={styles.logo} />
          <View style={styles.nomeMarca}>
            <Text style={styles.academia}>Academia</Text>
            <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
          </View>
        </View>

        <Pressable
          onPress={aoSair}
          hitSlop={10}
          style={({ pressed }) => [styles.botaoSair, pressed && styles.limparPressionado]}
        >
          <Text style={styles.sair}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.linhaAmarela} />

      <Aparecer atraso={0}>
        <View style={styles.barraAcoes}>
          <Pressable
            onPress={aoVerHistorico}
            style={({ pressed }) => [
              styles.botaoCabecalho,
              styles.botaoCabecalhoEspaco,
              pressed && styles.botaoCabecalhoAtivo,
            ]}
          >
            {({ pressed }) => (
              <Text style={[styles.textoBotaoCabecalho, pressed && styles.textoAtivo]}>
                Histórico
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={aoVerMedidas}
            style={({ pressed }) => [
              styles.botaoCabecalho,
              styles.botaoCabecalhoEspaco,
              pressed && styles.botaoCabecalhoAtivo,
            ]}
          >
            {({ pressed }) => (
              <Text style={[styles.textoBotaoCabecalho, pressed && styles.textoAtivo]}>
                Medidas
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={aoVerLembrete}
            style={({ pressed }) => [
              styles.botaoCabecalho,
              styles.botaoCabecalhoEspaco,
              pressed && styles.botaoCabecalhoAtivo,
            ]}
          >
            {({ pressed }) => (
              <Text style={[styles.textoBotaoCabecalho, pressed && styles.textoAtivo]}>
                Lembrete
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={aoVerAgua}
            style={({ pressed }) => [
              styles.botaoCabecalho,
              pressed && styles.botaoCabecalhoAtivo,
            ]}
          >
            {({ pressed }) => (
              <Text style={[styles.textoBotaoCabecalho, pressed && styles.textoAtivo]}>
                Água
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={aoVerAssistente}
          style={({ pressed }) => [
            styles.botaoAssistente,
            pressed && styles.botaoCabecalhoAtivo,
          ]}
        >
          {({ pressed }) => (
            <Text style={[styles.textoBotaoAssistente, pressed && styles.textoAtivo]}>
              Assistente: tire suas dúvidas
            </Text>
          )}
        </Pressable>
      </Aparecer>

      <Aparecer atraso={100}>
        <View style={styles.cabecalho}>
          <Text style={styles.saudacao}>
            {saudacaoDoDia()}, {usuario.nome}
          </Text>
          <Text style={styles.titulo}>Meu Treino</Text>
        </View>

        <ContadorSequencia valor={sequencia} />
      </Aparecer>

      {/* Se o professor montou um treino, o aluno só começa esse treino. */}
      {prescrito && exercicios.length === 0 && (
        <Aparecer atraso={200}>
          <TituloSecao
            titulo="Treino do professor"
            descricao={`${prescrito.length} exercícios montados para você`}
          />
          <Pressable
            onPress={carregarTreinoDoProfessor}
            style={({ pressed }) => [styles.botaoProfessor, pressed && styles.limparPressionado]}
          >
            <Text style={styles.textoBotaoProfessor}>Começar treino</Text>
          </Pressable>
        </Aparecer>
      )}

      {/* Sem treino do professor, tudo continua como antes. */}
      {!prescrito && (
        <>
          <Aparecer atraso={200}>
            <TituloSecao
              titulo="Treino pronto"
              descricao="Escolha uma divisão e adicione tudo de uma vez"
            />

            <View style={styles.divisoes}>
              {DIVISOES.map((item, indice) => {
                const aberta = divisaoAberta !== null && divisaoAberta.nome === item.nome;
                const sugerida = sugestao !== null && sugestao.nome === item.nome;

                return (
                  <Pressable
                    key={item.nome}
                    onPress={() => abrirDivisao(item)}
                    style={({ pressed }) => [
                      styles.divisao,
                      indice < DIVISOES.length - 1 && styles.divisaoEspaco,
                      sugerida && styles.divisaoSugerida,
                      (pressed || aberta) && styles.divisaoAtiva,
                    ]}
                  >
                    {({ pressed }) => (
                      <>
                        <Text
                          style={[
                            styles.nomeDivisao,
                            (pressed || aberta) && styles.textoAtivo,
                          ]}
                        >
                          {item.nome}
                        </Text>
                        <Text
                          style={[
                            styles.descricaoDivisao,
                            (pressed || aberta) && styles.textoAtivo,
                          ]}
                        >
                          {item.descricao}
                        </Text>
                        {sugerida && (
                          <View
                            style={[
                              styles.etiquetaSugestao,
                              (pressed || aberta) && styles.etiquetaSugestaoAtiva,
                            ]}
                          >
                            <Text
                              style={[
                                styles.textoEtiquetaSugestao,
                                (pressed || aberta) && styles.textoEtiquetaSugestaoAtiva,
                              ]}
                            >
                              {sugestao.hoje ? 'Hoje' : 'Próximo'}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Aparecer>

          <Aparecer atraso={320}>
            <TituloSecao
              titulo="Por grupo muscular"
              descricao="Ou monte o seu, exercício por exercício"
            />

            <View style={styles.grupos}>
              {GRUPOS.map((item) => {
                const aberto = modalVisivel && grupoModal === item.nome;

                return (
                  <Pressable
                    key={item.nome}
                    onPress={() => abrirModal(item.nome)}
                    style={({ pressed }) => [
                      styles.chip,
                      (pressed || aberto) && styles.chipAtivo,
                    ]}
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.textoChip,
                          (pressed || aberto) && styles.textoChipAtivo,
                        ]}
                      >
                        {item.nome}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Aparecer>
        </>
      )}

      {exercicios.length > 0 && (
        <BarraProgresso total={exercicios.length} concluidos={concluidos} />
      )}

      {concluidos > 0 && (
        <Pressable
          onPress={limparConcluidos}
          style={({ pressed }) => [styles.limpar, pressed && styles.limparPressionado]}
        >
          <Text style={styles.textoLimpar}>
            Limpar {concluidos} {concluidos === 1 ? 'concluído' : 'concluídos'}
          </Text>
        </Pressable>
      )}
    </View>
  );

  // Campo de anotação, no fim da lista. Só aparece quando há exercícios.
  const rodapeDaLista = (
    <Aparecer>
      <View style={styles.anotacao}>
        <TituloSecao
          titulo="Como foi o treino?"
          descricao="Opcional. Fica salva junto com o treino"
        />

        <TextInput
          style={[styles.campoAnotacao, anotacaoFocada && styles.campoAnotacaoFocado]}
          value={anotacao}
          onChangeText={setAnotacao}
          onFocus={() => setAnotacaoFocada(true)}
          onBlur={() => setAnotacaoFocada(false)}
          placeholder="Anote antes do último exercício. Ex: dormi mal, ombro doendo"
          placeholderTextColor={CORES.textoSecundario}
          multiline
          maxLength={200}
        />
        <Text style={styles.contadorAnotacao}>{anotacao.length}/200</Text>
      </View>
    </Aparecer>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={exercicios}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={cabecalhoDaLista}
        ListFooterComponent={exercicios.length > 0 ? rodapeDaLista : null}
        contentContainerStyle={styles.conteudoLista}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <CartaoExercicio
            exercicio={item}
            indice={index}
            ultimaCarga={ultimasCargas[item.nome]}
            novoRecorde={ehNovoRecorde(item)}
            somenteLeitura
            aoAlternar={() => alternarConcluido(item.id)}
          />
        )}
        ListEmptyComponent={
          prescrito ? null : (
            <EstadoVazio ultimoTreino={ultimoTreino} aoRepetir={repetirUltimoTreino} />
          )
        }
      />

      <ModalExercicios
        visivel={modalVisivel}
        grupo={grupoModal}
        personalizados={personalizados}
        aoFechar={fecharModal}
        aoSelecionar={adicionarExercicio}
        aoCriar={criarPersonalizado}
        aoApagar={apagarPersonalizado}
      />

      <ModalDivisao
        visivel={divisaoAberta !== null}
        divisao={divisaoAberta}
        jaAdicionados={exercicios.map((item) => item.nome)}
        aoFechar={fecharDivisao}
        aoAdicionar={adicionarDaDivisao}
      />

      <ModalCarga
        visivel={exercicioConcluindo !== null}
        exercicio={exercicioConcluindo}
        ultimaCarga={exercicioConcluindo ? ultimasCargas[exercicioConcluindo.nome] : null}
        aoCancelar={() => setExercicioConcluindo(null)}
        aoConfirmar={confirmarConclusao}
      />

      <TemporizadorDescanso
        visivel={temporizadorVisivel}
        aoFechar={() => setTemporizadorVisivel(false)}
      />

      <Comemoracao
        visivel={comemoracao !== null}
        total={comemoracao ? comemoracao.exercicios.length : 0}
        recordes={comemoracao ? comemoracao.recordes : 0}
        sequencia={sequenciaComHoje}
        exercicios={comemoracao ? comemoracao.exercicios : []}
        divisao={comemoracao ? comemoracao.divisao : null}
        nomesRecorde={comemoracao ? comemoracao.nomesRecorde : []}
        aoTerminar={terminarComemoracao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  conteudoLista: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    alignSelf: 'auto',
    marginBottom: 0,
  },
  nomeMarca: {
    marginLeft: 12,
  },
  academia: {
    fontSize: 12,
    fontStyle: 'italic',
    color: CORES.textoSecundario,
  },
  nomeAcademia: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  botaoSair: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sair: {
    fontSize: 14,
    color: CORES.textoSecundario,
    fontWeight: 'bold',
  },
  linhaAmarela: {
    height: 4,
    backgroundColor: CORES.destaque,
    marginHorizontal: -20,
    marginBottom: 16,
  },
  barraAcoes: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  botaoCabecalho: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 10,
  },
  botaoCabecalhoEspaco: {
    marginRight: 8,
  },
  botaoCabecalhoAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoBotaoCabecalho: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  botaoAssistente: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.destaque,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 20,
  },
  textoBotaoAssistente: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  cabecalho: {
    marginBottom: 8,
  },
  saudacao: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },

  // Títulos de seção
  secao: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 8,
    marginBottom: 12,
  },
  barraSecao: {
    width: 4,
    borderRadius: 2,
    backgroundColor: CORES.destaque,
    marginRight: 10,
  },
  textosSecao: {
    flex: 1,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  descricaoSecao: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },

  // Treino do professor
  botaoProfessor: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoBotaoProfessor: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },

  divisoes: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  divisao: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  divisaoEspaco: {
    marginRight: 8,
  },
  divisaoSugerida: {
    borderColor: CORES.destaque,
  },
  divisaoAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  nomeDivisao: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  descricaoDivisao: {
    fontSize: 11,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginTop: 2,
  },
  textoAtivo: {
    color: CORES.textoSobreDestaque,
  },
  etiquetaSugestao: {
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginTop: 8,
  },
  etiquetaSugestaoAtiva: {
    backgroundColor: CORES.textoSobreDestaque,
  },
  textoEtiquetaSugestao: {
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.textoSobreDestaque,
  },
  textoEtiquetaSugestaoAtiva: {
    color: CORES.destaque,
  },
  grupos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoChip: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  textoChipAtivo: {
    color: CORES.textoSobreDestaque,
  },
  limpar: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  limparPressionado: {
    opacity: 0.6,
  },
  textoLimpar: {
    fontSize: 13,
    color: CORES.textoSecundario,
    fontWeight: 'bold',
  },

  // Estado vazio
  vazio: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 12,
  },
  palco: {
    height: 100,
    width: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  barraCompleta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  barra: {
    width: 70,
    height: 6,
    backgroundColor: CORES.textoSecundario,
  },
  manga: {
    width: 8,
    height: 10,
    backgroundColor: CORES.borda,
  },
  anilhaPequena: {
    width: 8,
    height: 30,
    borderRadius: 2,
    backgroundColor: CORES.texto,
    marginHorizontal: 1,
  },
  anilhaGrande: {
    width: 12,
    height: 48,
    borderRadius: 3,
    backgroundColor: CORES.destaque,
    marginHorizontal: 1,
  },
  sombra: {
    width: 150,
    height: 6,
    borderRadius: 3,
    backgroundColor: CORES.borda,
  },
  tituloVazio: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginBottom: 6,
  },
  textoVazio: {
    fontSize: 14,
    color: CORES.textoSecundario,
    textAlign: 'center',
    maxWidth: 260,
  },
  botaoRepetir: {
    borderWidth: 1.5,
    borderColor: CORES.destaque,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 20,
  },
  botaoRepetirAtivo: {
    backgroundColor: CORES.destaque,
  },
  textoRepetir: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.destaque,
  },

  // Anotação do treino
  anotacao: {
    marginTop: 16,
  },
  campoAnotacao: {
    minHeight: 80,
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CORES.texto,
    textAlignVertical: 'top',
  },
  campoAnotacaoFocado: {
    borderColor: CORES.destaque,
  },
  contadorAnotacao: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 6,
  },
});