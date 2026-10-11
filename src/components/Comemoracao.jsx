import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CORES } from '../utils/tema';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

export default function Comemoracao({
  visivel,
  total = 0,
  recordes = 0,
  sequencia = 0,
  exercicios = [],
  aoTerminar,
}) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const subida = useRef(new Animated.Value(16)).current;
  const jaTerminou = useRef(false);

  useEffect(() => {
    if (!visivel) return;

    jaTerminou.current = false;
    opacidade.setValue(0);
    subida.setValue(16);

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
    ]).start();
  }, [visivel]);

  // Só vale a primeira vez, para um toque duplo não salvar o treino duas vezes.
  function continuar() {
    if (jaTerminou.current) return;
    jaTerminou.current = true;
    aoTerminar();
  }

  if (!visivel) return null;

  return (
    <View style={styles.fundo}>
      <Animated.View
        style={[styles.cartao, { opacity: opacidade, transform: [{ translateY: subida }] }]}
      >
        <Text style={styles.rotulo}>Treino concluído</Text>

        <View style={styles.blocos}>
          <View style={styles.bloco}>
            <Text style={styles.numeroBloco}>{total}</Text>
            <Text style={styles.rotuloBloco}>{total === 1 ? 'exercício' : 'exercícios'}</Text>
          </View>

          {sequencia > 0 && (
            <View style={[styles.bloco, styles.blocoEspaco]}>
              <Text style={styles.numeroBloco}>{sequencia}</Text>
              <Text style={styles.rotuloBloco}>{sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
            </View>
          )}

          {recordes > 0 && (
            <View style={[styles.bloco, styles.blocoEspaco]}>
              <Text style={styles.numeroBloco}>{recordes}</Text>
              <Text style={styles.rotuloBloco}>{recordes === 1 ? 'recorde' : 'recordes'}</Text>
            </View>
          )}
        </View>

        {exercicios.length > 0 && (
          <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
            {exercicios.map((exercicio, indice) => (
              <View
                key={exercicio.id ?? indice}
                style={[styles.linha, indice === exercicios.length - 1 && styles.linhaUltima]}
              >
                <Text style={styles.nomeExercicio} numberOfLines={1}>
                  {exercicio.nome}
                </Text>
                {exercicio.peso ? (
                  <Text style={styles.pesoExercicio}>{exercicio.peso} kg</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.botao} onPress={continuar} activeOpacity={0.8}>
          <Text style={styles.textoBotao}>Continuar</Text>
        </TouchableOpacity>
      </Animated.View>
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
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 20,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: CORES.textoSecundario,
    marginBottom: 14,
  },
  blocos: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bloco: {
    flex: 1,
    backgroundColor: CORES.fundo,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  blocoEspaco: {
    marginLeft: 8,
  },
  numeroBloco: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
  },
  rotuloBloco: {
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
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  linhaUltima: {
    borderBottomWidth: 0,
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
  botao: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  textoBotao: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
});