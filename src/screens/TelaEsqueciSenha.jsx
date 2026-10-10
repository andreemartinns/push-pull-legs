import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import Logo from '../components/Logo';
import { avisar } from '../utils/avisar';
import { CORES } from '../utils/tema';

export default function TelaEsqueciSenha({ aoIrParaLogin }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const emailLimpo = email.trim().toLowerCase();

  function enviar() {
    if (!emailLimpo.includes('@')) {
      avisar('E-mail inválido', 'Digite o e-mail da sua conta.');
      return;
    }

    setEnviado(true);
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

        {enviado ? (
          <>
            <Text style={styles.titulo}>Verifique seu e-mail</Text>
            <Text style={styles.subtitulo}>
              Se {emailLimpo} estiver cadastrado, você vai receber as instruções para criar uma
              nova senha.
            </Text>

            <Botao titulo="Voltar ao login" aoPressionar={aoIrParaLogin} />
          </>
        ) : (
          <>
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
          </>
        )}
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