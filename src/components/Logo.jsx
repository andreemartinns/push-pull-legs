import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function Logo({ tamanho = 140 }) {
  return (
    <View style={[styles.container, { width: tamanho, height: tamanho }]}>
      <Text style={styles.texto}>PPL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontSize: 42,
    fontWeight: 'bold',
    color: CORES.destaque,
    letterSpacing: 2,
  },
});