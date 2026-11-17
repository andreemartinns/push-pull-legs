import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { BotaoPrincipal, BotaoSecundario, Campo, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { entrar } from '../utils/api';
import { P } from '../utils/theme';

export default function LoginScreen({ onGoToSignUp, onGoToForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [intro]);

  async function handleLogin() {
    if (submitting) return;
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === '' || password === '') {
      avisar('Campos vazios', 'Preencha e-mail e senha.');
      return;
    }

    setSubmitting(true);
    try {
      const perfil = await entrar(cleanEmail, password);
      onLoginSuccess?.(perfil);
    } catch (e) {
      avisar('Não foi possível entrar', e.message);
    }
    setSubmitting(false);
  }

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

      <Text style={styles.title}>Entrar</Text>

      <Campo
        rotulo="E-mail"
        valor={email}
        aoMudar={setEmail}
        placeholder="voce@email.com"
        teclado="email-address"
      />
      <Campo
        rotulo="Senha"
        valor={password}
        aoMudar={setPassword}
        placeholder="Sua senha"
        senha
      />

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
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: P.texto, marginBottom: 24 },
  forgot: {
    alignSelf: 'center',
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
    color: P.textoSecundario,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: P.pontoVazio },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: P.textoSecundario },
});