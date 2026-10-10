import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import FundoTela from '../components/FundoTela';
import Logo from '../components/Logo';
import { CORES } from '../utils/tema';

export default function TelaEsqueciSenha({ aoIrParaLogin }) {
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

        <Text style={styles.titulo}>Esqueci a senha</Text>
        <Text style={styles.subtitulo}>
          Fale com a recepção da academia. Eles vão criar uma nova senha para você e é só entrar
          de novo.
        </Text>

        <Botao titulo="Voltar ao login" aoPressionar={aoIrParaLogin} />
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
});