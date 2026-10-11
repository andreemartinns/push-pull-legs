import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { CORES } from '../utils/tema';

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
        Animated.timing(pulo, { toValue: 1.12, duration: 120, useNativeDriver: false }),
        Animated.spring(pulo, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [valor]);

  const texto =
    valor > 0
      ? `${numero} ${numero === 1 ? 'dia seguido' : 'dias seguidos'} de treino`
      : 'Conclua um treino para começar sua sequência';

  return (
    <Animated.Text
      style={[styles.texto, { transform: [{ scale: pulo }], transformOrigin: 'left center' }]}
    >
      {texto}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  texto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 16,
  },
});