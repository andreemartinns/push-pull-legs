import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

const DIAS_DA_SEMANA = 7;

// Quantas barrinhas acendem: a sequência dentro da semana atual (1 a 7).
function barrasAcesas(numero) {
  if (numero <= 0) return 0;
  return ((numero - 1) % DIAS_DA_SEMANA) + 1;
}

// Mostra a sequência de dias e conta até o valor, em vez de aparecer de uma vez.
export default function ContadorSequencia({ valor }) {
  const contagem = useRef(new Animated.Value(0)).current;
  const pulo = useRef(new Animated.Value(1)).current;
  const [numero, setNumero] = useState(0);

  // Acompanha o valor que está subindo e guarda o número inteiro para mostrar.
  useEffect(() => {
    const id = contagem.addListener(({ value }) => setNumero(Math.round(value)));
    return () => contagem.removeListener(id);
  }, []);

  // Sempre que a sequência muda, conta até o novo valor. O pulinho vem no final.
  useEffect(() => {
    Animated.timing(contagem, {
      toValue: valor,
      duration: Math.min(500 + valor * 120, 1400),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || valor === 0) return;

      Animated.sequence([
        Animated.timing(pulo, { toValue: 1.06, duration: 120, useNativeDriver: false }),
        Animated.spring(pulo, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [valor]);

  if (valor === 0) {
    return <Text style={styles.semSequencia}>Conclua um treino para começar sua sequência</Text>;
  }

  const acesas = barrasAcesas(numero);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: pulo }], transformOrigin: 'left center' }]}
    >
      <View style={styles.linha}>
        <Text style={styles.numero}>{numero}</Text>
        <View style={styles.textos}>
          <Text style={styles.rotulo}>{numero === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
          <Text style={styles.sub}>de treino</Text>
        </View>
      </View>

      <View style={styles.barras}>
        {Array.from({ length: DIAS_DA_SEMANA }).map((_, indice) => (
          <View
            key={indice}
            style={[
              styles.barra,
              indice < DIAS_DA_SEMANA - 1 && styles.barraEspaco,
              indice < acesas && styles.barraAcesa,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  numero: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
    marginRight: 10,
  },
  textos: {
    paddingBottom: 4,
  },
  rotulo: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  sub: {
    fontSize: 12,
    color: CORES.textoSecundario,
  },
  barras: {
    flexDirection: 'row',
    marginTop: 10,
  },
  barra: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: CORES.borda,
  },
  barraEspaco: {
    marginRight: 4,
  },
  barraAcesa: {
    backgroundColor: CORES.destaque,
  },
  semSequencia: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 16,
  },
});