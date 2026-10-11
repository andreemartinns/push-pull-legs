import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { CORES } from '../utils/tema';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

export default function Botao({ titulo, aoPressionar, cor = CORES.destaque }) {
  const corDoTexto = cor === CORES.destaque ? CORES.textoSobreDestaque : CORES.texto;
  const escala = useRef(new Animated.Value(1)).current;

  // Ao tocar, o botão encolhe um pouco.
  function aoTocar() {
    Animated.spring(escala, {
      toValue: 0.95,
      speed: 40,
      bounciness: 0,
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }

  // Ao soltar, volta ao tamanho com um efeito de mola.
  function aoSoltar() {
    Animated.spring(escala, {
      toValue: 1,
      speed: 20,
      bounciness: 14,
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }

  return (
    <Pressable onPress={aoPressionar} onPressIn={aoTocar} onPressOut={aoSoltar}>
      <Animated.View
        style={[styles.botao, { backgroundColor: cor, transform: [{ scale: escala }] }]}
      >
        <Text style={[styles.texto, { color: corDoTexto }]}>{titulo}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 15,
  },
});