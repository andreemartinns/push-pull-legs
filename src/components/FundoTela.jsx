import { ImageBackground, StyleSheet, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function FundoTela({ children }) {
  return (
    <ImageBackground
      source={require('../../assets/fundo.jpg')}
      style={styles.imagem}
      resizeMode="cover"
    >
      <View style={styles.escurecer}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imagem: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  escurecer: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
  },
});