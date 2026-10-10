import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

const ALTURA_MAXIMA = 140;
const ALTURA_MINIMA = 30;

// pontos: lista de { data, valor } (ou { data, peso }, formato antigo).
// unidade: texto mostrado depois do número (kg, cm).
// escalaRelativa: se true, as barras vão do menor ao maior valor,
// em vez de começar do zero. Bom para medidas do corpo.
export default function GraficoEvolucao({
  pontos,
  unidade = 'kg',
  escalaRelativa = false,
  textoVazio = 'Sem dados de peso suficientes ainda.',
}) {
  if (pontos.length === 0) {
    return <Text style={styles.vazio}>{textoVazio}</Text>;
  }

  const valores = pontos.map((p) => Number(p.valor ?? p.peso));
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);

  function alturaDaBarra(valor) {
    if (escalaRelativa && maior !== menor) {
      const proporcao = (valor - menor) / (maior - menor);
      return ALTURA_MINIMA + proporcao * (ALTURA_MAXIMA - ALTURA_MINIMA);
    }
    return (valor / maior) * ALTURA_MAXIMA;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grafico}>
          {pontos.map((ponto, index) => {
            const valor = valores[index];

            return (
              <View key={index} style={styles.coluna}>
                <Text style={styles.valor}>
                  {valor}
                  {unidade}
                </Text>
                <View style={[styles.barra, { height: alturaDaBarra(valor) }]} />
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
  valor: {
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