import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Transicao from './src/components/Transicao';
import Tutorial from './src/components/Tutorial';
import TelaAdmin from './src/screens/TelaAdmin';
import TelaAgua from './src/screens/TelaAgua';
import TelaAnamnese from './src/screens/TelaAnamnese';
import TelaAssistente from './src/screens/TelaAssistente';
import SignUpScreen from './src/screens/TelaCadastro';
import ForgotPasswordScreen from './src/screens/TelaEsqueciSenha';
import TelaHistorico from './src/screens/TelaHistorico';
import TelaLembrete from './src/screens/TelaLembrete';
import LoginScreen from './src/screens/TelaLogin';
import TelaMedidas from './src/screens/TelaMedidas';
import TelaProfessor from './src/screens/TelaProfessor';
import TelaTreino from './src/screens/TelaTreino';
import { api, carregarPerfil, sair } from './src/utils/api';
import { avisar } from './src/utils/avisar';
import { CORES } from './src/utils/tema';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('login');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);

  const user = profile && {
    id: profile.id,
    email: profile.email || null,
    nome: profile.nome || 'Aluno',
  };

  // Loads the data of a logged in person and opens the right screen.
  async function openSession(p) {
    const isStudent = p.tipo === 'aluno';
    let firstScreen = 'workout';

    if (isStudent) {
      try {
        const form = await api('GET', '/anamnese');
        if (!form?.consentimento) firstScreen = 'anamnesis';
      } catch (e) {
        console.log('Error loading anamnesis', e);
      }

      try {
        const [h, m] = await Promise.all([
          api('GET', '/historico'),
          api('GET', '/medidas'),
        ]);
        setHistory((h || []).map((row) => row.dados));
        setMeasurements((m || []).map((row) => row.dados));
      } catch (e) {
        console.log('Error loading history', e);
      }
    }

    setScreen(firstScreen);
    setShowTutorial(!p.tutorial_visto);
    setProfile(p);
  }

  // When the app opens: if there is a saved login, goes straight in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await carregarPerfil();
        if (p && !cancelled) await openSession(p);
      } catch (e) {
        console.log('Error starting', e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await sair();
    setProfile(null);
    setHistory([]);
    setMeasurements([]);
    setShowTutorial(false);
    setScreen('login');
  }

  // Closes the tutorial and saves that it was seen.
  async function finishTutorial() {
    setShowTutorial(false);
    setProfile((current) => ({ ...current, tutorial_visto: true }));
    try {
      await api('PUT', '/perfil', { tutorial_visto: true });
    } catch (e) {
      console.log('Error saving tutorial', e);
    }
  }

  // Inserts a row in the cloud and warns the user if it fails.
  async function saveToCloud(table, row, what) {
    try {
      await api('POST', '/' + table, { dados: row });
    } catch (e) {
      console.log(`Error saving ${what}`, e);
      avisar('Erro ao salvar', `Não foi possível salvar ${what} na nuvem.`);
    }
  }

  // The note is optional. Newest workouts come first.
  function saveWorkout(exercises, note = '') {
    const record = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      exercicios: exercises,
      anotacao: String(note || '').trim(),
    };
    setHistory((current) => [record, ...current]);
    saveToCloud('historico', record, 'o treino');
  }

  function saveMeasurement(record) {
    setMeasurements((current) => [record, ...current]);
    saveToCloud('medidas', record, 'a medida');
  }

  async function removeMeasurement(id) {
    setMeasurements((current) => current.filter((item) => item.id !== id));
    try {
      await api('DELETE', '/medidas/' + encodeURIComponent(String(id)));
    } catch (e) {
      avisar('Erro ao remover', 'Não foi possível remover a medida na nuvem.');
    }
  }

  // Wraps a screen in the transition animation.
  function show(name, content, from) {
    return (
      <Transicao key={name} de={from}>
        {content}
      </Transicao>
    );
  }

  // Waits for the saved login before showing anything.
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  // Logged out: only login, sign up and forgot password.
  if (!profile) {
    const goToLogin = () => setScreen('login');

    if (screen === 'signup') {
      return show(
        'signup',
        <SignUpScreen
          onGoToLogin={goToLogin}
          onSignUpSuccess={(p) => openSession(p)}
        />,
        'direita'
      );
    }
    if (screen === 'forgot') {
      return show('forgot', <ForgotPasswordScreen onGoToLogin={goToLogin} />, 'direita');
    }
    return show(
      'login',
      <LoginScreen
        onGoToSignUp={() => setScreen('signup')}
        onGoToForgotPassword={() => setScreen('forgot')}
        onLoginSuccess={(p) => openSession(p)}
      />
    );
  }

  if (showTutorial) {
    return show('tutorial', <Tutorial tipo={profile.tipo} aoConcluir={finishTutorial} />);
  }

  // Teacher and admin have their own screens.
  if (profile.tipo === 'professor') {
    return show('teacher', <TelaProfessor usuario={user} aoSair={signOut} />);
  }
  if (profile.tipo === 'admin') {
    return show('admin', <TelaAdmin usuario={user} aoSair={signOut} />);
  }

  // From here on: student screens.
  const goToWorkout = () => setScreen('workout');

  const studentScreens = {
    anamnesis: <TelaAnamnese usuario={user} aoConcluir={goToWorkout} />,
    history: <TelaHistorico historico={history} aoVoltar={goToWorkout} />,
    measurements: (
      <TelaMedidas
        medidas={measurements}
        aoSalvarMedida={saveMeasurement}
        aoRemoverMedida={removeMeasurement}
        aoVoltar={goToWorkout}
      />
    ),
    reminder: <TelaLembrete aoVoltar={goToWorkout} />,
    water: <TelaAgua usuario={user} medidas={measurements} aoVoltar={goToWorkout} />,
    assistant: <TelaAssistente aoVoltar={goToWorkout} />,
  };

  if (studentScreens[screen]) {
    const from = screen === 'anamnesis' ? undefined : 'direita';
    return show(screen, studentScreens[screen], from);
  }

  return show(
    'workout',
    <TelaTreino
      usuario={user}
      historico={history}
      aoSair={signOut}
      aoSalvarTreino={saveWorkout}
      aoVerHistorico={() => setScreen('history')}
      aoVerMedidas={() => setScreen('measurements')}
      aoVerLembrete={() => setScreen('reminder')}
      aoVerAgua={() => setScreen('water')}
      aoVerAssistente={() => setScreen('assistant')}
      aoReverTutorial={() => setShowTutorial(true)}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.fundo,
  },
});