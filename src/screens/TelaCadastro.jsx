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
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

export default function SignUpScreen({ onGoToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  async function handleSignUp() {
    if (submitting) return;
    const cleanEmail = email.trim().toLowerCase();

    if (name.trim() === '' || cleanEmail === '' || password === '') {
      avisar('Campos vazios', 'Preencha todos os campos.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      avisar('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      avisar('Senha curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      avisar('Senhas diferentes', 'A confirmação não é igual à senha.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { nome: name.trim() } },
    });
    setSubmitting(false);

    if (error) {
      avisar('Não foi possível cadastrar', error.message);
      return;
    }

    avisar('Conta criada', 'Agora é só entrar.');
    onGoToLogin();
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

        <Text style={styles.title}>Criar conta</Text>

        <CampoTexto
          rotulo="Nome"
          valor={name}
          aoMudar={setName}
          placeholder="Como quer ser chamado"
          capitalizar="words"
        />
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
          placeholder="Mínimo de 6 caracteres"
          senha
        />
        <CampoTexto
          rotulo="Confirmar senha"
          valor={confirmPassword}
          aoMudar={setConfirmPassword}
          placeholder="Repita a senha"
          senha
        />

        <Botao titulo="Cadastrar" aoPressionar={handleSignUp} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={onGoToLogin}
          style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
        >
          <Text style={styles.loginButtonText}>Já tenho conta</Text>
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
    marginBottom: 20,
  },
  mascot: {
    width: 70,
    height: 91,
  },
  gymLabel: {
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: CORES.destaque,
  },
  gymName: {
    fontSize: 20,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
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
  loginButton: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 14,
  },
  loginButtonPressed: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
});