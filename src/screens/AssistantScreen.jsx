import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Cabecalho } from '../components/UI';
import { api } from '../utils/api';
import { P } from '../utils/theme';

const AVISO = 'Não substitui orientação profissional. Seu professor pode ver suas perguntas.';

export default function TelaAssistente({ aoVoltar }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [focado, setFocado] = useState(false);
  const rolagem = useRef(null);

  // Carrega as perguntas anteriores do aluno.
  useEffect(() => {
    async function carregar() {
      let data = [];
      try {
        data = (await api('GET', '/ia-perguntas')) || [];
      } catch (e) {
        console.log('Erro ao carregar perguntas', e);
      }

      const lista = [];
      data
        .slice(0, 20)
        .reverse()
        .forEach((linha) => {
          lista.push({ id: `${linha.id}-p`, quem: 'aluno', texto: linha.pergunta });
          if (linha.resposta) {
            lista.push({
              id: `${linha.id}-r`,
              quem: 'ia',
              texto: linha.resposta,
              alerta: linha.alerta,
            });
          }
        });
      setMensagens(lista);
      setCarregando(false);
    }
    carregar();
  }, []);

  function rolarParaFim() {
    setTimeout(() => rolagem.current?.scrollToEnd({ animated: true }), 100);
  }

  async function enviar() {
    const pergunta = texto.trim();
    if (!pergunta || enviando) return;

    setTexto('');
    setEnviando(true);
    setMensagens((atual) => [...atual, { id: `p-${Date.now()}`, quem: 'aluno', texto: pergunta }]);
    rolarParaFim();

    let resposta = 'Não foi possível responder agora. Fale com seu professor.';
    let alerta = false;

    try {
      const data = await api('POST', '/ia-duvidas', { pergunta });
      if (data?.resposta) {
        resposta = data.resposta;
        alerta = !!data.alerta;
      }
    } catch (erro) {
      console.log('Erro ao chamar a IA', erro);
      if (erro?.message && erro.message !== 'Erro de conexão') resposta = erro.message;
    }

    setMensagens((atual) => [
      ...atual,
      { id: `r-${Date.now()}`, quem: 'ia', texto: resposta, alerta },
    ]);
    setEnviando(false);
    rolarParaFim();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Cabecalho titulo="Assistente" subtitulo="Tire suas dúvidas" aoVoltar={aoVoltar} />

      <View style={styles.faixaAviso}>
        <Text style={styles.textoAviso}>{AVISO}</Text>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={P.verde} />
        </View>
      ) : (
        <ScrollView
          ref={rolagem}
          style={styles.lista}
          contentContainerStyle={styles.conteudo}
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mensagens.length === 0 && (
            <Text style={styles.vazio}>
              Pergunte como executar um exercício do seu treino ou como usar o app. Em caso de dor,
              tontura ou falta de ar, pare e avise seu professor.
            </Text>
          )}

          {mensagens.map((m) => (
            <View
              key={m.id}
              style={[
                styles.balao,
                m.quem === 'aluno' ? styles.balaoAluno : styles.balaoIa,
                m.alerta && styles.balaoAlerta,
              ]}
            >
              <Text style={[styles.textoBalao, m.quem === 'aluno' && styles.textoBalaoAluno]}>
                {m.texto}
              </Text>
            </View>
          ))}

          {enviando && (
            <View style={[styles.balao, styles.balaoIa]}>
              <ActivityIndicator size="small" color={P.verde} />
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.rodape}>
        <TextInput
          style={[styles.campo, focado && styles.campoFocado]}
          value={texto}
          onChangeText={setTexto}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder="Escreva sua dúvida"
          placeholderTextColor={P.textoSecundario}
          maxLength={500}
          editable={!enviando}
          onSubmitEditing={enviar}
          returnKeyType="send"
        />
        <Pressable
          style={({ pressed }) => [
            styles.botaoEnviar,
            (enviando || !texto.trim()) && styles.botaoDesativado,
            pressed && styles.pressionado,
          ]}
          onPress={enviar}
          disabled={enviando || !texto.trim()}
        >
          <Text style={styles.textoEnviar}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.fundo, paddingHorizontal: 20, paddingTop: 56 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressionado: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  faixaAviso: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  textoAviso: { fontSize: 12, color: P.textoSecundario, textAlign: 'center' },
  lista: { flex: 1 },
  conteudo: { paddingBottom: 12 },
  vazio: {
    fontSize: 14,
    lineHeight: 22,
    color: P.textoSecundario,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  balao: { maxWidth: '85%', borderRadius: 24, padding: 14, marginBottom: 10 },
  balaoAluno: { alignSelf: 'flex-end', backgroundColor: P.verde },
  balaoIa: { alignSelf: 'flex-start', backgroundColor: P.cartao },
  balaoAlerta: { borderWidth: 2, borderColor: P.erro },
  textoBalao: { fontSize: 15, lineHeight: 21, color: P.texto },
  textoBalaoAluno: { color: P.textoSobreVerde },
  rodape: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  campo: {
    flex: 1,
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: P.texto,
    marginRight: 8,
  },
  campoFocado: { backgroundColor: P.campoFocado },
  botaoEnviar: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  botaoDesativado: { opacity: 0.5 },
  textoEnviar: { fontSize: 14, fontWeight: '800', color: P.verde },
});