import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BotaoAssistente from '../components/AssistantButton';
import BarraProgresso from '../components/ProgressBar';
import CartaoExercicio from '../components/ExerciseCard';
import Comemoracao from '../components/Celebration';
import ModalCarga from '../components/WeightModal';
import ModalDivisao from '../components/SplitModal';
import ModalExercicios from '../components/ExercisesModal';
import TemporizadorDescanso from '../components/RestTimer';
import { api } from '../utils/api';
import { DIVISOES } from '../utils/splits';
import { GRUPOS } from '../utils/muscleGroups';

// No celular a animação roda no motor nativo (mais fluida). No navegador, não existe.
const USAR_NATIVO = Platform.OS !== 'web';

// Paleta do visual novo. Fica aqui por enquanto para não afetar as outras telas.
// Depois dá para mover para utils/theme.js.
const P = {
  fundo: '#F1EFE4',
  verde: '#0F3D2E',
  verdeClaro: '#14573F',
  limao: '#D6F24A',
  texto: '#0B1F17',
  textoSecundario: '#55655C',
  cartao: '#E6E3D3',
  textoSobreVerde: '#F1EFE4',
  textoSuaveSobreVerde: '#BFD3C6',
  pontoVazio: '#B5B8A8',
};

// Fonte condensada do título. Deixe undefined para usar a fonte padrão.
// Depois de instalar a fonte (veja as instruções), troque por 'Anton_400Regular'.
const FONTE_TITULO = undefined;

// Vibração leve nos botões principais (no navegador não faz nada).
function vibrar() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

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

// Monta os 7 dias da semana atual (segunda a domingo) para a faixa do topo.
function montarSemana(datas) {
  const conjunto = new Set(datas);
  const hoje = new Date();
  const posicaoHoje = (hoje.getDay() + 6) % 7; // segunda = 0 ... domingo = 6
  const letras = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return letras.map((letra, indice) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - posicaoHoje + indice);

    return {
      letra,
      treinou: conjunto.has(formatarData(dia)),
      hoje: indice === posicaoHoje,
    };
  });
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

  return { lista, divisao: divisaoDoTreino(lista), data: ultimo.data || null };
}

// ----- Fila de treinos do professor -----

// Descobre qual é o treino da vez.
// Olha o histórico: acha o último treino da fila que o aluno concluiu e libera o seguinte.
// Se nunca fez nenhum, usa o que o professor marcou como próximo (ou o primeiro).
function treinoDaVez(prescrito, historico) {
  if (!prescrito || prescrito.treinos.length === 0) return null;

  const { treinos, proximoId } = prescrito;

  for (const registro of historico) {
    const lista = Array.isArray(registro) ? registro : registro.exercicios || [];
    const idFeito = lista.find((ex) => ex.treinoId)?.treinoId;
    if (!idFeito) continue;

    const indice = treinos.findIndex((t) => t.id === idFeito);
    if (indice >= 0) {
      return treinos[(indice + 1) % treinos.length];
    }
  }

  return treinos.find((t) => t.id === proximoId) || treinos[0];
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

// Cabeçalho de seção: só título e uma linha de apoio.
function TituloSecao({ titulo, descricao }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSecao}>{titulo}</Text>
      <Text style={styles.descricaoSecao}>{descricao}</Text>
    </View>
  );
}

// Faixa da semana: sete dias com o de hoje destacado, e a sequência logo abaixo.
function FaixaSemana({ dias, sequencia }) {
  return (
    <View>
      <View style={styles.semana}>
        {dias.map((dia, indice) => (
          <View
            key={indice}
            style={[
              styles.diaSemana,
              indice < dias.length - 1 && styles.diaSemanaEspaco,
              dia.hoje && styles.diaSemanaHoje,
            ]}
          >
            <Text style={[styles.letraDia, dia.hoje && styles.letraDiaHoje]}>{dia.letra}</Text>
            <View
              style={[
                styles.pontoDia,
                dia.treinou && styles.pontoDiaTreinou,
                dia.hoje && styles.pontoDiaHoje,
              ]}
            />
          </View>
        ))}
      </View>

      <Text style={styles.textoSequencia}>
        <Text style={styles.numeroSequencia}>{sequencia}</Text>{' '}
        {sequencia === 1 ? 'dia seguido' : 'dias seguidos'} de treino
      </Text>
    </View>
  );
}

// Cartão grande do treino (usado no treino sugerido e no do professor).
function CartaoGrande({ etiqueta, nome, descricao, aoComecar }) {
  return (
    <View style={styles.cartaoHoje}>
      <View style={styles.circuloDecorativo} />

      <View style={styles.pilulaEtiqueta}>
        <Text style={styles.textoEtiqueta}>{etiqueta.toUpperCase()}</Text>
      </View>

      <Text
        style={styles.nomeHoje}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {nome.toUpperCase()}
      </Text>
      <Text style={styles.musculosHoje}>{descricao}</Text>

      <Pressable
        onPress={() => {
          vibrar();
          aoComecar();
        }}
        style={({ pressed }) => [styles.botaoComecar, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotaoComecar}>Começar treino</Text>
        <Ionicons name="arrow-forward" size={18} color={P.verde} />
      </Pressable>
    </View>
  );
}

// Estado vazio: um texto curto e, se houver treino no histórico, uma linha para repeti-lo.
function EstadoVazio({ ultimoTreino, aoRepetir }) {
  const detalhe = ultimoTreino
    ? [ultimoTreino.divisao, ultimoTreino.data].filter(Boolean).join(' · ')
    : '';

  return (
    <Aparecer atraso={450}>
      <View style={styles.vazio}>
        <Text style={styles.textoVazio}>
          Nenhum exercício por aqui ainda. Escolha uma divisão ou um grupo acima para montar o
          treino de hoje.
        </Text>

        {ultimoTreino && (
          <Pressable
            onPress={() => {
              vibrar();
              aoRepetir();
            }}
            style={({ pressed }) => [styles.linhaRepetir, pressed && styles.pressionado]}
          >
            <View style={styles.iconeRepetir}>
              <Ionicons name="refresh" size={20} color={P.limao} />
            </View>
            <View style={styles.textosRepetir}>
              <Text style={styles.tituloRepetir}>Repetir o último treino</Text>
              {detalhe !== '' && <Text style={styles.detalheRepetir}>{detalhe}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={P.textoSecundario} />
          </Pressable>
        )}
      </View>
    </Aparecer>
  );
}

export default function TelaTreino({
  usuario,
  historico = [],
  aoSalvarTreino,
  aoVerPerfil,
  aoVerAssistente,
}) {
  const [exercicios, setExercicios] = useState([]);
  const [personalizados, setPersonalizados] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [grupoModal, setGrupoModal] = useState(null);
  const [divisaoAberta, setDivisaoAberta] = useState(null);
  const [divisaoEscolhida, setDivisaoEscolhida] = useState(null); // só visual: qual aparece no cartão de hoje
  const [exercicioConcluindo, setExercicioConcluindo] = useState(null);
  const [temporizadorVisivel, setTemporizadorVisivel] = useState(false);
  const [anotacao, setAnotacao] = useState('');
  const [anotacaoFocada, setAnotacaoFocada] = useState(false);
  const [comemoracao, setComemoracao] = useState(null);
  const [prescrito, setPrescrito] = useState(null); // { treinos, proximoId } montado pelo professor
  const carregouInicial = useRef(false);

  // Tudo isso vem do histórico (que o App carrega da API) e se atualiza sozinho.
  const ultimasCargas = useMemo(() => montarUltimasCargas(historico), [historico]);
  const recordes = useMemo(() => montarRecordes(historico), [historico]);
  const sequencia = useMemo(
    () => calcularSequencia(montarDatasTreino(historico)),
    [historico]
  );
  const semana = useMemo(() => montarSemana(montarDatasTreino(historico)), [historico]);
  const sugestao = useMemo(() => sugestaoDoHistorico(historico), [historico]);
  const ultimoTreino = useMemo(() => ultimoTreinoDoHistorico(historico), [historico]);
  const treinoAtual = useMemo(() => treinoDaVez(prescrito, historico), [prescrito, historico]);

  const concluidos = exercicios.filter((item) => item.concluido).length;

  // Sequência contando o treino de hoje (que ainda não está no histórico).
  const treinouHoje = historico[0] && historico[0].data === formatarData(new Date());
  const sequenciaComHoje = treinouHoje ? sequencia : sequencia + 1;

  // Divisão mostrada no cartão grande: a que o aluno tocou, senão a sugerida, senão a primeira.
  const nomeDoCartao = divisaoEscolhida || (sugestao ? sugestao.nome : DIVISOES[0].nome);
  const divisaoDoCartao = DIVISOES.find((d) => d.nome === nomeDoCartao) || DIVISOES[0];
  const etiquetaDoCartao = sugestao
    ? sugestao.nome === divisaoDoCartao.nome
      ? sugestao.hoje
        ? 'Treino de hoje'
        : 'Próximo treino'
      : 'Outra divisão'
    : 'Sugestão para começar';

  // Carrega o treino em andamento da nuvem.
  useEffect(() => {
    async function carregar() {
      try {
        const data = await api('GET', '/andamento');
        setExercicios(data?.exercicios || []);
        carregouInicial.current = true;
      } catch (e) {
        console.log('Erro ao carregar treino em andamento', e);
      }
    }
    carregar();
  }, []);

  // Carrega da nuvem os exercícios que o aluno criou.
  useEffect(() => {
    async function carregarPersonalizados() {
      try {
        const data = await api('GET', '/exercicios-personalizados');
        setPersonalizados(data || []);
      } catch (e) {
        console.log('Erro ao carregar exercícios personalizados', e);
      }
    }
    carregarPersonalizados();
  }, []);

  // Carrega os treinos que o professor montou para este aluno (se houver).
  // Aceita o formato novo ({ treinos, proximoId }) e o antigo (lista única).
  useEffect(() => {
    async function carregarPrescrito() {
      let data = null;
      try {
        data = await api('GET', '/treinos-prescritos');
      } catch (e) {
        console.log('Erro ao carregar treino do professor', e);
        return;
      }

      const bruto = data?.exercicios;

      if (Array.isArray(bruto)) {
        setPrescrito(
          bruto.length > 0
            ? { treinos: [{ id: 't1', nome: 'Treino 1', exercicios: bruto }], proximoId: 't1' }
            : null
        );
      } else if (bruto?.treinos?.length) {
        setPrescrito({ treinos: bruto.treinos, proximoId: bruto.proximoId || null });
      } else {
        setPrescrito(null);
      }
    }
    carregarPrescrito();
  }, []);

  // Salva o treino em andamento na nuvem a cada mudança.
  useEffect(() => {
    if (!carregouInicial.current) return;

    api('PUT', '/andamento', { exercicios }).catch((e) => {
      console.log('Erro ao salvar treino em andamento', e);
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

  // Copia o treino da vez (definido pelo professor) para a lista de hoje.
  // Cada exercício leva o id e o nome do treino, para o histórico saber qual foi feito.
  function carregarTreinoDoProfessor() {
    if (!treinoAtual) return;

    const base = Date.now();

    const copia = treinoAtual.exercicios.map((ex, indice) => ({
      id: (base + indice).toString(),
      nome: ex.nome,
      series: ex.series || '3',
      repeticoes: ex.repeticoes || '12',
      peso: ex.peso ? String(ex.peso) : cargaInicial(ex.nome),
      grupo: ex.grupo,
      concluido: false,
      treinoId: treinoAtual.id,
      treinoNome: treinoAtual.nome,
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

    try {
      const data = await api('POST', '/exercicios-personalizados', { nome, grupo });
      setPersonalizados((atual) =>
        atual.map((item) => (item.id === temporario.id ? data : item))
      );
    } catch (e) {
      console.log('Erro ao salvar exercício personalizado', e);
      setPersonalizados((atual) => atual.filter((item) => item.id !== temporario.id));
    }
  }

  // Apaga o exercício da lista do aluno. Treinos já feitos continuam no histórico.
  async function apagarPersonalizado(id) {
    setPersonalizados((atual) => atual.filter((item) => item.id !== id));

    if (String(id).startsWith('novo-')) return;

    try {
      await api('DELETE', '/exercicios-personalizados/' + id);
    } catch (e) {
      console.log('Erro ao apagar exercício personalizado', e);
    }
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

  // Inicial do nome, para o avatar do topo.
  const inicial = (usuario.nome || '?').trim().charAt(0).toUpperCase();

  // Tudo que fica acima da lista de exercícios.
  // Está dentro da lista para a tela inteira rolar junto.
  const cabecalhoDaLista = (
    <View>
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
          onPress={aoVerPerfil}
          hitSlop={8}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressionado]}
        >
          <Text style={styles.avatarLetra}>{inicial}</Text>
        </Pressable>
      </View>

      <Aparecer atraso={100}>
        <View style={styles.cabecalho}>
          <Text style={styles.saudacao}>
            {saudacaoDoDia()}, {usuario.nome}
          </Text>
          <Text style={styles.titulo}>Meu treino</Text>
        </View>

        <FaixaSemana dias={semana} sequencia={sequencia} />
      </Aparecer>

      {/* Se o professor montou treinos, o aluno só faz o treino da vez. */}
      {treinoAtual && exercicios.length === 0 && (
        <Aparecer atraso={200}>
          <CartaoGrande
            etiqueta="Treino do professor"
            nome={treinoAtual.nome}
            descricao={`${treinoAtual.exercicios.length} exercícios montados para você`}
            aoComecar={carregarTreinoDoProfessor}
          />
        </Aparecer>
      )}

      {/* Sem treino do professor, tudo continua como antes. */}
      {!prescrito && (
        <>
          <Aparecer atraso={200}>
            <CartaoGrande
              etiqueta={etiquetaDoCartao}
              nome={divisaoDoCartao.nome}
              descricao={divisaoDoCartao.descricao}
              aoComecar={() => abrirDivisao(divisaoDoCartao)}
            />

            <View style={styles.opcoesDivisao}>
              {DIVISOES.map((item, indice) => {
                const selecionada = item.nome === divisaoDoCartao.nome;

                return (
                  <Pressable
                    key={item.nome}
                    onPress={() => setDivisaoEscolhida(item.nome)}
                    style={({ pressed }) => [
                      styles.opcaoDivisao,
                      indice < DIVISOES.length - 1 && styles.opcaoDivisaoEspaco,
                      selecionada && styles.opcaoDivisaoSelecionada,
                      pressed && styles.pressionado,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoOpcaoDivisao,
                        selecionada && styles.textoOpcaoDivisaoSelecionada,
                      ]}
                    >
                      {item.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Aparecer>

          <Aparecer atraso={320}>
            <TituloSecao
              titulo="Ou escolha por grupo"
              descricao="Monte o seu, exercício por exercício"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gruposScroll}
              contentContainerStyle={styles.grupos}
            >
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
            </ScrollView>
          </Aparecer>
        </>
      )}

      {exercicios.length > 0 && (
        <View style={styles.progresso}>
          <BarraProgresso total={exercicios.length} concluidos={concluidos} />
        </View>
      )}

      {concluidos > 0 && (
        <Pressable
          onPress={limparConcluidos}
          style={({ pressed }) => [styles.limpar, pressed && styles.pressionado]}
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
          placeholderTextColor={P.textoSecundario}
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

      <BotaoAssistente aoPressionar={aoVerAssistente} />

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
    backgroundColor: P.fundo,
  },
  conteudoLista: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  pressionado: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  // Topo
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 24,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  mascot: {
    width: 24,
    height: 32,
  },
  nomeAcademia: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: P.texto,
    fontFamily: FONTE_TITULO,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressionado: {
    transform: [{ scale: 0.92 }],
  },
  avatarLetra: {
    fontSize: 16,
    fontWeight: '700',
    color: P.limao,
  },

  // Saudação e título
  cabecalho: {
    marginBottom: 20,
  },
  saudacao: {
    fontSize: 15,
    color: P.textoSecundario,
    marginBottom: 6,
  },
  titulo: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: P.texto,
  },

  // Faixa da semana
  semana: {
    flexDirection: 'row',
  },
  diaSemana: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 10,
  },
  diaSemanaEspaco: {
    marginRight: 6,
  },
  diaSemanaHoje: {
    backgroundColor: P.verde,
  },
  letraDia: {
    fontSize: 12,
    fontWeight: '700',
    color: P.textoSecundario,
  },
  letraDiaHoje: {
    color: P.textoSobreVerde,
  },
  pontoDia: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.pontoVazio,
    marginTop: 8,
  },
  pontoDiaTreinou: {
    backgroundColor: P.verde,
  },
  pontoDiaHoje: {
    backgroundColor: P.limao,
  },
  textoSequencia: {
    fontSize: 13,
    color: P.textoSecundario,
    marginTop: 12,
  },
  numeroSequencia: {
    fontWeight: '800',
    color: P.texto,
  },

  // Títulos de seção
  secao: {
    marginTop: 28,
    marginBottom: 14,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '700',
    color: P.texto,
  },
  descricaoSecao: {
    fontSize: 13,
    color: P.textoSecundario,
    marginTop: 4,
  },

  // Cartão grande do treino (de hoje ou do professor)
  cartaoHoje: {
    backgroundColor: P.verde,
    borderRadius: 32,
    padding: 24,
    marginTop: 20,
    overflow: 'hidden',
  },
  circuloDecorativo: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: P.verdeClaro,
  },
  pilulaEtiqueta: {
    alignSelf: 'flex-start',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoEtiqueta: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.verde,
  },
  nomeHoje: {
    fontSize: 88,
    lineHeight: 96,
    fontWeight: '900',
    letterSpacing: -2,
    color: P.textoSobreVerde,
    marginTop: 16,
    fontFamily: FONTE_TITULO,
  },
  musculosHoje: {
    fontSize: 14,
    lineHeight: 20,
    color: P.textoSuaveSobreVerde,
    marginTop: 4,
  },
  botaoComecar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 18,
    marginTop: 24,
  },
  textoBotaoComecar: {
    fontSize: 16,
    fontWeight: '800',
    color: P.verde,
    marginRight: 8,
  },

  // Opções de divisão (Push, Pull, Legs)
  opcoesDivisao: {
    flexDirection: 'row',
    marginTop: 16,
  },
  opcaoDivisao: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 14,
  },
  opcaoDivisaoEspaco: {
    marginRight: 8,
  },
  opcaoDivisaoSelecionada: {
    backgroundColor: P.verde,
  },
  textoOpcaoDivisao: {
    fontSize: 15,
    fontWeight: '700',
    color: P.textoSecundario,
  },
  textoOpcaoDivisaoSelecionada: {
    color: P.textoSobreVerde,
  },

  // Grupos musculares (linha que rola para o lado)
  gruposScroll: {
    marginHorizontal: -20,
  },
  grupos: {
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    marginRight: 8,
  },
  chipAtivo: {
    backgroundColor: P.verde,
  },
  textoChip: {
    fontSize: 14,
    fontWeight: '700',
    color: P.texto,
  },
  textoChipAtivo: {
    color: P.textoSobreVerde,
  },

  // Progresso e limpar concluídos
  progresso: {
    marginTop: 24,
  },
  limpar: {
    alignSelf: 'flex-end',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  textoLimpar: {
    fontSize: 13,
    fontWeight: '700',
    color: P.textoSecundario,
  },

  // Estado vazio
  vazio: {
    paddingTop: 28,
    paddingBottom: 8,
  },
  textoVazio: {
    fontSize: 14,
    lineHeight: 24,
    color: P.textoSecundario,
  },
  linhaRepetir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 16,
    marginTop: 24,
  },
  iconeRepetir: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textosRepetir: {
    flex: 1,
  },
  tituloRepetir: {
    fontSize: 15,
    fontWeight: '700',
    color: P.texto,
  },
  detalheRepetir: {
    fontSize: 13,
    color: P.textoSecundario,
    marginTop: 4,
  },

  // Anotação do treino
  anotacao: {
    marginTop: 8,
  },
  campoAnotacao: {
    minHeight: 96,
    backgroundColor: P.cartao,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: P.texto,
    textAlignVertical: 'top',
  },
  campoAnotacaoFocado: {
    backgroundColor: '#DDD9C6',
  },
  contadorAnotacao: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: P.textoSecundario,
    marginTop: 8,
  },
});