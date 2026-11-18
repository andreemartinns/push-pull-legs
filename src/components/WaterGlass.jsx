import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { P } from '../utils/theme';

const ALTURA = 300; // altura do cartão-tanque
const AMP_A = 7; // altura da onda do fundo
const AMP_B = 5; // altura da onda da frente
const FOLGA = AMP_A * 2 + 4;
const AGUA = '#1C8FD0';
const AGUA_CLARA = '#4DB3E6';
const CREME = '#F1EFE4';
const VERDE_CLARO = '#14573F';

const SOMBRA = {
  textShadowColor: 'rgba(4, 36, 28, 0.35)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

// Desenha uma onda. O período é igual à largura do cartão, então a onda se emenda sem corte.
function caminhoOnda(largura, periodo, amp) {
  let d = `M0 ${amp}`;
  for (let x = 0; x <= largura; x += 4) {
    d += ` L${x} ${amp + Math.sin((x / periodo) * Math.PI * 2) * amp}`;
  }
  return `${d} L${largura} ${amp * 2 + 2} L0 ${amp * 2 + 2} Z`;
}

// Faz um número "contar" até o novo valor, em vez de pular de uma vez.
function useContagem(alvo, duracao = 700) {
  const [valor, setValor] = useState(alvo);
  const atual = useRef(alvo);

  useEffect(() => {
    const de = atual.current;
    if (de === alvo) return undefined;

    const inicio = Date.now();
    let quadro;

    const passo = () => {
      const progresso = Math.min(1, (Date.now() - inicio) / duracao);
      const suave = 1 - Math.pow(1 - progresso, 3);
      const numero = Math.round(de + (alvo - de) * suave);
      atual.current = numero;
      setValor(numero);
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };

    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);

  return valor;
}

// Uma onda que corre sem parar na horizontal.
function Onda({ largura, amp, duracao, sentido, cor, opacidade }) {
  const andar = useSharedValue(0);

  useEffect(() => {
    andar.value = 0;
    andar.value = withRepeat(
      withTiming(1, { duration: duracao, easing: Easing.linear }),
      -1,
      false
    );
  }, [duracao]);

  const estilo = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: sentido > 0 ? -largura * andar.value : -largura * (1 - andar.value),
      },
    ],
  }));

  const caminho = useMemo(() => caminhoOnda(largura * 2, largura, amp), [largura, amp]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -amp * 2,
          left: 0,
          width: largura * 2,
          height: amp * 2 + 2,
          opacity: opacidade,
        },
        estilo,
      ]}
    >
      <Svg width={largura * 2} height={amp * 2 + 2}>
        <Path d={caminho} fill={cor} />
      </Svg>
    </Animated.View>
  );
}

// Bolha que sobe dentro da água quando você adiciona um copo.
function Bolha({ i, largura, altura }) {
  const t = useSharedValue(0);
  const esquerda = useMemo(() => 16 + Math.random() * Math.max(10, largura - 48), [largura]);
  const tamanho = useMemo(() => 6 + Math.random() * 8, []);
  const duracao = useMemo(() => 1000 + Math.random() * 800, []);

  useEffect(() => {
    t.value = withDelay(
      i * 90,
      withTiming(1, { duration: duracao, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const estilo = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : t.value > 0.8 ? (1 - t.value) * 5 : 1,
    transform: [
      { translateY: -altura * t.value },
      { translateX: Math.sin(t.value * Math.PI * 2) * 5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 10,
          left: esquerda,
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.8)',
        },
        estilo,
      ]}
    />
  );
}

// O cartão inteiro é o "tanque": a água sobe de acordo com a meta.
export default function TanqueAgua({ consumido, meta, percentual, falta, batida, pulso }) {
  const [largura, setLargura] = useState(0);
  const [bolhas, setBolhas] = useState(null);
  const primeiro = useRef(true);

  const nivel = useSharedValue(percentual / 100);
  const mola = useSharedValue(1);

  const valorMl = useContagem(consumido);
  const valorPct = useContagem(percentual);

  // A água sobe com uma mola (dá uma leve balançada ao chegar).
  useEffect(() => {
    nivel.value = withSpring(percentual / 100, { damping: 12, stiffness: 70, mass: 0.9 });
  }, [percentual]);

  // A cada copo adicionado: bolhas sobem e o cartão dá um pulinho.
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    setBolhas({ id: pulso, alto: Math.max(40, (percentual / 100) * ALTURA - 24) });
    mola.value = withSequence(withTiming(1.02, { duration: 110 }), withSpring(1, { damping: 8 }));
  }, [pulso]);

  const estiloCartao = useAnimatedStyle(() => ({
    transform: [{ scale: mola.value }],
  }));

  const estiloAgua = useAnimatedStyle(() => {
    const n = Math.min(1, Math.max(0, nivel.value));
    return {
      opacity: Math.min(1, n * 30),
      transform: [{ translateY: (1 - n) * (ALTURA + FOLGA) }],
    };
  });

  return (
    <Animated.View
      style={[styles.cartao, estiloCartao]}
      onLayout={(e) => setLargura(Math.round(e.nativeEvent.layout.width))}
    >
      <View style={styles.circulo} />

      {largura > 0 && (
        <Animated.View style={[styles.agua, estiloAgua]}>
          <Onda
            largura={largura}
            amp={AMP_A}
            duracao={4200}
            sentido={-1}
            cor={AGUA_CLARA}
            opacidade={0.55}
          />
          <Onda
            largura={largura}
            amp={AMP_B}
            duracao={2800}
            sentido={1}
            cor={AGUA}
            opacidade={1}
          />
        </Animated.View>
      )}

      {bolhas &&
        largura > 0 &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <Bolha key={`${bolhas.id}-${i}`} i={i} largura={largura} altura={bolhas.alto} />
        ))}

      <View style={styles.conteudo}>
        <View style={styles.linhaTopo}>
          <View style={styles.pilula}>
            {batida && (
              <Ionicons name="checkmark" size={12} color={P.verde} style={styles.iconePilula} />
            )}
            <Text style={styles.textoPilula}>{batida ? 'META BATIDA' : 'META DE HOJE'}</Text>
          </View>
          <Text style={styles.pct}>{valorPct}%</Text>
        </View>

        <View>
          <Text style={styles.numero} numberOfLines={1}>
            {valorMl}
            <Text style={styles.unidade}> ml</Text>
          </Text>
          <Text style={styles.deMeta}>de {meta} ml</Text>
        </View>

        <Text style={styles.status}>
          {batida ? 'Você bateu a meta de hoje' : `Faltam ${falta} ml`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    height: ALTURA,
    borderRadius: 32,
    backgroundColor: P.verde,
    overflow: 'hidden',
    marginBottom: 12,
  },
  circulo: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: VERDE_CLARO,
  },
  agua: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ALTURA,
    backgroundColor: AGUA,
  },
  conteudo: {
    height: ALTURA,
    padding: 24,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconePilula: {
    marginRight: 4,
  },
  textoPilula: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.verde,
  },
  pct: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 40,
    color: CREME,
    ...SOMBRA,
  },
  numero: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 96,
    lineHeight: 100,
    color: CREME,
    ...SOMBRA,
  },
  unidade: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    color: CREME,
  },
  deMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: CREME,
    marginTop: 2,
    ...SOMBRA,
  },
  status: {
    fontSize: 15,
    fontWeight: '800',
    color: CREME,
    ...SOMBRA,
  },
});