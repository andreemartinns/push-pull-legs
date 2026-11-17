import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEMONSTRACOES } from '../utils/demonstrations';
import { CORES } from '../utils/theme';
import ModalDemonstracao from './DemoModal';

// No navegador não existe driver nativo, então só usamos no celular.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

// Selo "Novo recorde": aparece com um pulo de mola.
function SeloRecorde() {
  const escala = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(escala, {
      toValue: 1,
      friction: 3,
      tension: 120,
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.selo, { transform: [{ scale: escala }] }]}>
      <Ionicons name="trophy" size={12} color={CORES.destaque} />
      <Text style={styles.textoSelo}>Novo recorde</Text>
    </Animated.View>
  );
}

export default function CartaoExercicio({
  exercicio,
  ultimaCarga,
  novoRecorde,
  indice = 0,
  somenteLeitura = false,
  aoAlternar,
  aoRemover,
  aoEditar,
}) {
  const detalhe =
    exercicio.series && exercicio.repeticoes
      ? `${exercicio.series} x ${exercicio.repeticoes}`
      : '';
  const peso = exercicio.peso ? `${exercicio.peso} kg` : '';

  const textoUltima = ultimaCarga
    ? `Última vez: ${ultimaCarga.peso} kg` +
      (ultimaCarga.series && ultimaCarga.repeticoes
        ? ` (${ultimaCarga.series} x ${ultimaCarga.repeticoes})`
        : '')
    : '';

  // Nem todo exercício tem demonstração. Só mostra o botão quando existe.
  const demonstracao = DEMONSTRACOES[exercicio.nome];
  const [demonstracaoAberta, setDemonstracaoAberta] = useState(false);

  const entrada = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;
  const escalaMarcador = useRef(new Animated.Value(1)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const primeiraVez = useRef(true);

  // Entrada: o cartão sobe e aparece. O atraso depende da posição, formando uma cascata.
  // O "% 6" evita que cartões lá no fim da lista esperem demais.
  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 380,
      delay: (indice % 6) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }, []);

  // Ao marcar como concluído, a bolinha dá um pulo de mola e o cartão acende um brilho.
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    if (!exercicio.concluido) return;

    escalaMarcador.setValue(0.5);
    Animated.spring(escalaMarcador, {
      toValue: 1,
      friction: 3,
      tension: 140,
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();

    // O brilho usa a opacidade de uma camada por cima do cartão, que funciona no celular e no navegador.
    brilho.setValue(1);
    Animated.timing(brilho, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start();
  }, [exercicio.concluido]);

  // Ao remover, o cartão desliza para o lado e some, e só depois sai da lista.
  function remover() {
    Animated.timing(saida, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start(() => aoRemover());
  }

  const subida = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const deslize = saida.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  // Treino do professor: o aluno não edita nem remove. Só mostra a linha de botões se houver algo nela.
  const mostrarRodape = !!demonstracao || !somenteLeitura;

  return (
    <Animated.View
      style={{
        opacity: Animated.multiply(entrada, saida),
        transform: [{ translateY: subida }, { translateX: deslize }],
      }}
    >
      <View style={[styles.cartao, exercicio.concluido && styles.cartaoConcluido]}>
        {/* Camada do brilho: acende ao concluir e se apaga sozinha. */}
        <Animated.View style={[styles.brilho, { opacity: brilho }]} />

        <View style={styles.linhaPrincipal}>
          <TouchableOpacity style={styles.area} onPress={aoAlternar} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.marcador,
                exercicio.concluido && styles.marcadorAtivo,
                { transform: [{ scale: escalaMarcador }] },
              ]}
            >
              {exercicio.concluido && (
                <Ionicons name="checkmark" size={18} color={CORES.textoSobreDestaque} />
              )}
            </Animated.View>

            <View style={styles.textos}>
              <Text style={[styles.nome, exercicio.concluido && styles.nomeConcluido]}>
                {exercicio.nome}
              </Text>

              <Text style={styles.grupo}>{exercicio.grupo}</Text>

              {(detalhe !== '' || peso !== '') && (
                <View style={styles.linhaDetalhes}>
                  {detalhe !== '' && <Text style={styles.detalhe}>{detalhe}</Text>}
                  {detalhe !== '' && peso !== '' && <Text style={styles.separador}>·</Text>}
                  {peso !== '' && <Text style={styles.peso}>{peso}</Text>}
                </View>
              )}

              {textoUltima !== '' && <Text style={styles.ultimaCarga}>{textoUltima}</Text>}

              {novoRecorde && <SeloRecorde />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Linha de botões, embaixo: Como fazer à esquerda, Editar e Remover à direita. */}
        {mostrarRodape && (
          <View style={styles.rodape}>
            {demonstracao ? (
              <Pressable
                onPress={() => setDemonstracaoAberta(true)}
                style={({ pressed }) => [
                  styles.botaoComoFazer,
                  pressed && styles.botaoPressionado,
                ]}
              >
                <Ionicons name="play-circle" size={18} color={CORES.destaque} />
                <Text style={styles.textoComoFazer}>Como fazer</Text>
              </Pressable>
            ) : (
              <View />
            )}

            {!somenteLeitura && (
              <View style={styles.acoes}>
                <Pressable
                  onPress={aoEditar}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.botaoIcone,
                    styles.botaoIconeEspaco,
                    pressed && styles.botaoPressionado,
                  ]}
                >
                  <Ionicons name="create-outline" size={20} color={CORES.texto} />
                </Pressable>
                <Pressable
                  onPress={remover}
                  hitSlop={8}
                  style={({ pressed }) => [styles.botaoIcone, pressed && styles.botaoPressionado]}
                >
                  <Ionicons name="trash-outline" size={20} color={CORES.erro} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {demonstracao && (
        <ModalDemonstracao
          visivel={demonstracaoAberta}
          nome={exercicio.nome}
          demonstracao={demonstracao}
          aoFechar={() => setDemonstracaoAberta(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cartaoConcluido: {
    opacity: 0.6,
  },
  brilho: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CORES.destaque,
    opacity: 0,
    borderRadius: 16,
    pointerEvents: 'none',
  },
  linhaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcador: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CORES.cartaoElevado,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  marcadorAtivo: {
    backgroundColor: CORES.destaque,
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: CORES.texto,
  },
  nomeConcluido: {
    textDecorationLine: 'line-through',
    color: CORES.textoSecundario,
  },
  grupo: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginTop: 4,
  },
  linhaDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detalhe: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  separador: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginHorizontal: 8,
  },
  peso: {
    fontSize: 14,
    fontWeight: '700',
    color: CORES.destaque,
  },
  ultimaCarga: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 8,
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: CORES.destaqueSuave,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  textoSelo: {
    color: CORES.destaque,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Linha de botões
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  botaoComoFazer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.destaqueSuave,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textoComoFazer: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.destaque,
    marginLeft: 8,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CORES.cartaoElevado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoIconeEspaco: {
    marginRight: 8,
  },
  botaoPressionado: {
    opacity: 0.6,
  },
});