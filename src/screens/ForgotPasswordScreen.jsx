import { Image, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { BotaoPrincipal, Tela } from '../components/UI';
import { P } from '../utils/theme';

export default function ForgotPasswordScreen({ onGoToLogin }) {
  return (
    <Tela centro>
      {/* faixa diagonal de fundo, igual ao login */}
      <View style={[styles.stripe, { pointerEvents: 'none' }]} />

      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700 }}
        style={styles.brand}
      >
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: -6 }}
          transition={{ type: 'timing', duration: 1800, loop: true, repeatReverse: true }}
        >
          <Image
            source={require('../../assets/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </MotiView>
        <Text style={styles.gymLabel}>ACADEMIA</Text>
        <Text style={styles.gymName}>RITMO BRASIL</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 250 }}
      >
        <Text style={styles.title}>Esqueci a senha</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 350 }}
      >
        <Text style={styles.subtitle}>
          Fale com a recepção da academia. Eles vão criar uma nova senha para você e é só entrar
          de novo.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 450 }}
      >
        <BotaoPrincipal titulo="Voltar ao login" aoPressionar={onGoToLogin} />
      </MotiView>
    </Tela>
  );
}

const styles = StyleSheet.create({
  stripe: {
    position: 'absolute',
    top: -80,
    right: -120,
    width: 260,
    height: 420,
    backgroundColor: P.verde,
    opacity: 0.08,
    transform: [{ rotate: '25deg' }],
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  mascot: { width: 90, height: 117 },
  gymLabel: {
    marginTop: 12,
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 14,
    letterSpacing: 8,
    color: P.textoSecundario,
  },
  gymName: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 30,
    letterSpacing: 2,
    color: P.texto,
  },
  title: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 48,
    letterSpacing: -0.5,
    color: P.texto,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 21,
    lineHeight: 28,
    color: P.textoSecundario,
    marginBottom: 28,
  },
});