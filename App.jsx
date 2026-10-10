import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaEsqueciSenha from './src/screens/TelaEsqueciSenha';
import TelaHistorico from './src/screens/TelaHistorico';
import TelaLogin from './src/screens/TelaLogin';
import TelaMedidas from './src/screens/TelaMedidas';
import TelaTreino from './src/screens/TelaTreino';
import { CORES } from './src/utils/tema';
import {
  carregarHistorico,
  carregarMedidas,
  carregarUsuarioLogado,
  carregarUsuarios,
  salvarHistorico,
  salvarMedidas,
  salvarUsuarioLogado,
  salvarUsuarios,
} from './src/utils/armazenamento';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [tela, setTela] = useState('login');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [medidas, setMedidas] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const [usuariosSalvos, usuarioSalvo, historicoSalvo, medidasSalvas] = await Promise.all([
        carregarUsuarios(),
        carregarUsuarioLogado(),
        carregarHistorico(),
        carregarMedidas(),
      ]);

      setUsuarios(usuariosSalvos);
      setHistorico(historicoSalvo);
      setMedidas(medidasSalvas);

      if (usuarioSalvo) {
        setUsuarioLogado(usuarioSalvo);
        setTela('treino');
      }

      setCarregando(false);
    }

    carregarDados();
  }, []);

  function cadastrar(novoUsuario) {
    const novaLista = [...usuarios, novoUsuario];
    setUsuarios(novaLista);
    salvarUsuarios(novaLista);
  }

  function entrar(usuario) {
    setUsuarioLogado(usuario);
    salvarUsuarioLogado(usuario);
    setTela('treino');
  }

  function sair() {
    setUsuarioLogado(null);
    salvarUsuarioLogado(null);
    setTela('login');
  }

  // A anotação é opcional: se não vier, o treino é salvo com o campo vazio.
  function salvarTreinoConcluido(exerciciosConcluidos, anotacao = '') {
    const novoRegistro = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      exercicios: exerciciosConcluidos,
      anotacao: String(anotacao || '').trim(),
    };
    const novoHistorico = [novoRegistro, ...historico];
    setHistorico(novoHistorico);
    salvarHistorico(novoHistorico);
  }

  // Medidas ficam da mais nova para a mais antiga, como o histórico.
  function salvarMedida(registro) {
    const novasMedidas = [registro, ...medidas];
    setMedidas(novasMedidas);
    salvarMedidas(novasMedidas);
  }

  function removerMedida(id) {
    const novasMedidas = medidas.filter((item) => item.id !== id);
    setMedidas(novasMedidas);
    salvarMedidas(novasMedidas);
  }

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  if (tela === 'cadastro') {
    return (
      <TelaCadastro
        usuarios={usuarios}
        aoCadastrar={cadastrar}
        aoIrParaLogin={() => setTela('login')}
      />
    );
  }

  if (tela === 'esqueci') {
    return <TelaEsqueciSenha aoIrParaLogin={() => setTela('login')} />;
  }

  if (tela === 'historico') {
    return <TelaHistorico historico={historico} aoVoltar={() => setTela('treino')} />;
  }

  if (tela === 'medidas') {
    return (
      <TelaMedidas
        medidas={medidas}
        aoSalvarMedida={salvarMedida}
        aoRemoverMedida={removerMedida}
        aoVoltar={() => setTela('treino')}
      />
    );
  }

  if (tela === 'treino') {
    return (
      <TelaTreino
        usuario={usuarioLogado}
        aoSair={sair}
        aoSalvarTreino={salvarTreinoConcluido}
        aoVerHistorico={() => setTela('historico')}
        aoVerMedidas={() => setTela('medidas')}
      />
    );
  }

  return (
    <TelaLogin
      usuarios={usuarios}
      aoEntrar={entrar}
      aoIrParaCadastro={() => setTela('cadastro')}
      aoIrParaEsqueci={() => setTela('esqueci')}
    />
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