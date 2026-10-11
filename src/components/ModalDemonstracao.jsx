import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CORES } from '../utils/tema';

// Janela "Como fazer": mostra a foto de início e a de fim se alternando em loop,
// os músculos trabalhados e o passo a passo.
export default function ModalDemonstracao({ visivel, nome, demonstracao, aoFechar }) {
  // 0 = foto de início, 1 = foto de fim.
  // Usa o driver de JavaScript (não o nativo) para o rótulo "Início/Fim" acompanhar a troca.
  const troca = useRef(new Animated.Value(0)).current;
  const [mostrandoFim, setMostrandoFim] = useState(false);

  // Baixa as duas fotos assim que a janela abre, para a troca não piscar.
  useEffect(() => {
    if (!visivel || !demonstracao) return;

    demonstracao.imagens.forEach((url) => {
      Image.prefetch(url).catch(() => {});
    });
  }, [visivel, nome]);

  useEffect(() => {
    if (!visivel || !demonstracao) return;

    troca.setValue(0);
    setMostrandoFim(false);

    const suave = { easing: Easing.inOut(Easing.quad), useNativeDriver: false };
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(troca, { toValue: 1, duration: 450, ...suave }),
        Animated.delay(900),
        Animated.timing(troca, { toValue: 0, duration: 450, ...suave }),
      ])
    );
    animacao.start();

    const id = troca.addListener(({ value }) => setMostrandoFim(value > 0.5));

    return () => {
      animacao.stop();
      troca.removeListener(id);
    };
  }, [visivel, nome]);

  if (!demonstracao) return null;

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <View style={styles.fundo}>
        {/* Tocar fora da janela fecha. */}
        <Pressable style={styles.areaFora} onPress={aoFechar} />

        <View style={styles.janela}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo} numberOfLines={2}>
              {nome}
            </Text>
            <Pressable onPress={aoFechar} hitSlop={12}>
              <Text style={styles.fechar}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
            <View style={styles.moldura}>
              <Image source={{ uri: demonstracao.imagens[0] }} style={styles.foto} resizeMode="cover" />
              <Animated.Image
                source={{ uri: demonstracao.imagens[1] }}
                style={[styles.foto, styles.fotoSobreposta, { opacity: troca }]}
                resizeMode="cover"
              />
              <View style={styles.rotulo}>
                <Text style={styles.textoRotulo}>{mostrandoFim ? 'Fim' : 'Início'}</Text>
              </View>
            </View>

            <View style={styles.musculos}>
              {demonstracao.principais.map((musculo) => (
                <View key={`p-${musculo}`} style={[styles.etiqueta, styles.etiquetaPrincipal]}>
                  <Text style={styles.textoEtiquetaPrincipal}>{musculo}</Text>
                </View>
              ))}
              {demonstracao.secundarios.map((musculo) => (
                <View key={`s-${musculo}`} style={styles.etiqueta}>
                  <Text style={styles.textoEtiqueta}>{musculo}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.subtitulo}>Passo a passo</Text>

            {demonstracao.passos.map((passo, indice) => (
              <View key={indice} style={styles.passo}>
                <View style={styles.numero}>
                  <Text style={styles.textoNumero}>{indice + 1}</Text>
                </View>
                <Text style={styles.textoPasso}>{passo}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  areaFora: {
    flex: 1,
  },
  janela: {
    maxHeight: '88%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: CORES.fundo,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 3,
    borderColor: CORES.destaque,
    paddingTop: 16,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titulo: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginRight: 12,
  },
  fechar: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  moldura: {
    width: '100%',
    aspectRatio: 850 / 567,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoSobreposta: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rotulo: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textoRotulo: {
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
  },
  musculos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  etiqueta: {
    backgroundColor: CORES.borda,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  etiquetaPrincipal: {
    backgroundColor: CORES.destaque,
  },
  textoEtiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  textoEtiquetaPrincipal: {
    fontSize: 12,
    fontWeight: '900',
    color: CORES.textoSobreDestaque,
  },
  subtitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
    marginTop: 8,
    marginBottom: 12,
  },
  passo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  numero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  textoNumero: {
    fontSize: 12,
    fontWeight: '900',
    color: CORES.destaque,
  },
  textoPasso: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: CORES.texto,
  },
});