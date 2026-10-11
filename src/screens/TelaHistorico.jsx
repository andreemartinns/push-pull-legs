import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GraficoEvolucao from '../components/GraficoEvolucao';
import { DIVISOES } from '../utils/divisoes';
import { listarExerciciosComPeso, obterEvolucao } from '../utils/evolucao';
import { CORES } from '../utils/tema';

// ---- ajudantes ----

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Lê a data salva ("10/10/2026") e devolve dia, mês, ano e dia da semana.
function lerData(texto) {
  const partes = String(texto || '')
    .split('/')
    .map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;

  const [dia, mes, ano] = partes;
  const data = new Date(ano, mes - 1, dia);
  if (Number.isNaN(data.getTime())) return null;

  return { dia, mes, ano, diaSemana: data.getDay() };
}

// Descobre a que divisão (Push, Pull ou Legs) cada exercício pertence.
// Primeiro pelo nome, nos treinos prontos. Se não achar, pelo grupo muscular.
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

// Dá um nome ao treino: Push, Pull ou Legs quando uma divisão domina (60% ou mais),
// "Misto" quando mistura, ou o próprio grupo quando é um treino de um grupo só.
function nomeDoTreino(exercicios) {
  const contagem = {};
  let total = 0;

  for (const ex of exercicios) {
    const nome = DIVISAO_POR_NOME[ex.nome] || DIVISAO_POR_GRUPO[ex.grupo];
    if (nome) {
      contagem[nome] = (contagem[nome] || 0) + 1;
      total += 1;
    }
  }

  if (total === 0) {
    const grupos = [...new Set(exercicios.map((ex) => ex.grupo).filter(Boolean))];
    return grupos.length === 1 ? grupos[0] : 'Treino livre';
  }

  let melhor = null;
  for (const nome of Object.keys(contagem)) {
    if (melhor === null || contagem[nome] > contagem[melhor]) melhor = nome;
  }

  return contagem[melhor] / total >= 0.6 ? melhor : 'Misto';
}

// Lista os grupos musculares do treino, sem repetir ("Peito, Ombros, Braços").
function gruposDoTreino(exercicios) {
  return [...new Set(exercicios.map((ex) => ex.grupo).filter(Boolean))].join(', ');
}

// Separa o histórico em meses, do mais novo para o mais antigo.
function agruparPorMes(historico) {
  const mapa = new Map();

  historico.forEach((item) => {
    const data = lerData(item.data);
    const chave = data ? `${data.ano}-${data.mes}` : 'sem-data';
    const titulo = data ? `${MESES[data.mes - 1]} de ${data.ano}` : 'Sem data';

    if (!mapa.has(chave)) mapa.set(chave, { titulo, data: [] });
    mapa.get(chave).data.push(item);
  });

  return [...mapa.values()];
}

function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}

// ---- fim dos ajudantes ----

// Um treino do histórico: fechado mostra o essencial, aberto mostra os exercícios.
function CartaoTreino({ item, aberto, aoAlternar }) {
  const exercicios = item.exercicios || [];
  const data = lerData(item.data);

  return (
    <View style={[styles.cartaoTreino, aberto && styles.cartaoTreinoAberto]}>
      <TouchableOpacity style={styles.cabecalhoTreino} onPress={aoAlternar} activeOpacity={0.8}>
        <View style={styles.dia}>
          <Text style={styles.diaSemana}>{data ? DIAS[data.diaSemana] : '--'}</Text>
          <Text style={styles.diaNumero}>{data ? data.dia : ''}</Text>
        </View>

        <View style={styles.resumoTreino}>
          <Text style={styles.nomeTreino}>{nomeDoTreino(exercicios)}</Text>
          <Text style={styles.subTreino} numberOfLines={1}>
            {plural(exercicios.length, 'exercício', 'exercícios')}
            {gruposDoTreino(exercicios) !== '' ? ` · ${gruposDoTreino(exercicios)}` : ''}
          </Text>
        </View>

        <Text style={styles.seta}>{aberto ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {aberto && (
        <View style={styles.corpoTreino}>
          {item.anotacao ? (
            <View style={styles.blocoAnotacao}>
              <Text style={styles.rotuloAnotacao}>Anotação</Text>
              <Text style={styles.textoAnotacao}>{item.anotacao}</Text>
            </View>
          ) : null}

          {exercicios.map((exercicio, indice) => {
            const series =
              exercicio.series && exercicio.repeticoes
                ? `${exercicio.series} x ${exercicio.repeticoes}`
                : '';

            return (
              <View key={exercicio.id ?? indice} style={styles.linhaExercicio}>
                <Text style={styles.nomeExercicio}>{exercicio.nome}</Text>
                <Text style={styles.detalheExercicio}>
                  {series}
                  {exercicio.peso ? (
                    <Text style={styles.pesoExercicio}>
                      {series !== '' ? ' · ' : ''}
                      {exercicio.peso} kg
                    </Text>
                  ) : null}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function TelaHistorico({ historico, aoVoltar }) {
  const [aba, setAba] = useState('historico');
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  // Guarda o que o aluno abriu ou fechou. Sem escolha, só o treino mais recente começa aberto.
  const [abertos, setAbertos] = useState({});

  const secoes = useMemo(() => agruparPorMes(historico), [historico]);

  const hoje = new Date();
  const treinosNoMes = historico.filter((item) => {
    const data = lerData(item.data);
    return data && data.mes === hoje.getMonth() + 1 && data.ano === hoje.getFullYear();
  }).length;

  const primeiroId = historico[0] ? historico[0].id : null;

  function alternar(id, estavaAberto) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbertos((atual) => ({ ...atual, [id]: !estavaAberto }));
  }

  // Aba Evolução: já começa no primeiro exercício, para a tela nunca ficar vazia.
  const exerciciosComPeso = listarExerciciosComPeso(historico);
  const selecionado = exercicioSelecionado ?? exerciciosComPeso[0] ?? null;
  const pontosEvolucao = selecionado ? obterEvolucao(historico, selecionado) : [];
  const recorde = pontosEvolucao.length ? Math.max(...pontosEvolucao.map((p) => p.peso)) : 0;
  const ultimaCarga = pontosEvolucao.length ? pontosEvolucao[pontosEvolucao.length - 1].peso : 0;

  const resumoTopo = (
    <View style={styles.resumoTopo}>
      <View style={[styles.bloco, styles.blocoEspaco]}>
        <Text style={styles.numeroBloco}>{historico.length}</Text>
        <Text style={styles.rotuloBloco}>{historico.length === 1 ? 'treino' : 'treinos'}</Text>
      </View>
      <View style={styles.bloco}>
        <Text style={styles.numeroBloco}>{treinosNoMes}</Text>
        <Text style={styles.rotuloBloco}>neste mês</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable
          onPress={aoVoltar}
          style={({ pressed }) => [styles.botaoVoltar, pressed && styles.botaoVoltarAtivo]}
        >
          {({ pressed }) => (
            <Text style={[styles.voltar, pressed && styles.textoVoltarAtivo]}>‹ Voltar</Text>
          )}
        </Pressable>
        <Text style={styles.titulo}>Histórico</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'historico' && styles.abaAtiva]}
          onPress={() => setAba('historico')}
        >
          <Text style={[styles.textoAba, aba === 'historico' && styles.textoAbaAtiva]}>
            Treinos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aba, aba === 'evolucao' && styles.abaAtiva]}
          onPress={() => setAba('evolucao')}
        >
          <Text style={[styles.textoAba, aba === 'evolucao' && styles.textoAbaAtiva]}>
            Evolução
          </Text>
        </TouchableOpacity>
      </View>

      {aba === 'historico' && (
        <SectionList
          sections={secoes}
          keyExtractor={(item, indice) => item.id ?? String(indice)}
          contentContainerStyle={styles.conteudoLista}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={historico.length > 0 ? resumoTopo : null}
          renderSectionHeader={({ section }) => (
            <View style={styles.cabecalhoMes}>
              <Text style={styles.tituloMes}>{section.titulo}</Text>
              <Text style={styles.contagemMes}>
                {plural(section.data.length, 'treino', 'treinos')}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const aberto = abertos[item.id] ?? item.id === primeiroId;

            return (
              <CartaoTreino
                item={item}
                aberto={aberto}
                aoAlternar={() => alternar(item.id, aberto)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhum treino concluído ainda. Finalize um treino para ele aparecer aqui.
            </Text>
          }
        />
      )}

      {aba === 'evolucao' && (
        <ScrollView style={styles.evolucaoContainer} contentContainerStyle={styles.conteudoLista}>
          {exerciciosComPeso.length === 0 ? (
            <Text style={styles.vazio}>
              Registre o peso de algum exercício para ver a evolução aqui.
            </Text>
          ) : (
            <>
              <Text style={styles.instrucao}>Escolha um exercício</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listaExercicios}
                contentContainerStyle={styles.listaExerciciosConteudo}
              >
                {exerciciosComPeso.map((nome) => (
                  <TouchableOpacity
                    key={nome}
                    style={[styles.chipExercicio, selecionado === nome && styles.chipExercicioAtivo]}
                    onPress={() => setExercicioSelecionado(nome)}
                  >
                    <Text
                      style={[
                        styles.textoChipExercicio,
                        selecionado === nome && styles.textoChipExercicioAtivo,
                      ]}
                    >
                      {nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.resumoTopo}>
                <View style={[styles.bloco, styles.blocoEspaco]}>
                  <Text style={styles.numeroBloco}>{recorde} kg</Text>
                  <Text style={styles.rotuloBloco}>recorde</Text>
                </View>
                <View style={[styles.bloco, styles.blocoEspaco]}>
                  <Text style={styles.numeroBloco}>{ultimaCarga} kg</Text>
                  <Text style={styles.rotuloBloco}>última carga</Text>
                </View>
                <View style={styles.bloco}>
                  <Text style={styles.numeroBloco}>{pontosEvolucao.length}</Text>
                  <Text style={styles.rotuloBloco}>
                    {pontosEvolucao.length === 1 ? 'registro' : 'registros'}
                  </Text>
                </View>
              </View>

              <GraficoEvolucao pontos={pontosEvolucao} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: CORES.fundo,
  },
  conteudoLista: {
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 16,
  },
  botaoVoltar: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  botaoVoltarAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  voltar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  textoVoltarAtivo: {
    color: CORES.textoSobreDestaque,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  abas: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aba: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 10,
  },
  abaAtiva: {
    borderBottomColor: CORES.destaque,
  },
  textoAba: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  textoAbaAtiva: {
    color: CORES.texto,
    fontWeight: 'bold',
  },

  // Resumo em blocos (topo da lista de treinos e da evolução)
  resumoTopo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bloco: {
    flex: 1,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  blocoEspaco: {
    marginRight: 8,
  },
  numeroBloco: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
  },
  rotuloBloco: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },

  // Meses
  cabecalhoMes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
    marginBottom: 10,
  },
  tituloMes: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  contagemMes: {
    fontSize: 12,
    color: CORES.textoSecundario,
  },

  // Cartão de treino
  cartaoTreino: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cartaoTreinoAberto: {
    borderColor: CORES.destaque,
  },
  cabecalhoTreino: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  dia: {
    width: 48,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: CORES.fundo,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginRight: 14,
  },
  diaSemana: {
    fontSize: 11,
    color: CORES.textoSecundario,
  },
  diaNumero: {
    fontSize: 20,
    fontWeight: '900',
    color: CORES.texto,
  },
  resumoTreino: {
    flex: 1,
  },
  nomeTreino: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  subTreino: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  seta: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginLeft: 10,
  },
  corpoTreino: {
    paddingHorizontal: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  blocoAnotacao: {
    borderLeftWidth: 3,
    borderLeftColor: CORES.destaque,
    paddingLeft: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  rotuloAnotacao: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
    marginBottom: 2,
  },
  textoAnotacao: {
    fontSize: 14,
    fontStyle: 'italic',
    color: CORES.texto,
  },
  linhaExercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  nomeExercicio: {
    flex: 1,
    fontSize: 14,
    color: CORES.texto,
    marginRight: 12,
  },
  detalheExercicio: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  pesoExercicio: {
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  vazio: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginTop: 20,
  },

  // Aba Evolução
  evolucaoContainer: {
    flex: 1,
  },
  instrucao: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 10,
  },
  listaExercicios: {
    flexGrow: 0,
    marginBottom: 12,
  },
  listaExerciciosConteudo: {
    paddingRight: 20,
  },
  chipExercicio: {
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipExercicioAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoChipExercicio: {
    fontSize: 13,
    color: CORES.texto,
  },
  textoChipExercicioAtivo: {
    color: CORES.textoSobreDestaque,
    fontWeight: 'bold',
  },
});