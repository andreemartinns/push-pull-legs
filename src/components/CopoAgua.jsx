import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const L = 150; // largura do copo
const A = 190; // altura do copo
const NATIVO = Platform.OS !== 'web';
const AZUL = '#2DA8FF';

function caminhoOnda(largura, periodo, amp) {
  let d = `M0 ${amp}`;
  for (let x = 0; x <= largura; x += 4) {
    d += ` L${x} ${amp + Math.sin((x / periodo) * Math.PI * 2) * amp}`;
  }
  return `${d} L${largura} ${amp * 2 + 2} L0 ${amp * 2 + 2} Z`;
}

function Onda({ opacidade, duracao, sentido, amp, topo }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: duracao,
        easing: Easing.linear,
        useNativeDriver: NATIVO,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const tx = x.interpolate({
    inputRange: [0, 1],
    outputRange: sentido > 0 ? [0, -L] : [-L, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: topo,
        left: 0,
        width: L * 2,
        height: amp * 2 + 2,
        opacity: opacidade,
        transform: [{ translateX: tx }],
      }}
    >
      <Svg width={L * 2} height={amp * 2 + 2}>
        <Path d={caminhoOnda(L * 2, L, amp)} fill={AZUL} />
      </Svg>
    </Animated.View>
  );
}

function Bolha({ i, alto }) {
  const t = useRef(new Animated.Value(0)).current;
  const esq = useRef(14 + Math.random() * (L - 44)).current;
  const tam = useRef(5 + Math.random() * 8).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 900 + Math.random() * 700,
      delay: i * 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 8,
        left: esq,
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.85)',
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -alto] }) },
          { translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 5, -3] }) },
        ],
      }}
    />
  );
}

function Gota({ pulso }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulso) return;
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: 520,
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVO,
    }).start();
  }, [pulso]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -34,
        left: L / 2 - 6,
        width: 12,
        height: 16,
        borderRadius: 8,
        backgroundColor: AZUL,
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) },
          { scaleY: t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) },
        ],
      }}
    />
  );
}

export default function CopoAgua({ percentual, pulso }) {
  const nivel = useRef(new Animated.Value(percentual / 100)).current;
  const escala = useRef(new Animated.Value(1)).current;
  const primeiro = useRef(true);
  const [bolhas, setBolhas] = useState(null);

  useEffect(() => {
    Animated.spring(nivel, {
      toValue: percentual / 100,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [percentual]);

  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    setBolhas({ id: pulso, alto: Math.max(30, (percentual / 100) * A - 16) });
    Animated.sequence([
      Animated.timing(escala, { toValue: 1.05, duration: 110, useNativeDriver: NATIVO }),
      Animated.spring(escala, { toValue: 1, friction: 3, useNativeDriver: NATIVO }),
    ]).start();
  }, [pulso]);

  const altura = nivel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, A],
    extrapolate: 'clamp',
  });
  const opOnda = nivel.interpolate({
    inputRange: [0, 0.02],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[s.wrap, { transform: [{ scale: escala }] }]}>
      <View style={s.copo}>
        <Animated.View style={[s.agua, { height: altura }]}>
          <Animated.View style={[s.ondas, { opacity: opOnda }]}>
            <Onda opacidade={0.45} duracao={3200} sentido={-1} amp={6} topo={-16} />
            <Onda opacidade={1} duracao={2200} sentido={1} amp={5} topo={-10} />
          </Animated.View>
        </Animated.View>

        {bolhas &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <Bolha key={`${bolhas.id}-${i}`} i={i} alto={bolhas.alto} />
          ))}

        <View style={s.brilho} />
        <View style={s.centro} pointerEvents="none">
          <Text style={s.pct}>{percentual}%</Text>
        </View>
      </View>
      <Gota pulso={pulso} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'center', width: L, height: A, marginVertical: 14 },
  copo: {
    width: L,
    height: A,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  agua: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AZUL,
    overflow: 'visible',
  },
  ondas: { position: 'absolute', top: 0, left: 0, right: 0, height: 0, overflow: 'visible' },
  brilho: {
    position: 'absolute',
    left: 10,
    top: 14,
    width: 8,
    height: A * 0.55,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  centro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pct: {
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
});