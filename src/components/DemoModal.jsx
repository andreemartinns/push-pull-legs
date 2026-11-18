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
import { Ionicons } from '@expo/vector-icons';

// Paleta do visual novo (a mesma da tela de treino).
// Depois dá para mover para utils/theme.js.
const P = {
  fundo: '#F1EFE4',
  verde: '#0F3D2E',
  limao: '#D6F24A',
  texto: '#0B1F17',
  textoSecundario: '#55655C',
  cartao: '#E6E3D3',
  textoSobreVerde: '#F1EFE4',
};

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
            <Pressable
              onPress={aoFechar}
              hitSlop={12}
              style={({ pressed }) => [styles.botaoFechar, pressed && styles.pressionado]}
            >
              <Ionicons name="close" size={20} color={P.texto} />
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
                <Text style={styles.textoRotulo}>{mostrandoFim ? 'FIM' : 'INÍCIO'}</Text>
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
    backgroundColor: 'rgba(11, 31, 23, 0.55)',
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
    backgroundColor: P.fundo,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  titulo: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: P.texto,
    marginRight: 12,
  },
  botaoFechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  conteudo: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  moldura: {
    width: '100%',
    aspectRatio: 850 / 567,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: P.cartao,
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
    left: 12,
    bottom: 12,
    backgroundColor: P.verde,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  textoRotulo: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.limao,
  },
  musculos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  etiqueta: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  etiquetaPrincipal: {
    backgroundColor: P.verde,
  },
  textoEtiqueta: {
    fontSize: 13,
    fontWeight: '700',
    color: P.textoSecundario,
  },
  textoEtiquetaPrincipal: {
    fontSize: 13,
    fontWeight: '800',
    color: P.limao,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: P.texto,
    marginTop: 12,
    marginBottom: 14,
  },
  passo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  numero: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  textoNumero: {
    fontSize: 12,
    fontWeight: '800',
    color: P.limao,
  },
  textoPasso: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: P.texto,
  },
});