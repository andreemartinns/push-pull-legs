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
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

const AVISO = 'Não substitui orientação profissional. Seu professor pode ver suas perguntas.';

export default function TelaAssistente({ aoVoltar }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const rolagem = useRef(null);

  // Carrega as perguntas anteriores do aluno.
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('ia_perguntas')
        .select('id, pergunta, resposta, alerta')
        .order('criado_em', { ascending: false })
        .limit(20);

      if (error) console.log('Erro ao carregar perguntas', error);

      const lista = [];
      (data || []).reverse().forEach((linha) => {
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
      const { data, error } = await supabase.functions.invoke('ia-duvidas', {
        body: { pergunta },
      });

      if (error) {
        console.log('Erro ao chamar a IA', error);
        // Tenta ler a mensagem de erro enviada pela função (ex: limite por hora).
        try {
          const corpo = await error.context?.json?.();
          if (corpo?.erro) resposta = corpo.erro;
        } catch (e) {
          // mantém a mensagem padrão
        }
      } else if (data?.resposta) {
        resposta = data.resposta;
        alerta = !!data.alerta;
      } else if (data?.erro) {
        resposta = data.erro;
      }
    } catch (erro) {
      console.log('Erro inesperado ao chamar a IA', erro);
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
      <Pressable onPress={aoVoltar} hitSlop={10} style={styles.voltar}>
        <Text style={styles.textoVoltar}>← Voltar</Text>
      </Pressable>

      <View style={styles.titulo}>
        <View style={styles.barraTitulo} />
        <View>
          <Text style={styles.rotulo}>Tire suas dúvidas</Text>
          <Text style={styles.nome}>Assistente</Text>
        </View>
      </View>

      <View style={styles.faixaAviso}>
        <Text style={styles.textoAviso}>{AVISO}</Text>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={CORES.destaque} />
        </View>
      ) : (
        <ScrollView
          ref={rolagem}
          style={styles.lista}
          contentContainerStyle={styles.conteudo}
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
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
              <ActivityIndicator size="small" color={CORES.destaque} />
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.rodape}>
        <TextInput
          style={styles.campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva sua dúvida"
          placeholderTextColor={CORES.textoSecundario}
          maxLength={500}
          editable={!enviando}
          onSubmitEditing={enviar}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.botaoEnviar, (enviando || !texto.trim()) && styles.botaoDesativado]}
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
  container: { flex: 1, backgroundColor: CORES.fundo, paddingHorizontal: 20, paddingTop: 50 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  voltar: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 16 },
  textoVoltar: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 14 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: CORES.destaque, marginRight: 10 },
  rotulo: { fontSize: 13, color: CORES.textoSecundario },
  nome: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  faixaAviso: {
    borderWidth: 1,
    borderColor: CORES.destaque,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textoAviso: { fontSize: 12, color: CORES.destaque, textAlign: 'center' },
  lista: { flex: 1 },
  conteudo: { paddingBottom: 12 },
  vazio: {
    fontSize: 14,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  balao: { maxWidth: '85%', borderRadius: 12, padding: 12, marginBottom: 10 },
  balaoAluno: { alignSelf: 'flex-end', backgroundColor: CORES.destaque },
  balaoIa: {
    alignSelf: 'flex-start',
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
  },
  balaoAlerta: { borderColor: CORES.erro },
  textoBalao: { fontSize: 15, lineHeight: 21, color: CORES.texto },
  textoBalaoAluno: { color: CORES.textoSobreDestaque },
  rodape: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  campo: {
    flex: 1,
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CORES.texto,
    marginRight: 8,
  },
  botaoEnviar: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  botaoDesativado: { opacity: 0.5 },
  textoEnviar: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
});