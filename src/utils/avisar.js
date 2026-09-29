import { Alert, Platform } from 'react-native';

export function avisar(titulo, mensagem, aoConfirmar) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    if (aoConfirmar) aoConfirmar();
    return;
  }
  Alert.alert(
    titulo,
    mensagem,
    aoConfirmar ? [{ text: 'OK', onPress: aoConfirmar }] : undefined
  );
}