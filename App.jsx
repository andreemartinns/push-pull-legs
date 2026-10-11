import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Transicao from './src/components/Transicao';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaEsqueciSenha from './src/screens/TelaEsqueciSenha';
import TelaHistorico from './src/screens/TelaHistorico';
import TelaLembrete from './src/screens/TelaLembrete'; // MUDOU: import novo
import TelaLogin from './src/screens/TelaLogin';
import TelaMedidas from './src/screens/TelaMedidas';
import TelaTreino from './src/screens/TelaTreino';
import { avisar } from './src/utils/avisar';
import { supabase } from './src/utils/supabase';
import { CORES } from './src/utils/tema';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [tela, setTela] = useState('login');
  const [sessao, setSessao] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [medidas, setMedidas] = useState([]);

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

  // Quando entra ou sai alguém, troca a tela e carrega os dados do aluno.
  useEffect(() => {
    if (!usuarioId) {
      setTela('login');
      setHistorico([]);
      setMedidas([]);
      return;
    }

    setTela('treino');

    async function carregarDados() {
      const [respHistorico, respMedidas] = await Promise.all([
        supabase.from('historico').select('dados').order('criado_em', { ascending: false }),
        supabase.from('medidas').select('dados').order('criado_em', { ascending: false }),
      ]);

      if (respHistorico.error) console.log('Erro ao carregar histórico', respHistorico.error);
      if (respMedidas.error) console.log('Erro ao carregar medidas', respMedidas.error);

      setHistorico((respHistorico.data || []).map((linha) => linha.dados));
      setMedidas((respMedidas.data || []).map((linha) => linha.dados));
    }

    carregarDados();
  }, [usuarioId]);

  async function sair() {
    await supabase.auth.signOut();
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

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  // Sem sessão, só pode aparecer login, cadastro ou esqueci a senha.
  // A "key" faz a transição rodar de novo a cada troca de tela.
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

  // Com sessão, as telas do aluno.
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

  // MUDOU: tela nova do lembrete
  if (tela === 'lembrete') {
    return (
      <Transicao key="lembrete" de="direita">
        <TelaLembrete aoVoltar={() => setTela('treino')} />
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
        aoVerLembrete={() => setTela('lembrete')} // MUDOU: botão novo
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