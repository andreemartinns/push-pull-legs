import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../utils/api';
import { avisar } from '../utils/notify';
import { BotaoPrincipal, Campo, Pilula, Tela } from '../components/UI';
import { P } from '../utils/theme';

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
    try {
      await api('PUT', '/anamnese', {
        aluno_id: usuario.id,
        objetivo,
        condicoes,
        restricao_medica: restricao,
        lesoes: lesoes.trim(),
        medicamentos: medicamentos.trim(),
        consentimento: true,
        consentimento_em: new Date().toISOString(),
      });
    } catch (e) {
      setSalvando(false);
      console.log('Erro ao salvar anamnese', e);
      avisar('Erro', 'Não foi possível salvar. Tente de novo.');
      return;
    }
    setSalvando(false);

    aoConcluir();
  }

  return (
    <Tela>
      <Text style={styles.titulo}>Sua ficha de saúde</Text>
      <Text style={styles.intro}>
        Seu professor usa estas respostas para montar um treino seguro para você. Leva 1 minuto.
      </Text>

      <Text style={styles.pergunta}>Qual o seu objetivo?</Text>
      <View style={styles.linha}>
        {OBJETIVOS.map((item) => (
          <Pilula
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
          <Pilula
            key={item}
            texto={item}
            ativo={condicoes.includes(item)}
            aoPressionar={() => alternarCondicao(item)}
          />
        ))}
        <Pilula texto="Nenhuma" ativo={semCondicao} aoPressionar={escolherNenhuma} />
      </View>

      <Text style={styles.pergunta}>Algum médico já restringiu ou limitou exercícios para você?</Text>
      <View style={styles.linha}>
        <Pilula texto="Sim" ativo={restricao === true} aoPressionar={() => setRestricao(true)} />
        <Pilula texto="Não" ativo={restricao === false} aoPressionar={() => setRestricao(false)} />
      </View>

      <Text style={styles.pergunta}>Lesões ou dores atuais (opcional)</Text>
      <Campo
        valor={lesoes}
        aoMudar={setLesoes}
        placeholder="Ex: dor no ombro direito, joelho operado"
        multiline
        maxLength={300}
        capitalizar="sentences"
      />

      <Text style={styles.pergunta}>Medicamentos de uso contínuo (opcional)</Text>
      <Campo
        valor={medicamentos}
        aoMudar={setMedicamentos}
        placeholder="Ex: losartana, insulina"
        multiline
        maxLength={300}
        capitalizar="sentences"
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

      <View style={styles.espaco}>
        <BotaoPrincipal titulo="Salvar e continuar" aoPressionar={salvar} carregando={salvando} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, color: P.texto },
  intro: { fontSize: 14, lineHeight: 20, color: P.textoSecundario, marginTop: 8, marginBottom: 8 },
  pergunta: { fontSize: 18, fontWeight: '700', color: P.texto, marginTop: 24, marginBottom: 12 },
  linha: { flexDirection: 'row', flexWrap: 'wrap' },
  consentimento: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  caixa: {
    width: 26,
    height: 26,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cartao,
  },
  caixaAtiva: { backgroundColor: P.verde },
  marca: { fontWeight: '800', color: P.limao },
  consentimentoTexto: { flex: 1, fontSize: 13, lineHeight: 19, color: P.textoSecundario },
  espaco: { marginTop: 24 },
});