import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';

export default function TelaEsqueciSenha({ aoIrParaLogin }) {
  const [email, setEmail] = useState('');

  function enviar() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo.includes('@')) {
      Alert.alert('E-mail inválido', 'Digite o e-mail da sua conta.');
      return;
    }

    Alert.alert(
      'Verifique seu e-mail',
      `Se ${emailLimpo} estiver cadastrado, você vai receber as instruções para criar uma nova senha.`,
      [{ text: 'Voltar ao login', onPress: aoIrParaLogin }]
    );
  }

  return (
    <ScrollView
      style={styles.fundo}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Esqueci a senha</Text>
      <Text style={styles.subtitulo}>
        Digite seu e-mail e enviaremos as instruções para criar uma nova senha.
      </Text>

      <CampoTexto
        rotulo="E-mail"
        valor={email}
        aoMudar={setEmail}
        placeholder="voce@email.com"
        teclado="email-address"
      />

      <Botao titulo="Enviar instruções" aoPressionar={enviar} />

      <TouchableOpacity style={styles.link} onPress={aoIrParaLogin}>
        <Text style={styles.textoLink}>Voltar ao login</Text>
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