import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Calendario, { chaveDoTexto } from '../components/Calendar';
import GraficoEvolucao from '../components/ProgressChart';
import { Abas, Cabecalho, Numero } from '../components/UI';
import { DIVISOES } from '../utils/splits';
import { listarExerciciosComPeso, obterEvolucao } from '../utils/progress';
import { P } from '../utils/theme';

// ---- ajudantes ----

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
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

const ABAS = [
  { id: 'historico', rotulo: 'Treinos' },
  { id: 'evolucao', rotulo: 'Evolução' },
  { id: 'calendario', rotulo: 'Calendário' },
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

// Push, Pull ou Legs quando uma divisão domina (60% ou mais),
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

function gruposDoTreino(exercicios) {
  return [...new Set(exercicios.map((ex) => ex.grupo).filter(Boolean))].join(', ');
}

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
              <View
                key={exercicio.id ?? indice}
                style={[styles.linhaExercicio, indice === exercicios.length - 1 && styles.semBorda]}
              >
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
  const [diaSelecionado, setDiaSelecionado] = useState(null);
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

  // Aba Evolução
  const exerciciosComPeso = listarExerciciosComPeso(historico);
  const selecionado = exercicioSelecionado ?? exerciciosComPeso[0] ?? null;
  const pontosEvolucao = selecionado ? obterEvolucao(historico, selecionado) : [];
  const recorde = pontosEvolucao.length ? Math.max(...pontosEvolucao.map((p) => p.peso)) : 0;
  const ultimaCarga = pontosEvolucao.length ? pontosEvolucao[pontosEvolucao.length - 1].peso : 0;

  // Aba Calendário
  const treinosDoDia = diaSelecionado
    ? historico.filter((item) => chaveDoTexto(item.data) === diaSelecionado)
    : [];
  const dataDoDia = treinosDoDia[0] ? lerData(treinosDoDia[0].data) : null;

  const resumoTopo = (
    <View style={styles.resumoTopo}>
      <Numero valor={historico.length} legenda={historico.length === 1 ? 'treino' : 'treinos'} />
      <Numero valor={treinosNoMes} legenda="neste mês" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Histórico" aoVoltar={aoVoltar} />
      <Abas opcoes={ABAS} ativa={aba} aoMudar={setAba} />

      {aba === 'historico' && (
        <SectionList
          sections={secoes}
          keyExtractor={(item, indice) => item.id ?? String(indice)}
          contentContainerStyle={styles.conteudoLista}
          showsVerticalScrollIndicator={false}
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
        <ScrollView
          style={styles.evolucaoContainer}
          contentContainerStyle={styles.conteudoLista}
          showsVerticalScrollIndicator={false}
        >
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
                <Numero valor={`${recorde} kg`} legenda="recorde" />
                <Numero valor={`${ultimaCarga} kg`} legenda="última carga" />
                <Numero
                  valor={pontosEvolucao.length}
                  legenda={pontosEvolucao.length === 1 ? 'registro' : 'registros'}
                />
              </View>

              <GraficoEvolucao pontos={pontosEvolucao} />
            </>
          )}
        </ScrollView>
      )}

      {aba === 'calendario' && (
        <ScrollView
          style={styles.evolucaoContainer}
          contentContainerStyle={styles.conteudoLista}
          showsVerticalScrollIndicator={false}
        >
          <Calendario
            historico={historico}
            selecionado={diaSelecionado}
            aoSelecionar={setDiaSelecionado}
          />

          {treinosDoDia.length === 0 ? (
            <Text style={styles.dicaCalendario}>Toque num dia marcado para ver o treino.</Text>
          ) : (
            <View style={styles.treinosDoDia}>
              {dataDoDia && (
                <Text style={styles.tituloDia}>
                  {DIAS_LONGOS[dataDoDia.diaSemana]}, {dataDoDia.dia} de{' '}
                  {MESES[dataDoDia.mes - 1].toLowerCase()}
                </Text>
              )}

              {treinosDoDia.map((item, indice) => {
                const chaveAberto = item.id ?? String(indice);
                const aberto = abertos[chaveAberto] ?? true;

                return (
                  <CartaoTreino
                    key={chaveAberto}
                    item={item}
                    aberto={aberto}
                    aoAlternar={() => alternar(chaveAberto, aberto)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
    backgroundColor: P.fundo,
  },
  conteudoLista: {
    paddingBottom: 130,
  },

  resumoTopo: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  cabecalhoMes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 24,
    marginBottom: 12,
  },
  tituloMes: { fontSize: 18, fontWeight: '700', color: P.texto },
  contagemMes: { fontSize: 13, color: P.textoSecundario },

  cartaoTreino: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cartaoTreinoAberto: {
    borderColor: P.verde,
  },
  cabecalhoTreino: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  dia: {
    width: 52,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: P.verde,
    borderRadius: 16,
    marginRight: 14,
  },
  diaSemana: { fontSize: 11, color: P.textoSuaveSobreVerde },
  diaNumero: { fontSize: 20, fontWeight: '800', color: P.limao },
  resumoTreino: { flex: 1 },
  nomeTreino: { fontSize: 18, fontWeight: '800', color: P.texto },
  subTreino: { fontSize: 13, color: P.textoSecundario, marginTop: 2 },
  seta: { fontSize: 14, color: P.textoSecundario, marginLeft: 10 },
  corpoTreino: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  blocoAnotacao: {
    backgroundColor: P.fundo,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  rotuloAnotacao: {
    fontSize: 12,
    fontWeight: '700',
    color: P.textoSecundario,
    marginBottom: 2,
  },
  textoAnotacao: { fontSize: 14, color: P.texto },
  linhaExercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  semBorda: { borderBottomWidth: 0 },
  nomeExercicio: { flex: 1, fontSize: 14, fontWeight: '600', color: P.texto, marginRight: 12 },
  detalheExercicio: { fontSize: 13, color: P.textoSecundario },
  pesoExercicio: { fontWeight: '800', color: P.verde },
  vazio: { fontSize: 15, lineHeight: 24, color: P.textoSecundario, marginTop: 20 },

  evolucaoContainer: { flex: 1 },
  instrucao: { fontSize: 14, color: P.textoSecundario, marginBottom: 10 },
  listaExercicios: { flexGrow: 0, marginBottom: 14 },
  listaExerciciosConteudo: { paddingRight: 20 },
  chipExercicio: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
  },
  chipExercicioAtivo: { backgroundColor: P.verde },
  textoChipExercicio: { fontSize: 14, fontWeight: '700', color: P.texto },
  textoChipExercicioAtivo: { color: P.textoSobreVerde },

  dicaCalendario: {
    fontSize: 13,
    color: P.textoSecundario,
    textAlign: 'center',
    marginTop: 16,
  },
  treinosDoDia: { marginTop: 18 },
  tituloDia: { fontSize: 18, fontWeight: '700', color: P.texto, marginBottom: 12 },
});