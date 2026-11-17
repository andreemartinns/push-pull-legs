import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { P } from '../utils/theme';

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
        <Pressable onPress={aoVoltar} style={({ pressed }) => [s.voltar, pressed && s.pressionado]}>
          <Ionicons name="chevron-back" size={14} color={P.texto} />
          <Text style={s.textoVoltar}>Voltar</Text>
        </Pressable>
      )}
      {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
      <Text style={s.titulo}>{titulo}</Text>
    </View>
  );
}

export function Cartao({ children, verde, style, onPress }) {
  const estilo = [s.cartao, verde && s.cartaoVerde, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...estilo, pressed && s.pressionado]}>
        {children}
      </Pressable>
    );
  }
  return <View style={estilo}>{children}</View>;
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
          <Pressable
            key={op.id}
            onPress={() => aoMudar(op.id)}
            style={[s.aba, on && s.abaAtiva]}
          >
            <Text style={[s.textoAba, on && s.textoAbaAtiva]}>{op.rotulo}</Text>
          </Pressable>
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
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [s.pilula, ativo && s.pilulaAtiva, pressed && s.pressionado]}
    >
      <Text style={[s.textoPilula, ativo && s.textoPilulaAtiva]}>{texto}</Text>
    </Pressable>
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
  const [focado, setFocado] = useState(false);
  return (
    <View style={s.campoBloco}>
      {rotulo ? <Text style={s.rotuloCampo}>{rotulo}</Text> : null}
      <TextInput
        style={[s.campo, multiline && s.campoMulti, focado && s.campoFocado]}
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
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
      />
    </View>
  );
}

export function BotaoPrincipal({ titulo, aoPressionar, carregando, desabilitado }) {
  const off = carregando || desabilitado;
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={off}
      style={({ pressed }) => [s.botao, off && s.botaoOff, pressed && s.pressionado]}
    >
      <Text style={s.textoBotao}>{carregando ? 'Aguarde...' : titulo}</Text>
    </Pressable>
  );
}

export function BotaoSecundario({ titulo, aoPressionar }) {
  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [s.botaoSec, pressed && s.pressionado]}
    >
      <Text style={s.textoBotaoSec}>{titulo}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: P.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 130 },
  centro: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  pressionado: { transform: [{ scale: 0.97 }], opacity: 0.9 },

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
  textoVoltar: { fontSize: 13, fontWeight: '700', color: P.texto, marginLeft: 2 },
  subtitulo: { fontSize: 15, color: P.textoSecundario, marginBottom: 6 },
  titulo: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: P.texto },

  cartao: { backgroundColor: P.cartao, borderRadius: 24, padding: 16 },
  cartaoVerde: { backgroundColor: P.verde, borderRadius: 32, padding: 24 },

  secao: { marginTop: 28, marginBottom: 14 },
  tituloSecao: { fontSize: 18, fontWeight: '700', color: P.texto },
  descricaoSecao: { fontSize: 13, color: P.textoSecundario, marginTop: 4 },

  abas: { flexDirection: 'row', marginBottom: 20 },
  aba: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
  },
  abaAtiva: { backgroundColor: P.verde },
  textoAba: { fontSize: 14, fontWeight: '700', color: P.textoSecundario },
  textoAbaAtiva: { color: P.textoSobreVerde },

  numero: { fontSize: 30, fontWeight: '800', color: P.texto },
  legenda: { fontSize: 13, color: P.textoSecundario, marginTop: 2 },

  pilula: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  pilulaAtiva: { backgroundColor: P.verde },
  textoPilula: { fontSize: 14, fontWeight: '700', color: P.texto },
  textoPilulaAtiva: { color: P.textoSobreVerde },

  campoBloco: { marginBottom: 16 },
  rotuloCampo: { fontSize: 13, fontWeight: '700', color: P.textoSecundario, marginBottom: 8 },
  campo: {
    backgroundColor: P.cartao,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: P.texto,
  },
  campoMulti: { minHeight: 88, textAlignVertical: 'top' },
  campoFocado: { backgroundColor: P.campoFocado },

  botao: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoOff: { opacity: 0.6 },
  textoBotao: { fontSize: 16, fontWeight: '800', color: P.verde },
  botaoSec: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  textoBotaoSec: { fontSize: 15, fontWeight: '700', color: P.texto },
});