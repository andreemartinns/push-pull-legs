import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function CampoTexto({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  senha = false,
  teclado = 'default',
  capitalizar = 'none',
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={CORES.textoSecundario}
        selectionColor={CORES.destaque}
        secureTextEntry={senha}
        keyboardType={teclado}
        autoCapitalize={capitalizar}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginBottom: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: CORES.texto,
  },
});