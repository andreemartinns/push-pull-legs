import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet } from 'react-native';
import { CORES } from '../utils/tema';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

// Selo redondo da academia.
// "tamanho" é o diâmetro. "style" permite ajustar posição em cada tela.
// "animado" liga a entrada com zoom. "pulsar" liga o brilho que respira.
// Por padrão, só os logos grandes (a partir de 100) pulsam, para o do cabeçalho não distrair.
export default function Logo({
  tamanho = 140,
  style,
  animado = true,
  pulsar = tamanho >= 100,
}) {
  const escala = useRef(new Animated.Value(animado ? 0.3 : 1)).current;
  const opacidade = useRef(new Animated.Value(animado ? 0 : 1)).current;
  const giro = useRef(new Animated.Value(animado ? 1 : 0)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  // Entrada: o logo cresce com efeito de mola, aparece e dá um pequeno giro.
  useEffect(() => {
    if (!animado) return;

    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
      Animated.timing(giro, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
    ]).start();
  }, []);

  // Brilho amarelo que se expande e some, repetindo devagar.
  useEffect(() => {
    if (!pulsar) return;

    const animacao = Animated.loop(
      Animated.timing(brilho, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USAR_DRIVER_NATIVO,
      })
    );
    animacao.start();

    return () => animacao.stop();
  }, [pulsar]);

  const rotacao = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-25deg'],
  });
  const escalaBrilho = brilho.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });
  const opacidadeBrilho = brilho.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  const medidas = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  return (
    <Animated.View
      style={[
        styles.caixa,
        medidas,
        style,
        { opacity: opacidade, transform: [{ scale: escala }, { rotate: rotacao }] },
      ]}
    >
      {pulsar && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.brilho,
            medidas,
            { opacity: opacidadeBrilho, transform: [{ scale: escalaBrilho }] },
          ]}
        />
      )}
      <Image
        source={require('../../assets/logo-ritmo.jpg')}
        style={[styles.imagem, medidas]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  brilho: {
    position: 'absolute',
    backgroundColor: CORES.destaque,
  },
  imagem: {
    borderWidth: 2,
    borderColor: CORES.destaque,
  },
});