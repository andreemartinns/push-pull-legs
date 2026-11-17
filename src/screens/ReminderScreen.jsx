import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BotaoPrincipal, Cabecalho, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { P } from '../utils/theme';

const CHAVE = 'lembrete_treino';
const NA_WEB = Platform.OS === 'web';
const NO_EXPO_GO = Constants.appOwnership === 'expo';
const SEM_SUPORTE = NA_WEB || (Platform.OS === 'android' && NO_EXPO_GO);

function pegarNotificacoes() {
  if (SEM_SUPORTE) return null;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  } catch (erro) {
    console.log('Notificações indisponíveis', erro);
    return null;
  }
}

async function cancelarLembretesTreino(Notifications) {
  if (!Notifications) return;
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of agendadas) {
    if (!String(item.identifier).startsWith('agua-')) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

// weekday: 1 = domingo ... 7 = sábado
const DIAS = [
  { letra: 'D', nome: 'Dom', weekday: 1 },
  { letra: 'S', nome: 'Seg', weekday: 2 },
  { letra: 'T', nome: 'Ter', weekday: 3 },
  { letra: 'Q', nome: 'Qua', weekday: 4 },
  { letra: 'Q', nome: 'Qui', weekday: 5 },
  { letra: 'S', nome: 'Sex', weekday: 6 },
  { letra: 'S', nome: 'Sáb', weekday: 7 },
];

const ATALHOS = [
  { nome: 'Todos', dias: [1, 2, 3, 4, 5, 6, 7] },
  { nome: 'Dias úteis', dias: [2, 3, 4, 5, 6] },
  { nome: 'Fim de semana', dias: [1, 7] },
];

function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

function resumoDias(dias) {
  if (dias.length === 0) return 'Nenhum dia marcado';
  if (dias.length === 7) return 'Todos os dias';
  const nomes = DIAS.filter((d) => dias.includes(d.weekday)).map((d) => d.nome);
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

function mesmosDias(a, b) {
  return a.length === b.length && a.every((d) => b.includes(d));
}

// Botão + / − : toque muda 1 passo, segurar repete.
function Passo({ texto, aoPassar }) {
  const timer = useRef(null);
  const parar = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => parar, []);
  return (
    <Pressable
      style={({ pressed }) => [styles.passo, pressed && styles.passoPressionado]}
      onPress={aoPassar}
      onLongPress={() => {
        parar();
        timer.current = setInterval(aoPassar, 110);
      }}
      onPressOut={parar}
    >
      <Text style={styles.textoPasso}>{texto}</Text>
    </Pressable>
  );
}

export default function TelaLembrete({ aoVoltar }) {
  const [hora, setHora] = useState(18);
  const [minuto, setMinuto] = useState(0);
  const [dias, setDias] = useState([2, 4, 6]);
  const [ativo, setAtivo] = useState(false);
  const [salvo, setSalvo] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then((texto) => {
      if (!texto) return;
      const s = JSON.parse(texto);
      setHora(s.hora);
      setMinuto(s.minuto);
      setDias(s.dias);
      setAtivo(s.ativo);
      setSalvo(s);
    });
  }, []);

  const alterado =
    ativo &&
    salvo &&
    (salvo.hora !== hora || salvo.minuto !== minuto || !mesmosDias(salvo.dias, dias));

  function alternarDia(weekday) {
    setDias((atual) =>
      atual.includes(weekday) ? atual.filter((d) => d !== weekday) : [...atual, weekday]
    );
  }

  const mudarHora = (delta) => setHora((h) => (h + delta + 24) % 24);
  const mudarMinuto = (delta) => setMinuto((m) => (m + delta + 60) % 60);

  async function guardar(estado) {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(estado));
    setSalvo(estado);
  }

  async function agendar() {
    const Notifications = pegarNotificacoes();

    if (!Notifications) {
      avisar(
        'Indisponível aqui',
        'O lembrete não funciona no navegador nem no Expo Go do Android. Precisa de um development build.'
      );
      return;
    }
    if (dias.length === 0) {
      avisar('Escolha os dias', 'Marque pelo menos um dia da semana.');
      return;
    }

    try {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== 'granted') {
        avisar('Sem permissão', 'Ative as notificações nas configurações do celular.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('lembrete', {
          name: 'Lembrete de treino',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      await cancelarLembretesTreino(Notifications);

      for (const weekday of dias) {
        await Notifications.scheduleNotificationAsync({
          identifier: `treino-${weekday}`,
          content: { title: 'Ritmo Brasil', body: 'Hora de treinar! 💪' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: hora,
            minute: minuto,
            channelId: 'lembrete',
          },
        });
      }

      await guardar({ hora, minuto, dias, ativo: true });
      setAtivo(true);
      avisar('Lembrete ativado', `${resumoDias(dias)}, às ${doisDigitos(hora)}:${doisDigitos(minuto)}.`);
    } catch (erro) {
      console.log('Erro ao agendar lembrete', erro);
      avisar('Erro', 'Não foi possível ativar o lembrete.');
    }
  }

  async function desativar() {
    const Notifications = pegarNotificacoes();
    try {
      await cancelarLembretesTreino(Notifications);
    } catch (erro) {
      console.log('Erro ao desativar lembrete', erro);
    }
    await guardar({ hora, minuto, dias, ativo: false });
    setAtivo(false);
  }

  const horaTexto = `${doisDigitos(hora)}:${doisDigitos(minuto)}`;
  const semDias = dias.length === 0;

  return (
    <Tela>
      <Cabecalho titulo="Lembrete" subtitulo="Treino" aoVoltar={aoVoltar} />

      {ativo && (
        <View style={styles.selo}>
          <Text style={styles.textoSelo}>● ATIVO</Text>
        </View>
      )}

      <Text style={styles.secao}>Horário</Text>
      <View style={styles.horario}>
        <View style={styles.coluna}>
          <Passo texto="+" aoPassar={() => mudarHora(1)} />
          <Text style={styles.numero}>{doisDigitos(hora)}</Text>
          <Passo texto="−" aoPassar={() => mudarHora(-1)} />
        </View>

        <Text style={styles.doisPontos}>:</Text>

        <View style={styles.coluna}>
          <Passo texto="+" aoPassar={() => mudarMinuto(5)} />
          <Text style={styles.numero}>{doisDigitos(minuto)}</Text>
          <Passo texto="−" aoPassar={() => mudarMinuto(-5)} />
        </View>
      </View>
      <Text style={styles.dica}>Segure + ou − para mudar mais rápido</Text>

      <Text style={styles.secao}>Dias</Text>
      <View style={styles.atalhos}>
        {ATALHOS.map((a) => {
          const on = mesmosDias(a.dias, dias);
          return (
            <Pressable
              key={a.nome}
              onPress={() => setDias(a.dias)}
              style={[styles.atalho, on && styles.atalhoAtivo]}
            >
              <Text style={[styles.textoAtalho, on && styles.textoAtalhoAtivo]}>{a.nome}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dias}>
        {DIAS.map((dia) => {
          const marcado = dias.includes(dia.weekday);
          return (
            <Pressable
              key={dia.weekday}
              onPress={() => alternarDia(dia.weekday)}
              style={[styles.dia, marcado && styles.diaAtivo]}
              accessibilityLabel={dia.nome}
            >
              <Text style={[styles.textoDia, marcado && styles.textoDiaAtivo]}>{dia.letra}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.resumo, semDias && styles.resumoErro]}>
        {semDias ? resumoDias(dias) : `${resumoDias(dias)} · ${horaTexto}`}
      </Text>

      <BotaoPrincipal
        titulo={ativo ? (alterado ? 'Salvar alterações' : 'Atualizar lembrete') : 'Ativar lembrete'}
        aoPressionar={agendar}
        desabilitado={semDias}
      />

      {ativo && (
        <Pressable
          style={({ pressed }) => [styles.botaoSecundario, pressed && styles.pressionado]}
          onPress={desativar}
        >
          <Text style={styles.textoSecundario}>Desativar</Text>
        </Pressable>
      )}

      {SEM_SUPORTE && (
        <Text style={styles.aviso}>
          Aqui só dá para ver a tela. O aviso funciona num development build ou no iPhone.
        </Text>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  pressionado: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: P.verde,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: -8,
    marginBottom: 12,
  },
  textoSelo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: P.limao },
  secao: { fontSize: 18, fontWeight: '700', color: P.texto, marginTop: 12, marginBottom: 14 },
  horario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  coluna: { alignItems: 'center' },
  passo: {
    width: 76,
    height: 48,
    backgroundColor: P.cartao,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoPressionado: { backgroundColor: P.verde },
  textoPasso: { fontSize: 22, fontWeight: '700', color: P.texto },
  numero: {
    fontSize: 60,
    lineHeight: 72,
    fontWeight: '800',
    letterSpacing: -1,
    color: P.texto,
  },
  doisPontos: { fontSize: 44, fontWeight: '800', color: P.verde, marginHorizontal: 14 },
  dica: {
    fontSize: 12,
    color: P.textoSecundario,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  atalho: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  atalhoAtivo: { backgroundColor: P.verde },
  textoAtalho: { fontSize: 13, fontWeight: '700', color: P.textoSecundario },
  textoAtalhoAtivo: { color: P.textoSobreVerde },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaAtivo: { backgroundColor: P.verde },
  textoDia: { fontSize: 15, fontWeight: '700', color: P.textoSecundario },
  textoDiaAtivo: { color: P.limao },
  resumo: {
    fontSize: 14,
    fontWeight: '700',
    color: P.texto,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  resumoErro: { color: P.erro },
  botaoSecundario: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSecundario: { fontSize: 15, fontWeight: '700', color: P.texto },
  aviso: { fontSize: 12, color: P.textoSecundario, textAlign: 'center', marginTop: 16 },
});