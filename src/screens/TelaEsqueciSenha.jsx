import { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text } from 'react-native';
import Botao from '../components/Botao';
import FundoTela from '../components/FundoTela';
import { CORES } from '../utils/tema';

export default function ForgotPasswordScreen({ onGoToLogin }) {
  // Goes from 0 to 1 when the screen opens. Drives the logo entrance.
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [intro]);

  return (
    <FundoTela>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.brand,
            {
              opacity: intro,
              transform: [
                {
                  translateY: intro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
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
          <Text style={styles.gymName}>Ritmo Brasil</Text>
        </Animated.View>

        <Text style={styles.title}>Esqueci a senha</Text>
        <Text style={styles.subtitle}>
          Fale com a recepção da academia. Eles vão criar uma nova senha para você e é só entrar
          de novo.
        </Text>

        <Botao titulo="Voltar ao login" aoPressionar={onGoToLogin} />
      </ScrollView>
    </FundoTela>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mascot: {
    width: 90,
    height: 117,
  },
  gymLabel: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: CORES.destaque,
  },
  gymName: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: CORES.texto,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: CORES.textoSecundario,
    marginBottom: 28,
  },
});