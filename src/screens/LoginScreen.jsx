import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { BotaoPrincipal, BotaoSecundario, Campo, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { entrar } from '../utils/api';
import { P } from '../utils/theme';

const vibrar = (tipo) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(tipo);
};

export default function LoginScreen({ onGoToSignUp, onGoToForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (submitting) return;
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === '' || password === '') {
      vibrar(Haptics.NotificationFeedbackType.Warning);
      avisar('Campos vazios', 'Preencha e-mail e senha.');
      return;
    }

    setSubmitting(true);
    try {
      const perfil = await entrar(cleanEmail, password);
      vibrar(Haptics.NotificationFeedbackType.Success);
      onLoginSuccess?.(perfil);
    } catch (e) {
      vibrar(Haptics.NotificationFeedbackType.Error);
      avisar('Não foi possível entrar', e.message);
    }
    setSubmitting(false);
  }

  return (
    <Tela centro>
      {/* faixa diagonal de fundo, igual aos ângulos do logo */}
      <View style={[styles.stripe, { pointerEvents: 'none' }]} />

      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700 }}
        style={styles.brand}
      >
        {/* mascote flutuando devagar */}
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
        <Text style={styles.title}>Entrar</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 350 }}
      >
        <Campo
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          placeholder="voce@email.com"
          teclado="email-address"
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 450 }}
      >
        <Campo
          rotulo="Senha"
          valor={password}
          aoMudar={setPassword}
          placeholder="Sua senha"
          senha
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 550 }}
      >
        <BotaoPrincipal titulo="Entrar" aoPressionar={handleLogin} carregando={submitting} />

        <Text style={styles.forgot} onPress={onGoToForgotPassword}>
          Esqueci a senha
        </Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <BotaoSecundario titulo="Criar conta" aoPressionar={onGoToSignUp} />
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
    marginBottom: 24,
  },
  forgot: {
    alignSelf: 'center',
    paddingVertical: 14,
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
    color: P.textoSecundario,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: P.pontoVazio },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: P.textoSecundario },
});