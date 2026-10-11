import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { CORES } from '../utils/tema';
import CartaoCompartilhar, { ALTURA_CARTAO, LARGURA_CARTAO } from './CartaoCompartilhar';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

// No navegador: abre o compartilhar do sistema se existir; senão, baixa a imagem.
async function compartilharNaWeb(dataUri) {
  const resposta = await fetch(dataUri);
  const blob = await resposta.blob();
  const arquivo = new File([blob], 'treino.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: 'Treino concluído' });
    } catch (erro) {
      // Se a pessoa fechou a janela de compartilhar, não é erro.
      if (erro && erro.name !== 'AbortError') throw erro;
    }
    return;
  }

  const link = document.createElement('a');
  link.href = dataUri;
  link.download = 'treino.png';
  link.click();
}

// Uma linha da lista: entra deslizando, uma depois da outra.
function LinhaExercicio({ exercicio, indice, ultima }) {
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 320,
      delay: 450 + Math.min(indice, 8) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.linha,
        ultima && styles.linhaUltima,
        {
          opacity: entrada,
          transform: [
            {
              translateX: entrada.interpolate({
                inputRange: [0, 1],
                outputRange: [-14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.marca}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.nomeExercicio} numberOfLines={1}>
        {exercicio.nome}
      </Text>
      {exercicio.peso ? <Text style={styles.pesoExercicio}>{exercicio.peso} kg</Text> : null}
    </Animated.View>
  );
}

export default function Comemoracao({
  visivel,
  total = 0,
  recordes = 0,
  sequencia = 0,
  exercicios = [],
  divisao = null,
  nomesRecorde = [],
  aoTerminar,
}) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const subida = useRef(new Animated.Value(16)).current;
  const faixa = useRef(new Animated.Value(0)).current;
  const jaTerminou = useRef(false);
  const cartaoRef = useRef(null);
  const [compartilhando, setCompartilhando] = useState(false);

  useEffect(() => {
    if (!visivel) return;

    jaTerminou.current = false;
    opacidade.setValue(0);
    subida.setValue(16);
    faixa.setValue(0);

    // Vibração de sucesso, quando o aparelho tem.
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      // Haptics pode não existir no navegador; ignora.
    }

    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
      Animated.timing(subida, {
        toValue: 0,
        duration: 250,
        useNativeDriver: USAR_DRIVER_NATIVO,
      }),
      // A largura não roda no motor nativo, por isso o driver fica desligado aqui.
      Animated.timing(faixa, {
        toValue: 1,
        duration: 700,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [visivel]);

  // Só vale a primeira vez, para um toque duplo não salvar o treino duas vezes.
  function continuar() {
    if (jaTerminou.current) return;
    jaTerminou.current = true;
    aoTerminar();
  }

  // Tira uma "foto" do cartão escondido e abre o compartilhamento.
  async function compartilhar() {
    if (compartilhando || !cartaoRef.current) return;
    setCompartilhando(true);

    try {
      if (Platform.OS === 'web') {
        const uri = await captureRef(cartaoRef, {
          format: 'png',
          quality: 1,
          result: 'data-uri',
        });
        await compartilharNaWeb(uri);
      } else {
        const uri = await captureRef(cartaoRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          width: 1080,
          height: 1920,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartilhar treino',
          });
        }
      }
    } catch (erro) {
      console.log('Erro ao compartilhar treino', erro);
    } finally {
      setCompartilhando(false);
    }
  }

  if (!visivel) return null;

  // Só mostra os números que têm valor.
  const numeros = [{ valor: total, rotulo: total === 1 ? 'exercício' : 'exercícios' }];
  if (sequencia > 0) {
    numeros.push({ valor: sequencia, rotulo: sequencia === 1 ? 'dia seguido' : 'dias seguidos' });
  }
  if (recordes > 0) {
    numeros.push({
      valor: recordes,
      rotulo: recordes === 1 ? 'novo recorde' : 'novos recordes',
      destaque: true,
    });
  }

  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.fundo}>
      <Animated.View
        style={[styles.cartao, { opacity: opacidade, transform: [{ translateY: subida }] }]}
      >
        <Animated.View
          style={[
            styles.faixa,
            {
              width: faixa.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />

        <Text style={styles.rotulo}>Treino</Text>
        <Text style={styles.titulo}>Concluído</Text>

        <View style={styles.numeros}>
          {numeros.map((item, indice) => (
            <View key={item.rotulo} style={[styles.numero, indice > 0 && styles.numeroDivisor]}>
              <Text style={[styles.valor, item.destaque && styles.valorDestaque]}>
                {item.valor}
              </Text>
              <Text style={styles.rotuloNumero}>{item.rotulo}</Text>
            </View>
          ))}
        </View>

        {exercicios.length > 0 && (
          <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
            {exercicios.map((exercicio, indice) => (
              <LinhaExercicio
                key={exercicio.id ?? indice}
                exercicio={exercicio}
                indice={indice}
                ultima={indice === exercicios.length - 1}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.botaoCompartilhar, compartilhando && styles.botaoCompartilharAtivo]}
          onPress={compartilhar}
          disabled={compartilhando}
          activeOpacity={0.8}
        >
          <Text style={styles.textoCompartilhar}>
            {compartilhando ? 'Gerando imagem...' : 'Compartilhar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao} onPress={continuar} activeOpacity={0.8}>
          <Text style={styles.textoBotao}>Continuar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* A imagem para os stories: fica fora da tela e só é usada na captura. */}
      <View ref={cartaoRef} collapsable={false} style={styles.foraDaTela} pointerEvents="none">
        <CartaoCompartilhar
          divisao={divisao}
          data={dataFormatada}
          numeros={numeros}
          exercicios={exercicios}
          nomesRecorde={nomesRecorde}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
    padding: 20,
  },
  foraDaTela: {
    position: 'absolute',
    left: -5000,
    top: 0,
    width: LARGURA_CARTAO,
    height: ALTURA_CARTAO,
  },
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  faixa: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 5,
    backgroundColor: CORES.destaque,
  },
  rotulo: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  titulo: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginBottom: 18,
  },
  numeros: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  numero: {
    flex: 1,
  },
  numeroDivisor: {
    borderLeftWidth: 1,
    borderLeftColor: CORES.borda,
    paddingLeft: 14,
  },
  valor: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  valorDestaque: {
    color: CORES.destaque,
  },
  rotuloNumero: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  lista: {
    maxHeight: 190,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  linhaUltima: {
    borderBottomWidth: 0,
  },
  marca: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: CORES.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  check: {
    fontSize: 11,
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  nomeExercicio: {
    flex: 1,
    fontSize: 14,
    color: CORES.texto,
    marginRight: 12,
  },
  pesoExercicio: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  botaoCompartilhar: {
    borderWidth: 1.5,
    borderColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoCompartilharAtivo: {
    opacity: 0.6,
  },
  textoCompartilhar: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.destaque,
  },
  botao: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotao: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
});