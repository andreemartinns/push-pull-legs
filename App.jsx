import { useState } from 'react';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaEsqueciSenha from './src/screens/TelaEsqueciSenha';
import TelaLogin from './src/screens/TelaLogin';
import TelaTreino from './src/screens/TelaTreino';

export default function App() {
  const [tela, setTela] = useState('login');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  function cadastrar(novoUsuario) {
    setUsuarios([...usuarios, novoUsuario]);
  }

  function entrar(usuario) {
    setUsuarioLogado(usuario);
    setTela('treino');
  }

  function sair() {
    setUsuarioLogado(null);
    setTela('login');
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

  if (tela === 'treino') {
    return <TelaTreino usuario={usuarioLogado} aoSair={sair} />;
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