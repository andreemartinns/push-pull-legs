import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from '../components/FadeIn';
import { P } from '../utils/theme';

function Row({ icon, label, onPress, danger }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? P.erro : P.limao} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={P.textoSecundario} />}
    </Pressable>
  );
}

export default function ProfileScreen({ user, onOpenReminder, onReplayTutorial, onSignOut }) {
  const initial = (user.nome || '?').trim().charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
  container: { flex: 1, backgroundColor: P.fundo },
  content: { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 130 },
  head: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: P.limao },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: P.texto },
  email: { fontSize: 13, color: P.textoSecundario, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
  },
  rowPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowIconDanger: { backgroundColor: 'rgba(194,59,59,0.14)' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: P.texto },
  rowLabelDanger: { color: P.erro },
  gap: { height: 14 },
});