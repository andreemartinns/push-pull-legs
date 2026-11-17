import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';
import { BotaoPrincipal, Tela } from '../components/UI';
import { P } from '../utils/theme';

export default function ForgotPasswordScreen({ onGoToLogin }) {
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [intro]);

  return (
    <Tela centro>
      <Animated.View
        style={[
          styles.brand,
          {
            opacity: intro,
            transform: [
              {
                translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/mascot.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Text style={styles.gymLabel}>Academia</Text>
        <Text style={styles.gymName}>RITMO BRASIL</Text>
      </Animated.View>

      <Text style={styles.title}>Esqueci a senha</Text>
      <Text style={styles.subtitle}>
        Fale com a recepção da academia. Eles vão criar uma nova senha para você e é só entrar de
        novo.
      </Text>

      <BotaoPrincipal titulo="Voltar ao login" aoPressionar={onGoToLogin} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginBottom: 28 },
  mascot: { width: 90, height: 117 },
  gymLabel: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: P.textoSecundario,
  },
  gymName: { fontSize: 22, fontWeight: '800', letterSpacing: 1.5, color: P.texto },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: P.texto, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22, color: P.textoSecundario, marginBottom: 28 },
});