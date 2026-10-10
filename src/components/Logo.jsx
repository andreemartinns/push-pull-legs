import { Image, StyleSheet } from 'react-native';
import { CORES } from '../utils/tema';

// Selo redondo da academia.
// "tamanho" é o diâmetro. "style" permite ajustar posição em cada tela.
export default function Logo({ tamanho = 140, style }) {
  return (
    <Image
      source={require('../../assets/logo-ritmo.jpg')}
      style={[
        styles.imagem,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
        style,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  imagem: {
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: CORES.destaque,
  },
});