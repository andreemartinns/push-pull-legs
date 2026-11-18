import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/theme';

export default function BarraProgresso({ total, concluidos }) {
  const porcentagem = total === 0 ? 0 : (concluidos / total) * 100;
  const completo = total > 0 && concluidos === total;

  const largura = useRef(new Animated.Value(porcentagem)).current;
  const pulo = useRef(new Animated.Value(1)).current;

  // A barra enche suavemente até o novo valor.
  // A largura não aceita o driver nativo, por isso ele fica desligado aqui.
  useEffect(() => {
    Animated.timing(largura, {
      toValue: porcentagem,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [porcentagem]);

  // O texto dá um pequeno pulo cada vez que um exercício é concluído.
  useEffect(() => {
    if (concluidos === 0) return;

    Animated.sequence([
      Animated.timing(pulo, { toValue: 1.08, duration: 120, useNativeDriver: false }),
      Animated.spring(pulo, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [concluidos]);

  const larguraTexto = largura.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.linha}>
        <Animated.Text
          style={[
            styles.texto,
            completo && styles.textoCompleto,
            { transform: [{ scale: pulo }], transformOrigin: 'left center' },
          ]}
        >
          {completo ? 'Treino completo' : `${concluidos} de ${total} concluídos`}
        </Animated.Text>
        <Text style={styles.porcentagem}>{Math.round(porcentagem)}%</Text>
      </View>

      <View style={styles.fundo}>
        <Animated.View style={[styles.preenchimento, { width: larguraTexto }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  texto: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  textoCompleto: {
    fontWeight: '600',
    color: CORES.destaque,
  },
  porcentagem: {
    fontSize: 14,
    fontWeight: '600',
    color: CORES.texto,
  },
  fundo: {
    height: 6,
    backgroundColor: CORES.cartaoElevado,
    borderRadius: 3,
    overflow: 'hidden',
  },
  preenchimento: {
    height: 6,
    backgroundColor: CORES.destaque,
    borderRadius: 3,
  },
});