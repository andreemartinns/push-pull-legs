import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { CORES } from '../utils/tema';

export default function BotaoAssistente({ aoPressionar }) {
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel="Abrir assistente, tire suas dúvidas"
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
    >
      <Ionicons name="chatbubble-ellipses" size={28} color={CORES.textoSobreDestaque} />
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
    backgroundColor: CORES.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressionado: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
});