import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { P } from '../utils/theme';

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
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

// Chave numérica de um dia, igual para "9/10/2026" e "09/10/2026".
export function chaveDoDia(dia, mes, ano) {
  return `${ano}-${mes}-${dia}`;
}

// Lê a data salva no histórico ("10/10/2026") e devolve a chave do dia.
export function chaveDoTexto(texto) {
  const partes = String(texto || '')
    .split('/')
    .map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;

  return chaveDoDia(partes[0], partes[1], partes[2]);
}

export default function Calendario({ historico, selecionado, aoSelecionar }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  // Quantos treinos houve em cada dia.
  const treinosPorDia = {};
  historico.forEach((item) => {
    const chave = chaveDoTexto(item.data);
    if (chave) treinosPorDia[chave] = (treinosPorDia[chave] || 0) + 1;
  });

  const noMesAtual = mes === hoje.getMonth() && ano === hoje.getFullYear();

  function mesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function proximoMes() {
    if (noMesAtual) return;
    if (mes === 11) {
      setMes(0);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  }

  // Monta as células do mês: espaços vazios antes do dia 1, os dias, e espaços no fim.
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i += 1) celulas.push(null);
  for (let dia = 1; dia <= diasNoMes; dia += 1) celulas.push(dia);
  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));

  // Quantos dias do mês mostrado tiveram treino.
  let diasTreinados = 0;
  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    if (treinosPorDia[chaveDoDia(dia, mes + 1, ano)]) diasTreinados += 1;
  }

  return (
    <View style={styles.container}>
      <View style={styles.navegacao}>
        <Pressable
          onPress={mesAnterior}
          hitSlop={10}
          style={({ pressed }) => [styles.seta, pressed && styles.setaAtiva]}
        >
          <Text style={styles.textoSeta}>‹</Text>
        </Pressable>

        <View style={styles.tituloMes}>
          <Text style={styles.nomeMes}>
            {MESES[mes]} {ano}
          </Text>
          <Text style={styles.resumoMes}>
            {diasTreinados} {diasTreinados === 1 ? 'dia treinado' : 'dias treinados'}
          </Text>
        </View>

        <Pressable
          onPress={proximoMes}
          hitSlop={10}
          style={({ pressed }) => [
            styles.seta,
            noMesAtual && styles.setaDesligada,
            pressed && !noMesAtual && styles.setaAtiva,
          ]}
        >
          <Text style={styles.textoSeta}>›</Text>
        </Pressable>
      </View>

      <View style={styles.linhaSemana}>
        {SEMANA.map((letra, indice) => (
          <Text key={indice} style={styles.letraSemana}>
            {letra}
          </Text>
        ))}
      </View>

      {semanas.map((semana, indiceSemana) => (
        <View key={indiceSemana} style={styles.linhaDias}>
          {semana.map((dia, indiceDia) => {
            if (dia === null) {
              return <View key={indiceDia} style={styles.celula} />;
            }

            const chave = chaveDoDia(dia, mes + 1, ano);
            const treinou = Boolean(treinosPorDia[chave]);
            const escolhido = selecionado === chave;
            const ehHoje = noMesAtual && dia === hoje.getDate();

            return (
              <View key={indiceDia} style={styles.celula}>
                <Pressable
                  disabled={!treinou}
                  onPress={() => aoSelecionar(escolhido ? null : chave)}
                  style={[
                    styles.dia,
                    ehHoje && styles.diaHoje,
                    treinou && styles.diaTreinado,
                    escolhido && styles.diaEscolhido,
                  ]}
                >
                  <Text style={[styles.numeroDia, treinou && styles.numeroDiaTreinado]}>
                    {dia}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: P.cartao, borderRadius: 24, padding: 16 },
  navegacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setaAtiva: { backgroundColor: P.campoFocado },
  setaDesligada: { opacity: 0.3 },
  textoSeta: { fontSize: 20, fontWeight: '700', color: P.texto, marginTop: -2 },
  tituloMes: { alignItems: 'center' },
  nomeMes: { fontSize: 16, fontWeight: '800', color: P.texto },
  resumoMes: { fontSize: 12, color: P.textoSecundario, marginTop: 2 },
  linhaSemana: { flexDirection: 'row', marginBottom: 6 },
  letraSemana: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: P.textoSecundario,
  },
  linhaDias: { flexDirection: 'row' },
  celula: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  dia: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaHoje: { borderColor: P.textoSecundario },
  diaTreinado: { backgroundColor: P.verde },
  diaEscolhido: { borderColor: P.limao },
  numeroDia: { fontSize: 14, color: P.textoSecundario },
  numeroDiaTreinado: { fontWeight: '800', color: P.limao },
});