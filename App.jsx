import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Transicao from './src/components/Transicao';
import Tutorial from './src/components/Tutorial';
import TelaAdmin from './src/screens/TelaAdmin';
import TelaAgua from './src/screens/TelaAgua';
import TelaAnamnese from './src/screens/TelaAnamnese';
import TelaAssistente from './src/screens/TelaAssistente';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaEsqueciSenha from './src/screens/TelaEsqueciSenha';
import TelaHistorico from './src/screens/TelaHistorico';
import TelaLembrete from './src/screens/TelaLembrete';
import TelaLogin from './src/screens/TelaLogin';
import TelaMedidas from './src/screens/TelaMedidas';
import TelaProfessor from './src/screens/TelaProfessor';
import TelaTreino from './src/screens/TelaTreino';
import { avisar } from './src/utils/avisar';
import { supabase } from './src/utils/supabase';
import { CORES } from './src/utils/tema';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [tela, setTela] = useState('login');
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [medidas, setMedidas] = useState([]);
  const [tutorialAberto, setTutorialAberto] = useState(false);

  const usuarioId = sessao?.user?.id ?? null;

  const usuarioLogado = sessao
    ? {
        id: sessao.user.id,
        email: sessao.user.email,
        nome: sessao.user.user_metadata?.nome || sessao.user.email,
      }
    : null;

  // Acompanha o login: pega a sessão salva e escuta entradas e saídas.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // Quando entra ou sai alguém, carrega o perfil e, se for aluno, os dados dele.
  useEffect(() => {
    if (!usuarioId) {
      setTela('login');
      setPerfil(null);
      setHistorico([]);
      setMedidas([]);
      setTutorialAberto(false);
      return;
    }

    let cancelado = false;

    async function carregarTudo() {
      const { data: dadosPerfil, error } = await supabase
        .from('perfis')
        .select('nome, tipo, tutorial_visto')
        .eq('id', usuarioId)
        .single();

      if (cancelado) return;

      if (error) console.log('Erro ao carregar perfil', error);

      // Se falhar, cai para "aluno" (acesso mais restrito) e não mostra o tutorial.
      const perfilAtual = dadosPerfil || { nome: null, tipo: 'aluno', tutorial_visto: true };

      // Aluno que ainda não preencheu a ficha de saúde começa por ela.
      if (perfilAtual.tipo === 'aluno') {
        const { data: ficha, error: erroFicha } = await supabase
          .from('anamneses')
          .select('consentimento')
          .eq('aluno_id', usuarioId)
          .maybeSingle();

        if (cancelado) return;

        if (erroFicha) console.log('Erro ao verificar ficha de saúde', erroFicha);

        // Se der erro ao verificar, não trava o aluno: segue para o treino.
        setTela(!erroFicha && !ficha?.consentimento ? 'anamnese' : 'treino');
      }

      // Primeiro acesso: mostra o tutorial antes de tudo.
      setTutorialAberto(!perfilAtual.tutorial_visto);
      setPerfil(perfilAtual);

      if (perfilAtual.tipo !== 'aluno') return;

      const [respHistorico, respMedidas] = await Promise.all([
        supabase.from('historico').select('dados').order('criado_em', { ascending: false }),
        supabase.from('medidas').select('dados').order('criado_em', { ascending: false }),
      ]);

      if (cancelado) return;

      if (respHistorico.error) console.log('Erro ao carregar histórico', respHistorico.error);
      if (respMedidas.error) console.log('Erro ao carregar medidas', respMedidas.error);

      setHistorico((respHistorico.data || []).map((linha) => linha.dados));
      setMedidas((respMedidas.data || []).map((linha) => linha.dados));
    }

    carregarTudo();

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  async function sair() {
    await supabase.auth.signOut();
  }

  // Fecha o tutorial e marca como visto, para não aparecer de novo.
  async function concluirTutorial() {
    setTutorialAberto(false);
    setPerfil((atual) => (atual ? { ...atual, tutorial_visto: true } : atual));

    const { error } = await supabase
      .from('perfis')
      .update({ tutorial_visto: true })
      .eq('id', usuarioId);

    if (error) console.log('Erro ao salvar tutorial visto', error);
  }

  // A anotação é opcional: se não vier, o treino é salvo com o campo vazio.
  async function salvarTreinoConcluido(exerciciosConcluidos, anotacao = '') {
    const novoRegistro = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      exercicios: exerciciosConcluidos,
      anotacao: String(anotacao || '').trim(),
    };
    setHistorico((atual) => [novoRegistro, ...atual]);

    const { error } = await supabase.from('historico').insert({ dados: novoRegistro });
    if (error) {
      console.log('Erro ao salvar treino', error);
      avisar('Erro ao salvar', 'Não foi possível salvar o treino na nuvem.');
    }
  }

  // Medidas ficam da mais nova para a mais antiga, como o histórico.
  async function salvarMedida(registro) {
    setMedidas((atual) => [registro, ...atual]);

    const { error } = await supabase.from('medidas').insert({ dados: registro });
    if (error) {
      console.log('Erro ao salvar medida', error);
      avisar('Erro ao salvar', 'Não foi possível salvar a medida na nuvem.');
    }
  }

  async function removerMedida(id) {
    setMedidas((atual) => atual.filter((item) => item.id !== id));

    const { error } = await supabase.from('medidas').delete().eq('dados->>id', String(id));
    if (error) {
      console.log('Erro ao remover medida', error);
      avisar('Erro ao remover', 'Não foi possível remover a medida na nuvem.');
    }
  }

  // Espera o login e o perfil chegarem antes de mostrar qualquer tela.
  if (carregando || (sessao && !perfil)) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  // Sem sessão, só pode aparecer login, cadastro ou esqueci a senha.
  if (!sessao) {
    if (tela === 'cadastro') {
      return (
        <Transicao key="cadastro" de="direita">
          <TelaCadastro aoIrParaLogin={() => setTela('login')} />
        </Transicao>
      );
    }
    if (tela === 'esqueci') {
      return (
        <Transicao key="esqueci" de="direita">
          <TelaEsqueciSenha aoIrParaLogin={() => setTela('login')} />
        </Transicao>
      );
    }
    return (
      <Transicao key="login">
        <TelaLogin
          aoIrParaCadastro={() => setTela('cadastro')}
          aoIrParaEsqueci={() => setTela('esqueci')}
        />
      </Transicao>
    );
  }

  // Tutorial (primeiro acesso ou quando o aluno pede para rever).
  if (tutorialAberto) {
    return (
      <Transicao key="tutorial">
        <Tutorial tipo={perfil.tipo} aoConcluir={concluirTutorial} />
      </Transicao>
    );
  }

  // Professor e admin têm as próprias telas.
  if (perfil.tipo === 'professor') {
    return (
      <Transicao key="professor">
        <TelaProfessor usuario={usuarioLogado} aoSair={sair} />
      </Transicao>
    );
  }

  if (perfil.tipo === 'admin') {
    return (
      <Transicao key="admin">
        <TelaAdmin usuario={usuarioLogado} aoSair={sair} />
      </Transicao>
    );
  }

  // Daqui para baixo: telas do aluno.

  // Ficha de saúde no primeiro acesso.
  if (tela === 'anamnese') {
    return (
      <Transicao key="anamnese">
        <TelaAnamnese usuario={usuarioLogado} aoConcluir={() => setTela('treino')} />
      </Transicao>
    );
  }

  if (tela === 'historico') {
    return (
      <Transicao key="historico" de="direita">
        <TelaHistorico historico={historico} aoVoltar={() => setTela('treino')} />
      </Transicao>
    );
  }

  if (tela === 'medidas') {
    return (
      <Transicao key="medidas" de="direita">
        <TelaMedidas
          medidas={medidas}
          aoSalvarMedida={salvarMedida}
          aoRemoverMedida={removerMedida}
          aoVoltar={() => setTela('treino')}
        />
      </Transicao>
    );
  }

  if (tela === 'lembrete') {
    return (
      <Transicao key="lembrete" de="direita">
        <TelaLembrete aoVoltar={() => setTela('treino')} />
      </Transicao>
    );
  }

  if (tela === 'agua') {
    return (
      <Transicao key="agua" de="direita">
        <TelaAgua usuario={usuarioLogado} medidas={medidas} aoVoltar={() => setTela('treino')} />
      </Transicao>
    );
  }

  // Assistente de dúvidas (IA supervisionada).
  if (tela === 'assistente') {
    return (
      <Transicao key="assistente" de="direita">
        <TelaAssistente aoVoltar={() => setTela('treino')} />
      </Transicao>
    );
  }

  return (
    <Transicao key="treino">
      <TelaTreino
        usuario={usuarioLogado}
        historico={historico}
        aoSair={sair}
        aoSalvarTreino={salvarTreinoConcluido}
        aoVerHistorico={() => setTela('historico')}
        aoVerMedidas={() => setTela('medidas')}
        aoVerLembrete={() => setTela('lembrete')}
        aoVerAgua={() => setTela('agua')}
        aoVerAssistente={() => setTela('assistente')}
        aoReverTutorial={() => setTutorialAberto(true)}
      />
    </Transicao>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.fundo,
  },
});