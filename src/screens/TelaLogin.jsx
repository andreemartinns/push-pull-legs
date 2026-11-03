import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import TituloAnimado from '../components/TituloAnimado';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

export default function LoginScreen({ onGoToSignUp, onGoToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Goes from 0 to 1 when the screen opens. Drives the logo entrance.
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
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setSubmitting(false);

    if (error) {
      avisar('Não foi possível entrar', 'E-mail ou senha incorretos.');
    }
    // If login works, App.jsx sees the session and opens the app.
  }

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

        <Text style={styles.title}>Entrar</Text>

        <CampoTexto
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          placeholder="voce@email.com"
          teclado="email-address"
        />
        <CampoTexto
          rotulo="Senha"
          valor={password}
          aoMudar={setPassword}
          placeholder="Sua senha"
          senha
        />

        <Botao titulo="Entrar" aoPressionar={handleLogin} />

        <Text style={styles.forgot} onPress={onGoToForgotPassword}>
          Esqueci a senha
        </Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={onGoToSignUp}
          style={({ pressed }) => [styles.signUp, pressed && styles.signUpPressed]}
        >
          <Text style={styles.signUpText}>Criar conta</Text>
        </Pressable>
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
  marginBottom: 24,
},
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: CORES.textoSecundario,
    marginTop: 4,
    marginBottom: 24,
  },
  forgot: {
    alignSelf: 'center',
    paddingVertical: 12,
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: CORES.borda,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  signUp: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 14,
  },
  signUpPressed: {
    opacity: 0.6,
  },
  signUpText: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
});