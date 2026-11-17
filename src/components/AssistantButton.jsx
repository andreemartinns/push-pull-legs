import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { P } from '../utils/theme';

export default function BotaoAssistente({ aoPressionar }) {
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel="Abrir assistente, tire suas dúvidas"
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
    >
      <Ionicons name="chatbubble-ellipses" size={28} color={P.limao} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    boxShadow: '0px 4px 8px rgba(15, 61, 46, 0.35)',
  },
  pressionado: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
});