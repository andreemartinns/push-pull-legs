import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CORES } from '../utils/tema';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

// Verde, amarelo e azul do Brasil, mais o amarelo do app e branco.
const CORES_CONFETE = ['#009C3B', '#FFDF00', '#002776', '#FFFFFF', CORES.destaque];
const QUANTIDADE_CONFETES = 32;
const DURACAO_TOTAL = 3200;

export default function Comemoracao({ visivel, total = 0, recordes = 0, aoTerminar }) {
  const { width: larguraTela, height: alturaTela } = Dimensions.get('window');

  const escala = useRef(new Animated.Value(0.5)).current;
  const opacidade = useRef(new Animated.Value(0)).current;
  const jaTerminou = useRef(false);

  // Guarda sempre a versão mais recente da função, para o temporizador não usar uma velha.
  const aoTerminarRef = useRef(aoTerminar);
  aoTerminarRef.current = aoTerminar;

  // Sorteia os confetes uma vez a cada vez que a comemoração abre.
  const confetes = useMemo(() => {
    if (!visivel) return [];

    return Array.from({ length: QUANTIDADE_CONFETES }, (_, i) => ({
      id: i,
      x: Math.random() * larguraTela,
      tamanho: 8 + Math.random() * 8,
      cor: CORES_CONFETE[i % CORES_CONFETE.length],
      atraso: Math.random() * 500,
      duracao: 1800 + Math.random() * 1400,
      deriva: (Math.random() - 0.5) * 120,
      giro: 360 + Math.random() * 720,
      progresso: new Animated.Value(0),
    }));
  }, [visivel]);

  useEffect(() => {
    if (!visivel) return;

    jaTerminou.current = false;
    escala.setValue(0.5);
    opacidade.setValue(0);

    // Vibração de sucesso, quando o aparelho tem.
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      // Haptics pode não existir no navegador; ignora.
    }

    // O cartão cresce com efeito de mola.
    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
    ]).start();

    // Os confetes caem.
    confetes.forEach((confete) => {
      Animated.timing(confete.progresso, {
        toValue: 1,
        duration: confete.duracao,
        delay: confete.atraso,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USAR_DRIVER_NATIVO,
      }).start();
    });

    const temporizador = setTimeout(terminar, DURACAO_TOTAL);
    return () => clearTimeout(temporizador);
  }, [visivel]);

  // Pode ser chamada pelo tempo ou por um toque; só vale a primeira vez.
  function terminar() {
    if (jaTerminou.current) return;
    jaTerminou.current = true;
    aoTerminarRef.current();
  }

  if (!visivel) return null;

  const textoExercicios = `${total} ${total === 1 ? 'exercício concluído' : 'exercícios concluídos'}`;
  const textoRecordes =
    recordes > 0 ? `${recordes} ${recordes === 1 ? 'novo recorde' : 'novos recordes'}` : '';

  return (
    <Pressable style={styles.fundo} onPress={terminar}>
      <View style={styles.camadaConfete} pointerEvents="none">
        {confetes.map((confete) => (
          <Animated.View
            key={confete.id}
            style={{
              position: 'absolute',
              top: -30,
              left: confete.x,
              width: confete.tamanho,
              height: confete.tamanho * 0.6,
              backgroundColor: confete.cor,
              borderRadius: 2,
              opacity: confete.progresso.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 1, 0],
              }),
              transform: [
                {
                  translateY: confete.progresso.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, alturaTela + 60],
                  }),
                },
                {
                  translateX: confete.progresso.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, confete.deriva],
                  }),
                },
                {
                  rotate: confete.progresso.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${confete.giro}deg`],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>

      <Animated.View style={[styles.cartao, { opacity: opacidade, transform: [{ scale: escala }] }]}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.titulo}>Treino completo!</Text>
        <Text style={styles.detalhe}>{textoExercicios}</Text>
        {textoRecordes !== '' && (
          <View style={styles.selo}>
            <Text style={styles.textoSelo}>{textoRecordes}</Text>
          </View>
        )}
        <Text style={styles.dica}>Toque para continuar</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  camadaConfete: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderWidth: 2,
    borderColor: CORES.destaque,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.destaque,
    textAlign: 'center',
  },
  detalhe: {
    fontSize: 16,
    color: CORES.texto,
    marginTop: 8,
  },
  selo: {
    backgroundColor: CORES.destaque,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 12,
  },
  textoSelo: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.textoSobreDestaque,
  },
  dica: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 16,
  },
});