import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import Logo from '../components/Logo';
import { avisar } from '../utils/avisar';
import { CORES } from '../utils/tema';

export default function TelaCadastro({ usuarios, aoCadastrar, aoIrParaLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  function cadastrar() {
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
    if (usuarios.some((u) => u.email === emailLimpo)) {
      avisar('E-mail já cadastrado', 'Use outro e-mail ou entre na sua conta.');
      return;
    }

    aoCadastrar({ nome: nome.trim(), email: emailLimpo, senha });
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

        <TouchableOpacity style={styles.link} onPress={aoIrParaLogin}>
          <Text style={styles.textoLink}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
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
  link: {
    alignItems: 'center',
    marginTop: 18,
  },
  textoLink: {
    fontSize: 15,
    color: CORES.texto,
    fontWeight: 'bold',
  },
});