import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

const OBJETIVOS = [
  'Hipertrofia',
  'Emagrecimento',
  'Condicionamento',
  'Reabilitação',
  'Saúde e bem-estar',
];

const CONDICOES = [
  'Problema cardíaco',
  'Pressão alta',
  'Diabetes',
  'Problema respiratório (asma, bronquite...)',
  'Problema articular ou nas costas',
  'Gestante',
];

function Opcao({ texto, ativo, aoPressionar }) {
  return (
    <Pressable
      onPress={aoPressionar}
      style={[styles.opcao, ativo && styles.opcaoAtiva]}
    >
      <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

export default function TelaAnamnese({ usuario, aoConcluir }) {
  const [objetivo, setObjetivo] = useState(null);
  const [condicoes, setCondicoes] = useState([]);
  const [semCondicao, setSemCondicao] = useState(false);
  const [restricao, setRestricao] = useState(null); // true, false ou null
  const [lesoes, setLesoes] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function alternarCondicao(nome) {
    setSemCondicao(false);
    setCondicoes((atual) =>
      atual.includes(nome) ? atual.filter((item) => item !== nome) : [...atual, nome]
    );
  }

  function escolherNenhuma() {
    setSemCondicao(true);
    setCondicoes([]);
  }

  async function salvar() {
    if (!objetivo) {
      avisar('Falta um dado', 'Escolha o seu objetivo.');
      return;
    }
    if (!semCondicao && condicoes.length === 0) {
      avisar('Falta um dado', 'Marque suas condições de saúde ou "Nenhuma".');
      return;
    }
    if (restricao === null) {
      avisar('Falta um dado', 'Responda se algum médico já restringiu exercícios.');
      return;
    }
    if (!consentimento) {
      avisar('Falta o consentimento', 'Para continuar, aceite o uso dos seus dados de saúde.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from('anamneses').upsert(
      {
        aluno_id: usuario.id,
        objetivo,
        condicoes,
        restricao_medica: restricao,
        lesoes: lesoes.trim(),
        medicamentos: medicamentos.trim(),
        consentimento: true,
        consentimento_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'aluno_id' }
    );
    setSalvando(false);

    if (error) {
      console.log('Erro ao salvar anamnese', error);
      avisar('Erro', 'Não foi possível salvar. Tente de novo.');
      return;
    }

    aoConcluir();
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>Sua ficha de saúde</Text>
      <Text style={styles.intro}>
        Seu professor usa estas respostas para montar um treino seguro para você. Leva 1 minuto.
      </Text>

      <Text style={styles.pergunta}>Qual o seu objetivo?</Text>
      <View style={styles.linha}>
        {OBJETIVOS.map((item) => (
          <Opcao
            key={item}
            texto={item}
            ativo={objetivo === item}
            aoPressionar={() => setObjetivo(item)}
          />
        ))}
      </View>

      <Text style={styles.pergunta}>Você tem alguma destas condições?</Text>
      <View style={styles.linha}>
        {CONDICOES.map((item) => (
          <Opcao
            key={item}
            texto={item}
            ativo={condicoes.includes(item)}
            aoPressionar={() => alternarCondicao(item)}
          />
        ))}
        <Opcao texto="Nenhuma" ativo={semCondicao} aoPressionar={escolherNenhuma} />
      </View>

      <Text style={styles.pergunta}>Algum médico já restringiu ou limitou exercícios para você?</Text>
      <View style={styles.linha}>
        <Opcao texto="Sim" ativo={restricao === true} aoPressionar={() => setRestricao(true)} />
        <Opcao texto="Não" ativo={restricao === false} aoPressionar={() => setRestricao(false)} />
      </View>

      <Text style={styles.pergunta}>Lesões ou dores atuais (opcional)</Text>
      <TextInput
        style={styles.campo}
        value={lesoes}
        onChangeText={setLesoes}
        placeholder="Ex: dor no ombro direito, joelho operado"
        placeholderTextColor={CORES.textoSecundario}
        multiline
        maxLength={300}
      />

      <Text style={styles.pergunta}>Medicamentos de uso contínuo (opcional)</Text>
      <TextInput
        style={styles.campo}
        value={medicamentos}
        onChangeText={setMedicamentos}
        placeholder="Ex: losartana, insulina"
        placeholderTextColor={CORES.textoSecundario}
        multiline
        maxLength={300}
      />

      <Pressable style={styles.consentimento} onPress={() => setConsentimento(!consentimento)}>
        <View style={[styles.caixa, consentimento && styles.caixaAtiva]}>
          {consentimento && <Text style={styles.marca}>✓</Text>}
        </View>
        <Text style={styles.consentimentoTexto}>
          Autorizo a academia e meu professor a usarem estes dados de saúde para montar e
          acompanhar meu treino. Posso pedir a exclusão a qualquer momento.
        </Text>
      </Pressable>

      <Pressable
        style={[styles.botao, salvando && styles.desabilitado]}
        onPress={salvar}
        disabled={salvando}
      >
        <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Salvar e continuar'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  conteudo: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 48,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  intro: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginTop: 6,
    marginBottom: 8,
  },
  pergunta: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.texto,
    marginTop: 20,
    marginBottom: 10,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  opcao: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  opcaoAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  opcaoTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  opcaoTextoAtivo: {
    color: CORES.textoSobreDestaque,
  },
  campo: {
    minHeight: 64,
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CORES.texto,
    textAlignVertical: 'top',
  },
  consentimento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
  },
  caixa: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.cartao,
  },
  caixaAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  marca: {
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  consentimentoTexto: {
    flex: 1,
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  botao: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: CORES.destaque,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  desabilitado: {
    opacity: 0.6,
  },
});