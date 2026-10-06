import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

const OPCOES = [30, 60, 90, 120];

export default function TemporizadorDescanso({ visivel, aoFechar }) {
  const [duracao, setDuracao] = useState(60);
  const [restante, setRestante] = useState(60);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef(null);
  const jaVibrouRef = useRef(false);

  const larguraBarra = useRef(new Animated.Value(100)).current;
  const escalaPulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visivel) {
      setDuracao(60);
      setRestante(60);
      setRodando(true);
      jaVibrouRef.current = false;
      larguraBarra.setValue(100);
    } else {
      setRodando(false);
    }
  }, [visivel]);

  useEffect(() => {
    if (!rodando) return;

    if (restante <= 0) {
      setRodando(false);

      if (!jaVibrouRef.current) {
        jaVibrouRef.current = true;
        dispararVibracao();
        animarPulso();
      }
      return;
    }

    intervaloRef.current = setTimeout(() => {
      setRestante((valor) => valor - 1);
    }, 1000);

    return () => clearTimeout(intervaloRef.current);
  }, [rodando, restante]);

  useEffect(() => {
    const progresso = duracao === 0 ? 0 : (restante / duracao) * 100;
    Animated.timing(larguraBarra, {
      toValue: progresso,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [restante, duracao]);

  function dispararVibracao() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      // Haptics pode não existir em alguns ambientes (ex.: web); ignora silenciosamente
    }
  }

  function animarPulso() {
    Animated.sequence([
      Animated.timing(escalaPulso, { toValue: 1.15, duration: 180, useNativeDriver: true }),
      Animated.timing(escalaPulso, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(escalaPulso, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(escalaPulso, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function escolherDuracao(segundos) {
    setDuracao(segundos);
    setRestante(segundos);
    setRodando(true);
    jaVibrouRef.current = false;
  }

  function alternarPausa() {
    setRodando(!rodando);
  }

  function reiniciar() {
    setRestante(duracao);
    setRodando(true);
    jaVibrouRef.current = false;
  }

  if (!visivel) return null;

  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const tempoFormatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  const terminou = restante <= 0;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cartao, { transform: [{ scale: escalaPulso }] }]}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>{terminou ? 'Descanso concluído! 💪' : 'Descansando...'}</Text>
          <TouchableOpacity onPress={aoFechar}>
            <Text style={styles.fechar}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tempo}>{tempoFormatado}</Text>

        <View style={styles.barraFundo}>
          <Animated.View
            style={[
              styles.barraPreenchimento,
              {
                width: larguraBarra.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.opcoes}>
          {OPCOES.map((segundosOpcao) => (
            <TouchableOpacity
              key={segundosOpcao}
              style={[styles.opcao, duracao === segundosOpcao && styles.opcaoAtiva]}
              onPress={() => escolherDuracao(segundosOpcao)}
            >
              <Text style={[styles.textoOpcao, duracao === segundosOpcao && styles.textoOpcaoAtiva]}>
                {segundosOpcao}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.acoes}>
          <TouchableOpacity style={styles.botaoAcao} onPress={alternarPausa}>
            <Text style={styles.textoBotaoAcao}>{rodando ? 'Pausar' : 'Continuar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoAcao} onPress={reiniciar}>
            <Text style={styles.textoBotaoAcao}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.destaque,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 360,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  fechar: {
    fontSize: 16,
    color: CORES.textoSecundario,
    paddingHorizontal: 6,
  },
  tempo: {
    fontSize: 40,
    fontWeight: '900',
    color: CORES.texto,
    textAlign: 'center',
    marginVertical: 8,
  },
  barraFundo: {
    height: 8,
    backgroundColor: CORES.borda,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barraPreenchimento: {
    height: 8,
    backgroundColor: CORES.destaque,
    borderRadius: 4,
  },
  opcoes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  opcao: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  opcaoAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoOpcao: {
    fontSize: 13,
    color: CORES.texto,
  },
  textoOpcaoAtiva: {
    color: CORES.textoSobreDestaque,
    fontWeight: 'bold',
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  botaoAcao: {
    marginHorizontal: 10,
  },
  textoBotaoAcao: {
    fontSize: 14,
    color: CORES.destaque,
    fontWeight: 'bold',
  },
});