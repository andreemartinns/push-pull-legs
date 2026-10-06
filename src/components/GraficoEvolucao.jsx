import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

const ALTURA_MAXIMA = 140;

export default function GraficoEvolucao({ pontos }) {
  if (pontos.length === 0) {
    return <Text style={styles.vazio}>Sem dados de peso suficientes ainda.</Text>;
  }

  const maiorPeso = Math.max(...pontos.map((p) => p.peso));

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grafico}>
          {pontos.map((ponto, index) => {
            const altura = (ponto.peso / maiorPeso) * ALTURA_MAXIMA;
            return (
              <View key={index} style={styles.coluna}>
                <Text style={styles.valorPeso}>{ponto.peso}kg</Text>
                <View style={[styles.barra, { height: altura }]} />
                <Text style={styles.data}>{ponto.data.slice(0, 5)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 10,
  },
  coluna: {
    alignItems: 'center',
    marginRight: 18,
    minWidth: 40,
  },
  valorPeso: {
    fontSize: 11,
    color: CORES.destaque,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barra: {
    width: 24,
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    minHeight: 4,
  },
  data: {
    fontSize: 10,
    color: CORES.textoSecundario,
    marginTop: 6,
  },
  vazio: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginTop: 12,
  },
});