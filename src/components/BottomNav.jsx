import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { P } from '../utils/theme';

const NATIVE = Platform.OS !== 'web';

const TABS = [
  { key: 'workout', label: 'Treino', icon: 'barbell-outline', iconOn: 'barbell' },
  { key: 'history', label: 'Histórico', icon: 'time-outline', iconOn: 'time' },
  { key: 'measurements', label: 'Medidas', icon: 'body-outline', iconOn: 'body' },
  { key: 'water', label: 'Água', icon: 'water-outline', iconOn: 'water' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', iconOn: 'person' },
];

function TabItem({ tab, active, onPress }) {
  const value = useRef(new Animated.Value(active ? 1 : 0)).current;

  // A largura (flex) e a cor de fundo mudam, então aqui não dá para usar o motor nativo.
  useEffect(() => {
    Animated.spring(value, {
      toValue: active ? 1 : 0,
      friction: 9,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const flex = value.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const fundo = value.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(214,242,74,0)', 'rgba(214,242,74,1)'],
  });

  return (
    <Animated.View style={[styles.tabBox, { flex }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}
      >
        <Animated.View style={[styles.tab, { backgroundColor: fundo }]}>
          <Ionicons
            name={active ? tab.iconOn : tab.icon}
            size={22}
            color={active ? P.verde : P.textoSuaveSobreVerde}
          />
          {active && (
            <Text style={styles.label} numberOfLines={1}>
              {tab.label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function BottomNav({ active, onChange }) {
  function handlePress(key) {
    if (key !== active && NATIVE) {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange(key);
  }

  return (
    // Flutua sobre a tela. O "box-none" deixa o toque passar nas áreas vazias ao redor.
    <View style={styles.area}>
      <View style={styles.bar}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={active === tab.key}
            onPress={() => handlePress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.verde,
    borderRadius: 999,
    padding: 8,
    boxShadow: '0px 8px 24px rgba(15, 61, 46, 0.35)',
  },
  tabBox: {
    height: 48,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '800',
    color: P.verde,
  },
});