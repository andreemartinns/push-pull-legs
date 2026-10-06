import { StyleSheet, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function FundoTela({ children }) {
  return <View style={styles.fundo}>{children}</View>;
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
});