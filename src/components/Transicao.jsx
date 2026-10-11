import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { CORES } from '../utils/tema';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

// Envolve uma tela e anima a entrada dela.
// "de" = 'baixo' (sobe com fade) ou 'direita' (desliza da direita).
export default function Transicao({ children, de = 'baixo' }) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }, []);

  const deslocamento = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [de === 'direita' ? 40 : 24, 0],
  });

  const movimento =
    de === 'direita' ? { translateX: deslocamento } : { translateY: deslocamento };

  // O fundo escuro fica parado por trás, então nunca aparece branco durante a animação.
  // O "overflow: hidden" evita barra de rolagem lateral enquanto a tela desliza.
  return (
    <View style={styles.fundo}>
      <Animated.View style={[styles.tela, { opacity: progresso, transform: [movimento] }]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: CORES.fundo,
    overflow: 'hidden',
  },
  tela: {
    flex: 1,
  },
});