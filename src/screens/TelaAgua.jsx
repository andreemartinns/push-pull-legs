import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

const NA_WEB = Platform.OS === 'web';
const NO_EXPO_GO = Constants.appOwnership === 'expo';
const SEM_SUPORTE = NA_WEB || (Platform.OS === 'android' && NO_EXPO_GO);

const HORA_INICIO = 8;
const HORA_FIM = 20;
const INTERVALOS = [1, 2, 3];
const COPO_ML = 200;

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

function horasDosLembretes(intervalo) {
  const horas = [];
  for (let h = HORA_INICIO; h <= HORA_FIM; h += intervalo) horas.push(h);
  return horas;
}

// Cancela só os lembretes de água (ids "agua-6" até "agua-22"), sem mexer nos de treino.
async function cancelarLembretesAgua(Notifications) {
  if (!Notifications) return;
  for (let h = 6; h <= 22; h++) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`agua-${h}`);
    } catch (erro) {
      // ignora: o lembrete pode não existir
    }
  }
}

function arredondar50(ml) {
  return Math.round(ml / 50) * 50;
}

// Condição em que o líquido pode ser restrito: não impomos meta automática.
function ehSensivel(ficha) {
  if (!ficha) return false;
  const condicoes = Array.isArray(ficha.condicoes) ? ficha.condicoes : [];
  const mexeComLiquido = condicoes.some((c) => /card|press|renal|rim|rins/i.test(String(c)));
  return mexeComLiquido || ficha.restricao_medica === true;
}

export default function TelaAgua({ usuario, medidas = [], aoVoltar }) {
  const [carregando, setCarregando] = useState(true);
  const [config, setConfig] = useState({ modo: 'automatico', meta_ml: null });
  const [ficha, setFicha] = useState(null);
  const [consumido, setConsumido] = useState(0);
  const [lembreteAtivo, setLembreteAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState(2);

  const chaveConsumo = `agua_consumo_${usuario.id}`;
  const chaveLembrete = `agua_lembrete_${usuario.id}`;

  const peso = medidas
    .map((m) => Number(m?.valores?.peso))
    .find((p) => Number.isFinite(p) && p > 0);

  const sensivel = ehSensivel(ficha);

  // Decide a meta que o aluno vê (ou null se não deve ver meta).
  let meta = null;
  let origem = '';
  if (config.modo === 'manual' && config.meta_ml) {
    meta = config.meta_ml;
    origem = 'definida pelo seu professor';
  } else if (config.modo === 'automatico' && !sensivel && peso) {
    meta = arredondar50(peso * 35);
    origem = `estimativa de 35 ml por kg (seu peso: ${peso} kg)`;
  }
  const desligado = config.modo === 'desligado';

  const carregar = useCallback(async () => {
    const [respConfig, respFicha, textoConsumo, textoLembrete] = await Promise.all([
      supabase.from('agua_config').select('modo, meta_ml').eq('aluno_id', usuario.id).maybeSingle(),
      supabase
        .from('anamneses')
        .select('condicoes, restricao_medica')
        .eq('aluno_id', usuario.id)
        .maybeSingle(),
      AsyncStorage.getItem(chaveConsumo),
      AsyncStorage.getItem(chaveLembrete),
    ]);

    if (respConfig.error) console.log('Erro ao carregar config de água', respConfig.error);
    if (respFicha.error) console.log('Erro ao carregar ficha', respFicha.error);

    if (respConfig.data) setConfig(respConfig.data);
    setFicha(respFicha.data || null);

    const hoje = new Date().toLocaleDateString('pt-BR');
    if (textoConsumo) {
      const salvo = JSON.parse(textoConsumo);
      setConsumido(salvo.data === hoje ? salvo.ml : 0);
    }
    if (textoLembrete) {
      const salvo = JSON.parse(textoLembrete);
      setLembreteAtivo(!!salvo.ativo);
      setIntervalo(salvo.intervalo || 2);
    }
    setCarregando(false);
  }, [usuario.id, chaveConsumo, chaveLembrete]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Se o professor desligou (ou não há meta), garante que nenhum lembrete fique agendado.
  useEffect(() => {
    if (carregando) return;
    if (desligado || meta === null) {
      cancelarLembretesAgua(pegarNotificacoes());
    }
  }, [carregando, desligado, meta]);

  async function registrar(ml) {
    const novo = Math.max(0, consumido + ml);
    setConsumido(novo);
    await AsyncStorage.setItem(
      chaveConsumo,
      JSON.stringify({ data: new Date().toLocaleDateString('pt-BR'), ml: novo })
    );
  }

  async function salvarPreferencia(ativo, novoIntervalo) {
    await AsyncStorage.setItem(
      chaveLembrete,
      JSON.stringify({ ativo, intervalo: novoIntervalo })
    );
  }

  async function ativarLembretes(novoIntervalo = intervalo) {
    if (meta === null) return;
    const Notifications = pegarNotificacoes();

    if (!Notifications) {
      avisar(
        'Indisponível aqui',
        'Notificação só funciona no celular (development build ou iPhone). No navegador, use o botão "Simular lembrete".'
      );
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
        await Notifications.setNotificationChannelAsync('agua', {
          name: 'Lembrete de água',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      await cancelarLembretesAgua(Notifications);

      const horas = horasDosLembretes(novoIntervalo);
      const porLembrete = Math.max(50, arredondar50(meta / horas.length));

      for (const hora of horas) {
        await Notifications.scheduleNotificationAsync({
          identifier: `agua-${hora}`,
          content: {
            title: 'Hora de beber água 💧',
            body: `Um copo agora: cerca de ${porLembrete} ml.`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hora,
            minute: 0,
            channelId: 'agua',
          },
        });
      }

      setLembreteAtivo(true);
      await salvarPreferencia(true, novoIntervalo);
      avisar('Lembretes ativados', `A cada ${novoIntervalo}h, das ${HORA_INICIO}h às ${HORA_FIM}h.`);
    } catch (erro) {
      console.log('Erro ao agendar lembretes de água', erro);
      avisar('Erro', 'Não foi possível ativar os lembretes.');
    }
  }

  async function desativarLembretes() {
    await cancelarLembretesAgua(pegarNotificacoes());
    setLembreteAtivo(false);
    await salvarPreferencia(false, intervalo);
  }

  async function escolherIntervalo(valor) {
    setIntervalo(valor);
    if (lembreteAtivo) {
      await ativarLembretes(valor);
    } else {
      await salvarPreferencia(false, valor);
    }
  }

  function simular() {
    const horas = horasDosLembretes(intervalo);
    const porLembrete = meta ? Math.max(50, arredondar50(meta / horas.length)) : COPO_ML;
    avisar('Hora de beber água 💧', `Um copo agora: cerca de ${porLembrete} ml.`);
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  const percentual = meta ? Math.min(100, Math.round((consumido / meta) * 100)) : 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={aoVoltar} hitSlop={10} style={styles.voltar}>
        <Text style={styles.textoVoltar}>← Voltar</Text>
      </Pressable>

      <View style={styles.titulo}>
        <View style={styles.barraTitulo} />
        <View>
          <Text style={styles.rotulo}>Hidratação</Text>
          <Text style={styles.nome}>Água</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        {desligado && (
          <View style={styles.cartao}>
            <Text style={styles.textoCartao}>
              Seu professor desativou a meta de água para você. Em caso de dúvida, fale com ele.
            </Text>
          </View>
        )}

        {!desligado && meta === null && sensivel && config.modo === 'automatico' && (
          <View style={[styles.cartao, styles.cartaoAlerta]}>
            <Text style={styles.textoAlerta}>
              Pela sua ficha de saúde, não sugerimos uma meta automática. Algumas condições exigem
              controle de líquidos. Converse com seu professor ou médico sobre quanto beber.
            </Text>
          </View>
        )}

        {!desligado && meta === null && !sensivel && !peso && (
          <View style={styles.cartao}>
            <Text style={styles.textoCartao}>
              Para sugerir uma meta, registre seu peso em Medidas.
            </Text>
          </View>
        )}

        {meta !== null && (
          <>
            <View style={styles.cartao}>
              <Text style={styles.rotuloCartao}>Meta de hoje</Text>
              <Text style={styles.valorGrande}>
                {consumido} <Text style={styles.valorMeta}>/ {meta} ml</Text>
              </Text>

              <View style={styles.trilho}>
                <View style={[styles.preenchido, { width: `${percentual}%` }]} />
              </View>
              <Text style={styles.pequeno}>{percentual}% da meta</Text>

              <View style={styles.linhaBotoes}>
                <Pressable
                  style={[styles.botao, styles.botaoEspaco]}
                  onPress={() => registrar(COPO_ML)}
                >
                  <Text style={styles.textoBotao}>+ {COPO_ML} ml</Text>
                </Pressable>
                <Pressable style={styles.botaoSecundario} onPress={() => registrar(-COPO_ML)}>
                  <Text style={styles.textoSecundario}>Desfazer</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.aviso}>
              Meta {origem}. É só uma estimativa e não substitui orientação profissional. Se sentir
              qualquer mal-estar, pare e procure seu professor ou médico.
            </Text>

            <Text style={styles.secao}>Lembretes</Text>
            <View style={styles.cartao}>
              <Text style={styles.rotuloCartao}>
                De {HORA_INICIO}h às {HORA_FIM}h, a cada:
              </Text>
              <View style={styles.linhaBotoes}>
                {INTERVALOS.map((valor) => {
                  const ativo = intervalo === valor;
                  return (
                    <Pressable
                      key={valor}
                      onPress={() => escolherIntervalo(valor)}
                      style={[styles.opcao, ativo && styles.opcaoAtiva]}
                    >
                      <Text style={[styles.textoOpcao, ativo && styles.textoOpcaoAtiva]}>
                        {valor}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {lembreteAtivo ? (
                <Pressable style={styles.botaoSecundarioCheio} onPress={desativarLembretes}>
                  <Text style={styles.textoSecundario}>Desativar lembretes</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.botaoCheio} onPress={() => ativarLembretes()}>
                  <Text style={styles.textoBotao}>Ativar lembretes</Text>
                </Pressable>
              )}

              {SEM_SUPORTE && (
                <>
                  <Pressable style={styles.botaoSecundarioCheio} onPress={simular}>
                    <Text style={styles.textoSecundario}>Simular lembrete</Text>
                  </Pressable>
                  <Text style={styles.aviso}>
                    No navegador a notificação real não funciona. Ela aparece no celular
                    (development build ou iPhone).
                  </Text>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.fundo,
  },
  container: { flex: 1, backgroundColor: CORES.fundo, paddingHorizontal: 20, paddingTop: 50 },
  voltar: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 16 },
  textoVoltar: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 20 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: CORES.destaque, marginRight: 10 },
  rotulo: { fontSize: 13, color: CORES.textoSecundario },
  nome: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  conteudo: { paddingBottom: 40 },
  secao: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginTop: 8,
    marginBottom: 10,
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cartaoAlerta: { borderColor: '#FF6B6B' },
  textoCartao: { fontSize: 14, color: CORES.texto },
  textoAlerta: { fontSize: 14, fontWeight: 'bold', color: '#FF6B6B' },
  rotuloCartao: { fontSize: 13, color: CORES.textoSecundario },
  valorGrande: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
    marginTop: 4,
  },
  valorMeta: { fontSize: 18, color: CORES.textoSecundario },
  trilho: {
    height: 10,
    borderRadius: 5,
    backgroundColor: CORES.borda,
    marginTop: 10,
    overflow: 'hidden',
  },
  preenchido: { height: 10, backgroundColor: CORES.destaque },
  pequeno: { fontSize: 12, color: CORES.textoSecundario, marginTop: 6 },
  linhaBotoes: { flexDirection: 'row', marginTop: 14 },
  botao: {
    flex: 1,
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoEspaco: { marginRight: 8 },
  botaoCheio: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  textoBotao: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoSecundarioCheio: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoSecundario: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  opcao: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  opcaoAtiva: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  textoOpcao: { fontSize: 15, fontWeight: 'bold', color: CORES.texto },
  textoOpcaoAtiva: { color: CORES.textoSobreDestaque },
  aviso: {
    fontSize: 12,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
});