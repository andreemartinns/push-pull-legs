import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from '../components/FadeIn';
import { CORES } from '../utils/theme';

function Row({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? CORES.erro : CORES.destaque} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={CORES.textoSecundario} />}
    </Pressable>
  );
}

export default function ProfileScreen({ user, onOpenReminder, onReplayTutorial, onSignOut }) {
  const initial = (user.nome || '?').trim().charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user.nome}</Text>
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <Row icon="notifications-outline" label="Lembretes" onPress={onOpenReminder} />
        <Row icon="help-circle-outline" label="Rever tutorial" onPress={onReplayTutorial} />
      </FadeIn>

      <FadeIn delay={220}>
        <View style={styles.gap} />
        <Row icon="log-out-outline" label="Sair" onPress={onSignOut} danger />
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  content: { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 40 },
  head: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: CORES.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: CORES.textoSobreDestaque },
  name: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', color: CORES.texto },
  email: { fontSize: 13, color: CORES.textoSecundario, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.cartao,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowPressed: { opacity: 0.6, transform: [{ scale: 0.98 }] },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconDanger: { backgroundColor: 'rgba(229,72,77,0.12)' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: CORES.texto },
  rowLabelDanger: { color: CORES.erro },
  gap: { height: 14 },
});