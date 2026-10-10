import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import Logo from '../components/Logo';
import { avisar } from '../utils/avisar';
import { CORES } from '../utils/tema';

export default function TelaLogin({ usuarios, aoEntrar, aoIrParaCadastro, aoIrParaEsqueci }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function entrar() {
    const emailLimpo = email.trim().toLowerCase();
    const usuario = usuarios.find((u) => u.email === emailLimpo && u.senha === senha);

    if (!usuario) {
      avisar('Não foi possível entrar', 'E-mail ou senha incorretos.');
      return;
    }
    aoEntrar(usuario);
  }

  return (
    <FundoTela>
      <ScrollView
        style={styles.fundo}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.marca}>
          <Logo tamanho={120} style={styles.logo} />
          <Text style={styles.academia}>Academia</Text>
          <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
        </View>

        <Text style={styles.titulo}>Entrar</Text>
        <Text style={styles.subtitulo}>Bem-vindo de volta</Text>

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
          <Text style={styles.textoLinkSecundario}>Esqueci a senha</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={aoIrParaCadastro}>
          <Text style={styles.textoLink}>Não tem conta? Cadastre-se</Text>
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
    marginBottom: 32,
  },
  logo: {
    marginBottom: 12,
  },
  academia: {
    fontSize: 13,
    fontStyle: 'italic',
    color: CORES.textoSecundario,
  },
  nomeAcademia: {
    fontSize: 24,
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
  textoLinkSecundario: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
});