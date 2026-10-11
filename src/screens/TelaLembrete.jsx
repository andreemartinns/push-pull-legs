import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { avisar } from '../utils/avisar';
import { CORES } from '../utils/tema';

const CHAVE = 'lembrete_treino';
const NA_WEB = Platform.OS === 'web';

// No Android, o Expo Go não suporta o módulo de notificações (desde o SDK 53).
const NO_EXPO_GO = Constants.appOwnership === 'expo';
const SEM_SUPORTE = NA_WEB || (Platform.OS === 'android' && NO_EXPO_GO);

// Só carrega o módulo quando existe suporte, para o app não quebrar.
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

// weekday: 1 = domingo ... 7 = sábado
const DIAS = [
  { letra: 'D', weekday: 1 },
  { letra: 'S', weekday: 2 },
  { letra: 'T', weekday: 3 },
  { letra: 'Q', weekday: 4 },
  { letra: 'Q', weekday: 5 },
  { letra: 'S', weekday: 6 },
  { letra: 'S', weekday: 7 },
];

function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

export default function TelaLembrete({ aoVoltar }) {
  const [hora, setHora] = useState(18);
  const [minuto, setMinuto] = useState(0);
  const [dias, setDias] = useState([2, 4, 6]);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then((texto) => {
      if (!texto) return;
      const salvo = JSON.parse(texto);
      setHora(salvo.hora);
      setMinuto(salvo.minuto);
      setDias(salvo.dias);
      setAtivo(salvo.ativo);
    });
  }, []);

  function alternarDia(weekday) {
    setDias((atual) =>
      atual.includes(weekday) ? atual.filter((d) => d !== weekday) : [...atual, weekday]
    );
  }

  function mudarHora(delta) {
    setHora((h) => (h + delta + 24) % 24);
  }

  function mudarMinuto(delta) {
    setMinuto((m) => (m + delta + 60) % 60);
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

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const weekday of dias) {
        await Notifications.scheduleNotificationAsync({
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

      await AsyncStorage.setItem(CHAVE, JSON.stringify({ hora, minuto, dias, ativo: true }));
      setAtivo(true);
      avisar('Lembrete ativado', `Nos dias marcados, às ${doisDigitos(hora)}:${doisDigitos(minuto)}.`);
    } catch (erro) {
      console.log('Erro ao agendar lembrete', erro);
      avisar('Erro', 'Não foi possível ativar o lembrete.');
    }
  }

  async function desativar() {
    const Notifications = pegarNotificacoes();
    try {
      if (Notifications) await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (erro) {
      console.log('Erro ao desativar lembrete', erro);
    }
    await AsyncStorage.setItem(CHAVE, JSON.stringify({ hora, minuto, dias, ativo: false }));
    setAtivo(false);
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={aoVoltar} hitSlop={10} style={styles.voltar}>
        <Text style={styles.textoVoltar}>← Voltar</Text>
      </Pressable>

      <View style={styles.titulo}>
        <View style={styles.barraTitulo} />
        <View>
          <Text style={styles.rotulo}>Treino</Text>
          <Text style={styles.nome}>Lembrete</Text>
        </View>
      </View>

      <Text style={styles.secao}>Horário</Text>
      <View style={styles.horario}>
        <View style={styles.coluna}>
          <Pressable style={styles.passo} onPress={() => mudarHora(1)}>
            <Text style={styles.textoPasso}>+</Text>
          </Pressable>
          <Text style={styles.numero}>{doisDigitos(hora)}</Text>
          <Pressable style={styles.passo} onPress={() => mudarHora(-1)}>
            <Text style={styles.textoPasso}>−</Text>
          </Pressable>
        </View>

        <Text style={styles.doisPontos}>:</Text>

        <View style={styles.coluna}>
          <Pressable style={styles.passo} onPress={() => mudarMinuto(5)}>
            <Text style={styles.textoPasso}>+</Text>
          </Pressable>
          <Text style={styles.numero}>{doisDigitos(minuto)}</Text>
          <Pressable style={styles.passo} onPress={() => mudarMinuto(-5)}>
            <Text style={styles.textoPasso}>−</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.secao}>Dias</Text>
      <View style={styles.dias}>
        {DIAS.map((dia) => {
          const marcado = dias.includes(dia.weekday);
          return (
            <Pressable
              key={dia.weekday}
              onPress={() => alternarDia(dia.weekday)}
              style={[styles.dia, marcado && styles.diaAtivo]}
            >
              <Text style={[styles.textoDia, marcado && styles.textoDiaAtivo]}>{dia.letra}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.botao} onPress={agendar}>
        <Text style={styles.textoBotao}>{ativo ? 'Atualizar lembrete' : 'Ativar lembrete'}</Text>
      </Pressable>

      {ativo && (
        <Pressable style={styles.botaoSecundario} onPress={desativar}>
          <Text style={styles.textoSecundario}>Desativar</Text>
        </Pressable>
      )}

      {SEM_SUPORTE && (
        <Text style={styles.aviso}>
          Aqui só dá para ver a tela. O aviso funciona num development build ou no iPhone.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, paddingHorizontal: 20, paddingTop: 50 },
  voltar: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 16 },
  textoVoltar: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 28 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: CORES.destaque, marginRight: 10 },
  rotulo: { fontSize: 13, color: CORES.textoSecundario },
  nome: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  secao: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginBottom: 10,
  },
  horario: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  coluna: { alignItems: 'center' },
  passo: {
    width: 56,
    height: 40,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPasso: { fontSize: 20, fontWeight: 'bold', color: CORES.texto },
  numero: {
    fontSize: 48,
    lineHeight: 60,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  doisPontos: {
    fontSize: 40,
    fontWeight: '900',
    color: CORES.destaque,
    marginHorizontal: 12,
  },
  dias: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  dia: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaAtivo: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  textoDia: { fontSize: 15, fontWeight: 'bold', color: CORES.texto },
  textoDiaAtivo: { color: CORES.textoSobreDestaque },
  botao: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBotao: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoSecundario: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoSecundario: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  aviso: { fontSize: 12, color: CORES.textoSecundario, textAlign: 'center', marginTop: 16 },
});