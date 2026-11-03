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
import { avisar } from './src/utils/avisar';
import { supabase } from './src/utils/supabase';
import { CORES } from './src/utils/tema';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('login');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);

  const userId = session?.user?.id ?? null;

  const user = session && {
    id: session.user.id,
    email: session.user.email,
    nome: session.user.user_metadata?.nome || session.user.email,
  };

  // Keeps track of the login: loads the saved session and listens for sign in/out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // When someone signs in or out, loads (or clears) their profile and data.
  useEffect(() => {
    if (!userId) {
      setScreen('login');
      setProfile(null);
      setHistory([]);
      setMeasurements([]);
      setShowTutorial(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      const { data, error } = await supabase
        .from('perfis')
        .select('nome, tipo, tutorial_visto')
        .eq('id', userId)
        .single();

      if (cancelled) return;
      if (error) console.log('Error loading profile', error);

      // If it fails, falls back to a student (most restricted) with no tutorial.
      const loadedProfile = data || { nome: null, tipo: 'aluno', tutorial_visto: true };
      const isStudent = loadedProfile.tipo === 'aluno';

      // Students who haven't filled the health form start with it.
      if (isStudent) {
        const { data: form, error: formError } = await supabase
          .from('anamneses')
          .select('consentimento')
          .eq('aluno_id', userId)
          .maybeSingle();

        if (cancelled) return;
        setScreen(!formError && !form?.consentimento ? 'anamnesis' : 'workout');
      }

      setShowTutorial(!loadedProfile.tutorial_visto);
      setProfile(loadedProfile);

      if (!isStudent) return;

      const [historyResult, measurementsResult] = await Promise.all([
        supabase.from('historico').select('dados').order('criado_em', { ascending: false }),
        supabase.from('medidas').select('dados').order('criado_em', { ascending: false }),
      ]);

      if (cancelled) return;
      setHistory((historyResult.data || []).map((row) => row.dados));
      setMeasurements((measurementsResult.data || []).map((row) => row.dados));
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function signOut() {
    supabase.auth.signOut();
  }

  // Closes the tutorial and saves that it was seen.
  async function finishTutorial() {
    setShowTutorial(false);
    setProfile((current) => ({ ...current, tutorial_visto: true }));
    await supabase.from('perfis').update({ tutorial_visto: true }).eq('id', userId);
  }

  // Inserts a row in the cloud and warns the user if it fails.
  async function saveToCloud(table, row, what) {
    const { error } = await supabase.from(table).insert({ dados: row });
    if (error) {
      console.log(`Error saving ${what}`, error);
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

    const { error } = await supabase.from('medidas').delete().eq('dados->>id', String(id));
    if (error) avisar('Erro ao remover', 'Não foi possível remover a medida na nuvem.');
  }

  // Wraps a screen in the transition animation.
  function show(name, content, from) {
    return (
      <Transicao key={name} de={from}>
        {content}
      </Transicao>
    );
  }

  // Waits for the login and profile before showing anything.
  if (loading || (session && !profile)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  // Logged out: only login, sign up and forgot password.
  if (!session) {
    const goToLogin = () => setScreen('login');

    if (screen === 'signup') {
      return show('signup', <SignUpScreen onGoToLogin={goToLogin} />, 'direita');
    }
    if (screen === 'forgot') {
      return show('forgot', <ForgotPasswordScreen onGoToLogin={goToLogin} />, 'direita');
    }
    return show(
      'login',
      <LoginScreen
        onGoToSignUp={() => setScreen('signup')}
        onGoToForgotPassword={() => setScreen('forgot')}
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