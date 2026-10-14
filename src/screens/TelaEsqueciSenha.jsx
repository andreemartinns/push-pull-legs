import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import FundoTela from '../components/FundoTela';
import LinhaBatimento from '../components/LinhaBatimento';
import LogoAnimada from '../components/LogoAnimada';
import TituloAnimado from '../components/TituloAnimado';
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
          <LogoAnimada tamanho={90} />
        </View>

        <LinhaBatimento style={styles.batimento} />

        <TituloAnimado texto="Esqueci a senha" style={styles.titulo} />
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
    marginBottom: 8,
  },
  batimento: {
    marginBottom: 16,
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