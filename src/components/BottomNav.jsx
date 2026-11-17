import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CORES } from '../utils/theme';

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

  useEffect(() => {
    Animated.spring(value, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 120,
      useNativeDriver: NATIVE,
    }).start();
  }, [active]);

  const lift = value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <Animated.View style={{ transform: [{ translateY: lift }, { scale }] }}>
        <Ionicons
          name={active ? tab.iconOn : tab.icon}
          size={24}
          color={active ? CORES.destaque : CORES.textoSecundario}
        />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
    </Pressable>
  );
}

export default function BottomNav({ active, onChange }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  const index = Math.max(0, TABS.findIndex((t) => t.key === active));
  const tabWidth = width / TABS.length;

  useEffect(() => {
    if (!width) return;
    Animated.spring(x, {
      toValue: index * tabWidth,
      friction: 8,
      tension: 90,
      useNativeDriver: NATIVE,
    }).start();
  }, [index, width]);

  function handlePress(key) {
    if (key !== active && NATIVE) {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange(key);
  }

  return (
    <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View style={[styles.indicatorBox, { width: tabWidth, transform: [{ translateX: x }] }]}>
          <View style={styles.indicator} />
        </Animated.View>
      )}
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          active={active === tab.key}
          onPress={() => handlePress(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: CORES.cartao,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  indicatorBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
  },
  indicator: {
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: CORES.destaque,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: CORES.textoSecundario,
  },
  labelActive: {
    color: CORES.destaque,
  },
});