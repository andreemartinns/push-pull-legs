import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import Logo from '../components/Logo';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

export default function TelaCadastro({ aoIrParaLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cadastrar() {
    if (enviando) return;
    const emailLimpo = email.trim().toLowerCase();

    if (nome.trim() === '' || emailLimpo === '' || senha === '') {
      avisar('Campos vazios', 'Preencha todos os campos.');
      return;
    }
    if (!emailLimpo.includes('@')) {
      avisar('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      avisar('Senha curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      avisar('Senhas diferentes', 'A confirmação não é igual à senha.');
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: emailLimpo,
      password: senha,
      options: { data: { nome: nome.trim() } },
    });
    setEnviando(false);

    if (error) {
      avisar('Não foi possível cadastrar', error.message);
      return;
    }

    avisar('Conta criada', 'Agora é só entrar.');
    aoIrParaLogin();
  }

  return (
    <FundoTela>
      <ScrollView
        style={styles.fundo}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.marca}>
          <Logo tamanho={80} style={styles.logo} />
          <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
        </View>

        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>Leva menos de um minuto</Text>

        <CampoTexto
          rotulo="Nome"
          valor={nome}
          aoMudar={setNome}
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
          valor={senha}
          aoMudar={setSenha}
          placeholder="Mínimo de 6 caracteres"
          senha
        />
        <CampoTexto
          rotulo="Confirmar senha"
          valor={confirmacao}
          aoMudar={setConfirmacao}
          placeholder="Repita a senha"
          senha
        />

        <Botao titulo="Cadastrar" aoPressionar={cadastrar} />

        <View style={styles.divisor}>
          <View style={styles.linhaDivisor} />
          <Text style={styles.textoDivisor}>ou</Text>
          <View style={styles.linhaDivisor} />
        </View>

        <Pressable
          onPress={aoIrParaLogin}
          style={({ pressed }) => [
            styles.botaoLogin,
            pressed && styles.botaoLoginAtivo,
          ]}
        >
          {({ pressed }) => (
            <Text style={[styles.textoBotaoLogin, pressed && styles.textoBotaoLoginAtivo]}>
              Já tenho conta
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </FundoTela>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  marca: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    marginBottom: 8,
  },
  nomeAcademia: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  subtitulo: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginTop: 4,
    marginBottom: 28,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  linhaDivisor: {
    flex: 1,
    height: 1,
    backgroundColor: CORES.borda,
  },
  textoDivisor: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginHorizontal: 12,
  },
  botaoLogin: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 14,
  },
  botaoLoginAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoBotaoLogin: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  textoBotaoLoginAtivo: {
    color: CORES.textoSobreDestaque,
  },
});