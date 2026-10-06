import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaEsqueciSenha from './src/screens/TelaEsqueciSenha';
import TelaHistorico from './src/screens/TelaHistorico';
import TelaLogin from './src/screens/TelaLogin';
import TelaTreino from './src/screens/TelaTreino';
import { CORES } from './src/utils/tema';
import {
  carregarHistorico,
  carregarUsuarioLogado,
  carregarUsuarios,
  salvarHistorico,
  salvarUsuarioLogado,
  salvarUsuarios,
} from './src/utils/armazenamento';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [tela, setTela] = useState('login');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const [usuariosSalvos, usuarioSalvo, historicoSalvo] = await Promise.all([
        carregarUsuarios(),
        carregarUsuarioLogado(),
        carregarHistorico(),
      ]);

      setUsuarios(usuariosSalvos);
      setHistorico(historicoSalvo);

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

  function salvarTreinoConcluido(exerciciosConcluidos) {
    const novoRegistro = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      exercicios: exerciciosConcluidos,
    };
    const novoHistorico = [novoRegistro, ...historico];
    setHistorico(novoHistorico);
    salvarHistorico(novoHistorico);
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

  if (tela === 'treino') {
    return (
      <TelaTreino
        usuario={usuarioLogado}
        aoSair={sair}
        aoSalvarTreino={salvarTreinoConcluido}
        aoVerHistorico={() => setTela('historico')}
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