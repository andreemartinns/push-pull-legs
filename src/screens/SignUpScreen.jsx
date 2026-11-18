import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { BotaoPrincipal, BotaoSecundario, Campo, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { cadastrar } from '../utils/api';
import { P } from '../utils/theme';

const vibrar = (tipo) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(tipo);
};

function Entrada({ atraso, children }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: atraso }}
    >
      {children}
    </MotiView>
  );
}

export default function SignUpScreen({ onGoToLogin, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function erro(titulo, msg) {
    vibrar(Haptics.NotificationFeedbackType.Warning);
    avisar(titulo, msg);
  }

  async function handleSignUp() {
    if (submitting) return;
    const cleanEmail = email.trim().toLowerCase();

    if (name.trim() === '' || cleanEmail === '' || password === '') {
      erro('Campos vazios', 'Preencha todos os campos.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      erro('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      erro('Senha curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      erro('Senhas diferentes', 'A confirmação não é igual à senha.');
      return;
    }

    setSubmitting(true);
    try {
      const perfil = await cadastrar(cleanEmail, password, name.trim(), 'aluno');
      setSubmitting(false);
      vibrar(Haptics.NotificationFeedbackType.Success);
      if (onSignUpSuccess) {
        onSignUpSuccess(perfil);
      } else {
        avisar('Conta criada', 'Agora é só entrar.');
        onGoToLogin();
      }
    } catch (e) {
      setSubmitting(false);
      vibrar(Haptics.NotificationFeedbackType.Error);
      avisar('Não foi possível cadastrar', e.message);
    }
  }

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
        <Text style={styles.title}>Criar conta</Text>
      </MotiView>

      <Entrada atraso={330}>
        <Campo
          rotulo="Nome"
          valor={name}
          aoMudar={setName}
          placeholder="Como quer ser chamado"
          capitalizar="words"
        />
      </Entrada>
      <Entrada atraso={410}>
        <Campo
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          placeholder="voce@email.com"
          teclado="email-address"
        />
      </Entrada>
      <Entrada atraso={490}>
        <Campo
          rotulo="Senha"
          valor={password}
          aoMudar={setPassword}
          placeholder="Mínimo de 6 caracteres"
          senha
        />
      </Entrada>
      <Entrada atraso={570}>
        <Campo
          rotulo="Confirmar senha"
          valor={confirmPassword}
          aoMudar={setConfirmPassword}
          placeholder="Repita a senha"
          senha
        />
      </Entrada>

      <Entrada atraso={650}>
        <BotaoPrincipal titulo="Cadastrar" aoPressionar={handleSignUp} carregando={submitting} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <BotaoSecundario titulo="Já tenho conta" aoPressionar={onGoToLogin} />
      </Entrada>
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
  brand: { alignItems: 'center', marginBottom: 20 },
  mascot: { width: 70, height: 91 },
  gymLabel: {
    marginTop: 10,
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 14,
    letterSpacing: 8,
    color: P.textoSecundario,
  },
  gymName: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 28,
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
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: P.pontoVazio },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 16,
    color: P.textoSecundario,
  },
});