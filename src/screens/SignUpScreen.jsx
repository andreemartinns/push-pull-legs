import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { BotaoPrincipal, BotaoSecundario, Campo, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { cadastrar } from '../utils/api';
import { P } from '../utils/theme';

export default function SignUpScreen({ onGoToLogin, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    try {
      const perfil = await cadastrar(cleanEmail, password, name.trim(), 'aluno');
      setSubmitting(false);
      if (onSignUpSuccess) {
        onSignUpSuccess(perfil);
      } else {
        avisar('Conta criada', 'Agora é só entrar.');
        onGoToLogin();
      }
    } catch (e) {
      setSubmitting(false);
      avisar('Não foi possível cadastrar', e.message);
    }
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

      <Text style={styles.title}>Criar conta</Text>

      <Campo
        rotulo="Nome"
        valor={name}
        aoMudar={setName}
        placeholder="Como quer ser chamado"
        capitalizar="words"
      />
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
        placeholder="Mínimo de 6 caracteres"
        senha
      />
      <Campo
        rotulo="Confirmar senha"
        valor={confirmPassword}
        aoMudar={setConfirmPassword}
        placeholder="Repita a senha"
        senha
      />

      <BotaoPrincipal titulo="Cadastrar" aoPressionar={handleSignUp} carregando={submitting} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <BotaoSecundario titulo="Já tenho conta" aoPressionar={onGoToLogin} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginBottom: 20 },
  mascot: { width: 70, height: 91 },
  gymLabel: {
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: P.textoSecundario,
  },
  gymName: { fontSize: 20, fontWeight: '800', letterSpacing: 1.5, color: P.texto },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: P.texto, marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: P.pontoVazio },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: P.textoSecundario },
});