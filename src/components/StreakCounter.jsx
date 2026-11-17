import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/theme';

const DIAS_DA_SEMANA = 7;

// Quantas bolinhas acendem: a sequência dentro da semana atual (1 a 7).
function bolinhasAcesas(numero) {
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

  const acesas = bolinhasAcesas(numero);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: pulo }], transformOrigin: 'left center' }]}
    >
      <View style={styles.esquerda}>
        <Text style={styles.numero}>{numero}</Text>
        <Text style={styles.rotulo}>{numero === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
      </View>

      <View style={styles.bolinhas}>
        {Array.from({ length: DIAS_DA_SEMANA }).map((_, indice) => (
          <View
            key={indice}
            style={[
              styles.bolinha,
              indice < DIAS_DA_SEMANA - 1 && styles.bolinhaEspaco,
              indice < acesas && styles.bolinhaAcesa,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  esquerda: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  numero: {
    fontSize: 24,
    fontWeight: '700',
    color: CORES.destaque,
    marginRight: 8,
  },
  rotulo: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  bolinhas: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CORES.cartaoElevado,
  },
  bolinhaEspaco: {
    marginRight: 8,
  },
  bolinhaAcesa: {
    backgroundColor: CORES.destaque,
  },
  semSequencia: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 8,
  },
});