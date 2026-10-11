import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

const ALTURA_MAXIMA = 140;
// Na escala relativa, a menor barra ocupa metade da altura máxima.
const ALTURA_MINIMA = 70;

// Tira casas decimais inúteis: 22.0 vira "22" e 22.55 vira "22.6".
function formatar(numero) {
  return String(Number(numero.toFixed(1)));
}

// Uma barra que cresce do zero até a altura final.
// Cada barra espera um pouco mais que a anterior, então elas sobem em sequência.
function Barra({ altura, indice }) {
  const animada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animada, {
      toValue: altura,
      duration: 600,
      delay: Math.min(indice, 10) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [altura]);

  return <Animated.View style={[styles.barra, { height: animada }]} />;
}

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
  const rolagem = useRef(null);

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
    if (maior <= 0) return 0;
    return (valor / maior) * ALTURA_MAXIMA;
  }

  // Resumo: de onde começou, onde está agora e quanto mudou.
  const primeiro = valores[0];
  const ultimo = valores[valores.length - 1];
  const diferenca = Number((ultimo - primeiro).toFixed(1));
  const variacao =
    diferenca === 0
      ? 'Sem mudança'
      : `${diferenca > 0 ? '+' : ''}${formatar(diferenca)}${unidade}`;

  return (
    <View style={styles.container}>
      {pontos.length >= 2 && (
        <View style={styles.resumo}>
          <Text style={styles.textoResumo}>
            De {formatar(primeiro)}
            {unidade} para {formatar(ultimo)}
            {unidade}
          </Text>
          <Text style={styles.variacao}>{variacao}</Text>
        </View>
      )}

      {/* Os pontos vão do mais antigo ao mais novo, então a rolagem começa no fim,
          mostrando primeiro o treino mais recente. */}
      <ScrollView
        ref={rolagem}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
      >
        <View style={styles.grafico}>
          {pontos.map((ponto, index) => {
            const valor = valores[index];

            return (
              <View key={index} style={styles.coluna}>
                <Text style={styles.valor}>
                  {valor}
                  {unidade}
                </Text>
                <Barra altura={alturaDaBarra(valor)} indice={index} />
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
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  textoResumo: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  variacao: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
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