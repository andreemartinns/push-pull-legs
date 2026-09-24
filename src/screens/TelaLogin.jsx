import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';

export default function TelaLogin({
  usuarios,
  aoEntrar,
  aoIrParaCadastro,
  aoIrParaEsqueci,
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function entrar() {
    const emailLimpo = email.trim().toLowerCase();
    const usuario = usuarios.find(
      (u) => u.email === emailLimpo && u.senha === senha
    );

    if (!usuario) {
      Alert.alert('Não foi possível entrar', 'E-mail ou senha incorretos.');
      return;
    }

    aoEntrar(usuario);
  }

  return (
    <ScrollView
      style={styles.fundo}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Meu Treino</Text>
      <Text style={styles.subtitulo}>Entre para ver seus exercícios</Text>

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
        placeholder="Sua senha"
        senha
      />

      <Botao titulo="Entrar" aoPressionar={entrar} />

      <TouchableOpacity style={styles.link} onPress={aoIrParaEsqueci}>
        <Text style={styles.textoLink}>Esqueci a senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={aoIrParaCadastro}>
        <Text style={styles.textoLink}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: '#F2F5F0',
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F4C5C',
  },
  subtitulo: {
    fontSize: 16,
    color: '#6B7A7F',
    marginTop: 4,
    marginBottom: 28,
  },
  link: {
    alignItems: 'center',
    marginTop: 18,
  },
  textoLink: {
    fontSize: 15,
    color: '#0F4C5C',
    fontWeight: 'bold',
  },
});