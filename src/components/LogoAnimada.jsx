import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Logo from './Logo';

const VERDE = '#00A651';
const NATIVO = Platform.OS !== 'web';

export default function LogoAnimada({ tamanho = 110, style }) {
  const pulso = useRef(new Animated.Value(0)).current;
  const onda = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
        Animated.timing(pulso, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: NATIVO }),
      ])
    );
    const animOnda = Animated.loop(
      Animated.sequence([
        Animated.timing(onda, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: NATIVO }),
        Animated.timing(onda, { toValue: 0, duration: 0, useNativeDriver: NATIVO }),
      ])
    );
    animPulso.start();
    animOnda.start();
    return () => {
      animPulso.stop();
      animOnda.stop();
    };
  }, [pulso, onda]);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const total = tamanho * 1.5;

  return (
    <View style={[{ width: total, height: total }, styles.centro, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.onda,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            opacity: onda.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
            transform: [{ scale: onda.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
          },
        ]}
      />
      <Animated.View style={{ width: tamanho, height: tamanho, transform: [{ scale: escala }] }}>
        <Logo tamanho={tamanho} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onda: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: VERDE,
  },
});