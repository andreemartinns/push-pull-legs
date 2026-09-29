import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CORES } from '../utils/tema';

export default function Botao({ titulo, aoPressionar, cor = CORES.destaque }) {
  const corDoTexto = cor === CORES.destaque ? CORES.textoSobreDestaque : CORES.texto;

  return (
    <TouchableOpacity
      style={[styles.botao, { backgroundColor: cor }]}
      onPress={aoPressionar}
      activeOpacity={0.8}
    >
      <Text style={[styles.texto, { color: corDoTexto }]}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 15,
  },
});