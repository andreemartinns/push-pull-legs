import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

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
      Animated.timing(pulo, { toValue: 1.12, duration: 120, useNativeDriver: false }),
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
      <Animated.Text
        style={[
          styles.texto,
          completo && styles.textoCompleto,
          { transform: [{ scale: pulo }], transformOrigin: 'left center' },
        ]}
      >
        {completo ? 'Treino completo!' : `${concluidos} de ${total} concluídos`}
      </Animated.Text>
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
  texto: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 8,
  },
  textoCompleto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  fundo: {
    height: 10,
    backgroundColor: CORES.borda,
    borderRadius: 5,
    overflow: 'hidden',
  },
  preenchimento: {
    height: 10,
    backgroundColor: CORES.destaque,
    borderRadius: 5,
  },
});