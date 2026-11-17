import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { P } from '../utils/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedInput = Animated.createAnimatedComponent(TextInput);

const FONTE = {
  media: 'BarlowCondensed_600SemiBold',
  forte: 'BarlowCondensed_700Bold',
  extra: 'BarlowCondensed_800ExtraBold',
};

function vibrar(tipo) {
  if (Platform.OS === 'web') return;
  if (tipo === 'selecao') Haptics.selectionAsync();
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// Botão base: afunda ao tocar (mola) e vibra no celular.
function Toque({ onPress, style, children, disabled, haptico = 'leve', escala = 0.96 }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={(e) => {
        if (haptico) vibrar(haptico);
        onPress?.(e);
      }}
      onPressIn={() => {
        scale.value = withSpring(escala, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Tela({ children, centro = false }) {
  return (
    <View style={s.tela}>
      <ScrollView
        contentContainerStyle={[s.conteudo, centro && s.centro]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Cabecalho({ titulo, subtitulo, aoVoltar }) {
  return (
    <View style={s.cabecalho}>
      {aoVoltar && (
        <Toque onPress={aoVoltar} style={s.voltar} haptico="selecao">
          <Ionicons name="chevron-back" size={16} color={P.texto} />
          <Text style={s.textoVoltar}>VOLTAR</Text>
        </Toque>
      )}
      {/* assinatura diagonal, igual aos ângulos do logo */}
      <View style={s.marca}>
        <View style={s.marcaVerde} />
        <View style={s.marcaLimao} />
      </View>
      {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
      <Text style={s.titulo}>{titulo}</Text>
    </View>
  );
}

// indice (opcional): faz o cartão entrar em sequência. Ex.: <Cartao indice={0}>, indice={1}...
export function Cartao({ children, verde, style, onPress, indice }) {
  const estilo = [s.cartao, verde && s.cartaoVerde, style];
  const faixa = verde ? <View style={s.faixaCartao} /> : null;

  if (onPress) {
    return (
      <Toque onPress={onPress} style={estilo} escala={0.97}>
        {faixa}
        {children}
      </Toque>
    );
  }

  if (indice !== undefined) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 450, delay: indice * 90 }}
        style={estilo}
      >
        {faixa}
        {children}
      </MotiView>
    );
  }

  return (
    <View style={estilo}>
      {faixa}
      {children}
    </View>
  );
}

export function Secao({ titulo, descricao }) {
  return (
    <View style={s.secao}>
      <Text style={s.tituloSecao}>{titulo}</Text>
      {descricao ? <Text style={s.descricaoSecao}>{descricao}</Text> : null}
    </View>
  );
}

// opcoes: [{ id: 'historico', rotulo: 'Treinos' }, ...]
export function Abas({ opcoes, ativa, aoMudar }) {
  return (
    <View style={s.abas}>
      {opcoes.map((op) => {
        const on = op.id === ativa;
        return (
          <Toque
            key={op.id}
            onPress={() => aoMudar(op.id)}
            style={[s.aba, on && s.abaAtiva]}
            haptico="selecao"
          >
            <Text style={[s.textoAba, on && s.textoAbaAtiva]}>{op.rotulo}</Text>
          </Toque>
        );
      })}
    </View>
  );
}

export function Numero({ valor, legenda }) {
  return (
    <Cartao style={{ flex: 1 }}>
      <Text style={s.numero}>{valor}</Text>
      <Text style={s.legenda}>{legenda}</Text>
    </Cartao>
  );
}

// Pílula de escolha (objetivo, condições, Sim/Não...).
export function Pilula({ texto, ativo, aoPressionar }) {
  return (
    <Toque
      onPress={aoPressionar}
      style={[s.pilula, ativo && s.pilulaAtiva]}
      haptico="selecao"
      escala={0.94}
    >
      <Text style={[s.textoPilula, ativo && s.textoPilulaAtiva]}>{texto}</Text>
    </Toque>
  );
}

export function Campo({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  teclado,
  senha,
  capitalizar,
  multiline,
  maxLength,
}) {
  const foco = useSharedValue(0);

  const animado = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(foco.value, [0, 1], [P.cartao, P.campoFocado]),
    borderColor: interpolateColor(foco.value, [0, 1], ['rgba(15,61,46,0)', P.verde]),
  }));

  return (
    <View style={s.campoBloco}>
      {rotulo ? <Text style={s.rotuloCampo}>{rotulo}</Text> : null}
      <AnimatedInput
        style={[s.campo, multiline && s.campoMulti, animado]}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={P.textoSecundario}
        keyboardType={teclado}
        secureTextEntry={!!senha}
        autoCapitalize={capitalizar || 'none'}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={() => {
          foco.value = withTiming(1, { duration: 180 });
        }}
        onBlur={() => {
          foco.value = withTiming(0, { duration: 180 });
        }}
      />
    </View>
  );
}

export function BotaoPrincipal({ titulo, aoPressionar, carregando, desabilitado }) {
  const off = carregando || desabilitado;
  return (
    <Toque
      onPress={aoPressionar}
      disabled={off}
      style={[s.botao, off && s.botaoOff]}
      escala={0.95}
    >
      <Text style={s.textoBotao}>{carregando ? 'AGUARDE...' : titulo}</Text>
    </Toque>
  );
}

export function BotaoSecundario({ titulo, aoPressionar }) {
  return (
    <Toque onPress={aoPressionar} style={s.botaoSec}>
      <Text style={s.textoBotaoSec}>{titulo}</Text>
    </Toque>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: P.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 130 },
  centro: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },

  cabecalho: { marginBottom: 20 },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  textoVoltar: {
    fontFamily: FONTE.forte,
    fontSize: 15,
    letterSpacing: 1,
    color: P.texto,
    marginLeft: 2,
  },
  marca: { flexDirection: 'row', marginBottom: 12, paddingLeft: 6 },
  marcaVerde: {
    width: 36,
    height: 6,
    backgroundColor: P.verde,
    transform: [{ skewX: '-25deg' }],
  },
  marcaLimao: {
    width: 14,
    height: 6,
    marginLeft: 5,
    backgroundColor: P.limao,
    transform: [{ skewX: '-25deg' }],
  },
  subtitulo: { fontFamily: FONTE.media, fontSize: 18, color: P.textoSecundario, marginBottom: 2 },
  titulo: { fontFamily: FONTE.extra, fontSize: 46, letterSpacing: -0.5, color: P.texto },

  cartao: { backgroundColor: P.cartao, borderRadius: 24, padding: 16 },
  cartaoVerde: {
    backgroundColor: P.verde,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
  },
  faixaCartao: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 90,
    height: 220,
    backgroundColor: P.verdeClaro,
    opacity: 0.55,
    transform: [{ rotate: '25deg' }],
    pointerEvents: 'none',
  },

  secao: { marginTop: 28, marginBottom: 14 },
  tituloSecao: { fontFamily: FONTE.extra, fontSize: 26, letterSpacing: 0.3, color: P.texto },
  descricaoSecao: { fontFamily: FONTE.media, fontSize: 16, color: P.textoSecundario, marginTop: 2 },

  abas: { flexDirection: 'row', marginBottom: 20 },
  aba: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginRight: 8,
  },
  abaAtiva: { backgroundColor: P.verde },
  textoAba: { fontFamily: FONTE.forte, fontSize: 17, letterSpacing: 0.5, color: P.textoSecundario },
  textoAbaAtiva: { color: P.textoSobreVerde },

  numero: { fontFamily: FONTE.extra, fontSize: 42, color: P.texto },
  legenda: { fontFamily: FONTE.media, fontSize: 16, color: P.textoSecundario, marginTop: 0 },

  pilula: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginRight: 8,
    marginBottom: 8,
  },
  pilulaAtiva: { backgroundColor: P.verde },
  textoPilula: { fontFamily: FONTE.forte, fontSize: 17, letterSpacing: 0.3, color: P.texto },
  textoPilulaAtiva: { color: P.textoSobreVerde },

  campoBloco: { marginBottom: 16 },
  rotuloCampo: {
    fontFamily: FONTE.forte,
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: P.textoSecundario,
    marginBottom: 8,
  },
  campo: {
    backgroundColor: P.cartao,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: FONTE.media,
    fontSize: 19,
    color: P.texto,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  campoMulti: { minHeight: 88, textAlignVertical: 'top' },

  botao: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoOff: { opacity: 0.6 },
  textoBotao: { fontFamily: FONTE.extra, fontSize: 21, letterSpacing: 1.5, color: P.verde },
  botaoSec: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBotaoSec: { fontFamily: FONTE.forte, fontSize: 19, letterSpacing: 1, color: P.texto },
});