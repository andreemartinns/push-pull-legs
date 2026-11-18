import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { MotiView } from 'moti';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { P } from '../utils/theme';
import CartaoCompartilhar, { ALTURA_CARTAO, LARGURA_CARTAO } from './ShareCard';

const VERDE_CLARO = '#14573F';
const CREME = '#F1EFE4';

// Espaço reservado embaixo para a barra flutuante de navegação não cobrir os botões.
const FOLGA_NAV = 110;

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

// Faz um número "contar" de 0 até o valor, em vez de aparecer de uma vez.
function useContagem(alvo, atraso = 500, duracao = 900) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let quadro;
    const espera = setTimeout(() => {
      const inicio = Date.now();
      const passo = () => {
        const progresso = Math.min(1, (Date.now() - inicio) / duracao);
        const suave = 1 - Math.pow(1 - progresso, 3);
        setValor(Math.round(alvo * suave));
        if (progresso < 1) quadro = requestAnimationFrame(passo);
      };
      quadro = requestAnimationFrame(passo);
    }, atraso);

    return () => {
      clearTimeout(espera);
      cancelAnimationFrame(quadro);
    };
  }, [alvo]);

  return valor;
}

// Um quadradinho de número (exercícios, dias seguidos, recordes).
function Numero({ valor, rotulo, destaque, indice }) {
  const contado = useContagem(valor, 450 + indice * 120);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 350 + indice * 120 }}
      style={[styles.numero, indice > 0 && styles.numeroEspaco, destaque && styles.numeroDestaque]}
    >
      <Text style={styles.valor} numberOfLines={1}>
        {contado}
      </Text>
      <Text style={styles.rotuloNumero} numberOfLines={1}>
        {rotulo}
      </Text>
    </MotiView>
  );
}

// Uma linha da lista: entra deslizando, uma depois da outra.
function LinhaExercicio({ exercicio, indice, ultima }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -14 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 600 + Math.min(indice, 8) * 70 }}
      style={[styles.linha, ultima && styles.linhaUltima]}
    >
      <View style={styles.marca}>
        <Ionicons name="checkmark" size={14} color={P.limao} />
      </View>
      <Text style={styles.nomeExercicio} numberOfLines={1}>
        {exercicio.nome}
      </Text>
      {exercicio.peso ? <Text style={styles.pesoExercicio}>{exercicio.peso} kg</Text> : null}
    </MotiView>
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
  const { height: alturaTela } = useWindowDimensions();
  const jaTerminou = useRef(false);
  const cartaoRef = useRef(null);
  const [compartilhando, setCompartilhando] = useState(false);

  useEffect(() => {
    if (!visivel) return;

    jaTerminou.current = false;

    // Vibração de sucesso, quando o aparelho tem.
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (erro) {
        // ignora
      }
    }
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
      <MotiView
        from={{ opacity: 0, translateY: 28, scale: 0.96 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 140 }}
        style={[styles.cartao, { maxHeight: Math.max(320, alturaTela - FOLGA_NAV - 40) }]}
      >
        {/* Topo verde */}
        <View style={styles.topo}>
          <View style={styles.circulo} />

          <View style={styles.linhaTopo}>
            <View style={styles.pilula}>
              <Text style={styles.textoPilula}>{divisao ? `TREINO ${divisao}` : 'TREINO'}</Text>
            </View>

            <View style={styles.selo}>
              <MotiView
                from={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ type: 'timing', duration: 1600, loop: true }}
                style={styles.anel}
              />
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 9, delay: 250 }}
                style={styles.seloMiolo}
              >
                <Ionicons name="checkmark" size={24} color={P.verde} />
              </MotiView>
            </View>
          </View>

          <Text style={styles.titulo}>CONCLUÍDO</Text>
          <Text style={styles.data}>{dataFormatada}</Text>
        </View>

        {/* Miolo: números e lista (rola se faltar espaço) */}
        <ScrollView
          style={styles.miolo}
          contentContainerStyle={styles.mioloConteudo}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.numeros}>
            {numeros.map((item, indice) => (
              <Numero
                key={item.rotulo}
                valor={item.valor}
                rotulo={item.rotulo}
                destaque={item.destaque}
                indice={indice}
              />
            ))}
          </View>

          {exercicios.length > 0 && (
            <View style={styles.lista}>
              {exercicios.map((exercicio, indice) => (
                <LinhaExercicio
                  key={exercicio.id ?? indice}
                  exercicio={exercicio}
                  indice={indice}
                  ultima={indice === exercicios.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Botões sempre visíveis */}
        <View style={styles.rodape}>
          <Pressable
            style={({ pressed }) => [
              styles.botaoSecundario,
              (pressed || compartilhando) && styles.botaoApertado,
            ]}
            onPress={compartilhar}
            disabled={compartilhando}
            accessibilityLabel="Compartilhar treino"
          >
            {compartilhando ? (
              <ActivityIndicator size="small" color={P.verde} />
            ) : (
              <Ionicons name="share-social" size={18} color={P.verde} />
            )}
            <Text style={styles.textoSecundario}>
              {compartilhando ? 'Gerando...' : 'Compartilhar'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.botao, pressed && styles.botaoApertado]}
            onPress={continuar}
          >
            <Text style={styles.textoBotao}>Continuar</Text>
          </Pressable>
        </View>
      </MotiView>

      {/* A imagem para os stories: fica fora da tela e só é usada na captura. */}
      <View ref={cartaoRef} collapsable={false} style={styles.foraDaTela}>
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
    backgroundColor: 'rgba(4, 36, 28, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: FOLGA_NAV,
  },
  foraDaTela: {
    position: 'absolute',
    left: -5000,
    top: 0,
    width: LARGURA_CARTAO,
    height: ALTURA_CARTAO,
    pointerEvents: 'none',
  },
  cartao: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.cartao,
    borderRadius: 32,
    overflow: 'hidden',
  },
  topo: {
    backgroundColor: P.verde,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  circulo: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: VERDE_CLARO,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pilula: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoPilula: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.verde,
  },
  selo: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anel: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.limao,
  },
  seloMiolo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.limao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 56,
    lineHeight: 58,
    color: CREME,
  },
  data: {
    fontSize: 13,
    fontWeight: '600',
    color: CREME,
    opacity: 0.8,
    marginTop: 2,
  },
  miolo: {
    flexGrow: 0,
    flexShrink: 1,
  },
  mioloConteudo: {
    padding: 18,
  },
  numeros: {
    flexDirection: 'row',
  },
  numero: {
    flex: 1,
    backgroundColor: P.fundo,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  numeroEspaco: {
    marginLeft: 8,
  },
  numeroDestaque: {
    backgroundColor: P.limao,
  },
  valor: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 40,
    lineHeight: 42,
    color: P.verde,
  },
  rotuloNumero: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textoSecundario,
    marginTop: 2,
  },
  lista: {
    marginTop: 14,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  linhaUltima: {
    borderBottomWidth: 0,
  },
  marca: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nomeExercicio: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: P.texto,
    marginRight: 12,
  },
  pesoExercicio: {
    fontSize: 13,
    fontWeight: '800',
    color: P.verde,
  },
  rodape: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
  },
  botaoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.fundo,
    borderRadius: 999,
    paddingVertical: 15,
    marginRight: 8,
  },
  textoSecundario: {
    fontSize: 14,
    fontWeight: '800',
    color: P.verde,
    marginLeft: 6,
  },
  botao: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 15,
  },
  textoBotao: {
    fontSize: 15,
    fontWeight: '800',
    color: P.verde,
  },
  botaoApertado: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});