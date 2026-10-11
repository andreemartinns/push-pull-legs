import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

const OPCOES = [30, 60, 90, 120];

export default function TemporizadorDescanso({ visivel, aoFechar }) {
  const [duracao, setDuracao] = useState(60);
  const [restante, setRestante] = useState(60);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef(null);
  const jaVibrouRef = useRef(false);

  const larguraBarra = useRef(new Animated.Value(100)).current;

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

  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const tempoFormatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  const terminou = restante <= 0;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable style={styles.fundo} onPress={aoFechar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <Text style={styles.titulo}>{terminou ? 'Descanso terminou' : 'Descanso'}</Text>

          <Text style={[styles.tempo, terminou && styles.tempoPronto]}>
            {terminou ? 'Pronto!' : tempoFormatado}
          </Text>

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
            {OPCOES.map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.opcao, duracao === opcao && styles.opcaoAtiva]}
                onPress={() => escolherDuracao(opcao)}
              >
                <Text style={[styles.textoOpcao, duracao === opcao && styles.textoOpcaoAtiva]}>
                  {opcao}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.acoes}>
            {!terminou && (
              <TouchableOpacity style={styles.botaoSecundario} onPress={alternarPausa}>
                <Text style={styles.textoSecundario}>{rodando ? 'Pausar' : 'Continuar'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.botaoSecundario} onPress={reiniciar}>
              <Text style={styles.textoSecundario}>Reiniciar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoPrincipal} onPress={aoFechar}>
            <Text style={styles.textoPrincipal}>{terminou ? 'Voltar ao treino' : 'Fechar'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cartao: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 14,
    color: CORES.textoSecundario,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tempo: {
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
    marginVertical: 10,
  },
  tempoPronto: {
    color: CORES.destaque,
  },
  barraFundo: {
    width: '100%',
    height: 6,
    backgroundColor: CORES.borda,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  barraPreenchimento: {
    height: 6,
    backgroundColor: CORES.destaque,
  },
  opcoes: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  opcao: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    paddingHorizontal: 12,
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
    marginBottom: 14,
  },
  botaoSecundario: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textoSecundario: {
    fontSize: 14,
    color: CORES.textoSecundario,
    fontWeight: 'bold',
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
});