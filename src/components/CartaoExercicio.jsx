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
import { DEMONSTRACOES } from '../utils/demonstracoes';
import { CORES } from '../utils/tema';
import ModalDemonstracao from './ModalDemonstracao';

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
      <Text style={styles.textoSelo}>Novo recorde</Text>
    </Animated.View>
  );
}

export default function CartaoExercicio({
  exercicio,
  ultimaCarga,
  novoRecorde,
  indice = 0,
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
          <TouchableOpacity style={styles.area} onPress={aoAlternar}>
            <Animated.View
              style={[
                styles.marcador,
                exercicio.concluido && styles.marcadorAtivo,
                { transform: [{ scale: escalaMarcador }] },
              ]}
            >
              {exercicio.concluido && <Text style={styles.check}>✓</Text>}
            </Animated.View>

            <View style={styles.textos}>
              <Text style={[styles.nome, exercicio.concluido && styles.nomeConcluido]}>
                {exercicio.nome}
              </Text>
              <View style={styles.linhaDetalhes}>
                <View style={styles.etiqueta}>
                  <Text style={styles.textoEtiqueta}>{exercicio.grupo}</Text>
                </View>
                {detalhe !== '' && <Text style={styles.detalhe}>{detalhe}</Text>}
                {peso !== '' && <Text style={styles.peso}>{peso}</Text>}
              </View>

              {textoUltima !== '' && <Text style={styles.ultimaCarga}>{textoUltima}</Text>}

              {novoRecorde && <SeloRecorde />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Linha de botões, embaixo: Como fazer à esquerda, Editar e Remover à direita. */}
        <View style={styles.rodape}>
          {demonstracao ? (
            <Pressable
              onPress={() => setDemonstracaoAberta(true)}
              style={({ pressed }) => [styles.botaoComoFazer, pressed && styles.botaoPressionado]}
            >
              <Text style={styles.textoComoFazer}>▶ Como fazer</Text>
            </Pressable>
          ) : (
            <View />
          )}

          <View style={styles.acoes}>
            <Pressable
              onPress={aoEditar}
              style={({ pressed }) => [
                styles.botaoAcao,
                styles.botaoAcaoEspaco,
                pressed && styles.botaoPressionado,
              ]}
            >
              <Text style={styles.editar}>Editar</Text>
            </Pressable>
            <Pressable
              onPress={remover}
              style={({ pressed }) => [
                styles.botaoAcao,
                styles.botaoRemover,
                pressed && styles.botaoPressionado,
              ]}
            >
              <Text style={styles.remover}>Remover</Text>
            </Pressable>
          </View>
        </View>
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
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cartaoConcluido: {
    borderColor: CORES.destaque,
    opacity: 0.7,
  },
  brilho: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CORES.destaque,
    opacity: 0,
    borderRadius: 10,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CORES.textoSecundario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  marcadorAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  check: {
    color: CORES.textoSobreDestaque,
    fontSize: 14,
    fontWeight: 'bold',
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    color: CORES.texto,
  },
  nomeConcluido: {
    textDecorationLine: 'line-through',
    color: CORES.textoSecundario,
  },
  linhaDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  etiqueta: {
    backgroundColor: CORES.borda,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  textoEtiqueta: {
    color: CORES.texto,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detalhe: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginRight: 8,
  },
  peso: {
    fontSize: 13,
    color: CORES.texto,
    fontWeight: 'bold',
  },
  ultimaCarga: {
    fontSize: 12,
    color: CORES.textoSecundario,
    fontStyle: 'italic',
  },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  textoSelo: {
    color: CORES.textoSobreDestaque,
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  // Linha de botões
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  botaoComoFazer: {
    borderWidth: 1,
    borderColor: CORES.destaque,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoComoFazer: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoAcao: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  botaoAcaoEspaco: {
    marginRight: 8,
  },
  botaoRemover: {
    borderColor: '#6b2b2b',
  },
  botaoPressionado: {
    opacity: 0.6,
  },
  editar: {
    color: CORES.texto,
    fontSize: 13,
    fontWeight: 'bold',
  },
  remover: {
    color: '#e57373',
    fontSize: 13,
    fontWeight: 'bold',
  },
});