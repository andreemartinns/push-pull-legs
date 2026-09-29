import { Image } from 'react-native';

export default function Logo({ tamanho = 140 }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: tamanho, height: tamanho, alignSelf: 'center', marginBottom: 24 }}
      resizeMode="contain"
    />
  );
}