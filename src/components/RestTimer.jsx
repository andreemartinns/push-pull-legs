import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { P } from '../utils/theme';

const OPCOES = [30, 60, 90, 120, 180];

// Guarda a última duração escolhida enquanto o app está aberto.
// Fica fora do componente para não se perder quando o modal fecha.
let ultimaDuracao = 60;

function formatarOpcao(segundos) {
  if (segundos < 120) return `${segundos}s`;
  return `${segundos / 60}min`;
}

export default function TemporizadorDescanso({ visivel, aoFechar }) {
  const [duracao, setDuracao] = useState(ultimaDuracao);
  const [restante, setRestante] = useState(ultimaDuracao);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef(null);
  const jaVibrouRef = useRef(false);

  const larguraBarra = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visivel) {
      setDuracao(ultimaDuracao);
      setRestante(ultimaDuracao);
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
    ultimaDuracao = segundos;
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
          <View style={styles.titulo}>
            <View style={styles.barraTitulo} />
            <View style={styles.textosTitulo}>
              <Text style={styles.rotulo}>{terminou ? 'Descanso terminou' : 'Descansando'}</Text>
              <Text style={[styles.tempo, terminou && styles.tempoPronto]}>
                {terminou ? 'Pronto' : tempoFormatado}
              </Text>
            </View>
          </View>

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
            {OPCOES.map((opcao, indice) => (
              <TouchableOpacity
                key={opcao}
                style={[
                  styles.opcao,
                  indice < OPCOES.length - 1 && styles.opcaoEspaco,
                  duracao === opcao && styles.opcaoAtiva,
                ]}
                onPress={() => escolherDuracao(opcao)}
              >
                <Text style={[styles.textoOpcao, duracao === opcao && styles.textoOpcaoAtiva]}>
                  {formatarOpcao(opcao)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.acoes}>
            {!terminou && (
              <TouchableOpacity
                style={[styles.botaoSecundario, styles.botaoSecundarioEspaco]}
                onPress={alternarPausa}
              >
                <Text style={styles.textoSecundario}>{rodando ? 'Pausar' : 'Continuar'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.botaoSecundario} onPress={reiniciar}>
              <Text style={styles.textoSecundario}>Reiniciar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoPrincipal} onPress={aoFechar} activeOpacity={0.8}>
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
    backgroundColor: 'rgba(11, 31, 23, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: P.fundo,
    borderRadius: 32,
    padding: 24,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18,
  },
  barraTitulo: {
    width: 4,
    borderRadius: 2,
    backgroundColor: P.verde,
    marginRight: 12,
  },
  textosTitulo: {
    flex: 1,
  },
  rotulo: {
    fontSize: 13,
    color: P.textoSecundario,
  },
  tempo: {
    fontSize: 60,
    lineHeight: 66,
    fontWeight: '800',
    letterSpacing: -1,
    color: P.verde,
  },
  tempoPronto: {
    fontSize: 44,
    lineHeight: 66,
    textTransform: 'uppercase',
  },
  barraFundo: {
    width: '100%',
    height: 8,
    backgroundColor: P.cartao,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 22,
  },
  barraPreenchimento: {
    height: 8,
    backgroundColor: P.verde,
    borderRadius: 4,
  },
  opcoes: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  opcao: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 11,
  },
  opcaoEspaco: {
    marginRight: 6,
  },
  opcaoAtiva: {
    backgroundColor: P.verde,
  },
  textoOpcao: {
    fontSize: 13,
    fontWeight: '700',
    color: P.texto,
  },
  textoOpcaoAtiva: {
    color: P.limao,
    fontWeight: '800',
  },
  acoes: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  botaoSecundario: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 14,
  },
  botaoSecundarioEspaco: {
    marginRight: 8,
  },
  textoSecundario: {
    fontSize: 14,
    fontWeight: '700',
    color: P.textoSecundario,
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  textoPrincipal: {
    fontSize: 16,
    fontWeight: '800',
    color: P.verde,
  },
});