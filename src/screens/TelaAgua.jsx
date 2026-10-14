import AsyncStorage from '@react-native-async-storage/async-storage';
import CopoAgua from '../components/CopoAgua';
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

const INTERVALOS = [1, 2, 3];
const QUANTIDADES = [100, 200, 300, 500];

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

function horasDosLembretes(inicio, fim, intervalo) {
  const horas = [];
  for (let h = inicio; h <= fim; h += intervalo) horas.push(h);
  return horas;
}

// Cancela só os lembretes de água (ids "agua-0" até "agua-23"), sem mexer nos de treino.
async function cancelarLembretesAgua(Notifications) {
  if (!Notifications) return;
  for (let h = 0; h <= 23; h++) {
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

function agora() {
  return new Date().toTimeString().slice(0, 5);
}

function ehSensivel(ficha) {
  if (!ficha) return false;
  const condicoes = Array.isArray(ficha.condicoes) ? ficha.condicoes : [];
  const mexeComLiquido = condicoes.some((c) => /card|press|renal|rim|rins/i.test(String(c)));
  return mexeComLiquido || ficha.restricao_medica === true;
}

function proximoLembrete(inicio, fim, intervalo) {
  const horas = horasDosLembretes(inicio, fim, intervalo);
  const h = new Date().getHours();
  const prox = horas.find((x) => x > h);
  return prox !== undefined ? `${prox}h` : `${horas[0]}h (amanhã)`;
}

function Mini({ rotulo, valor, aoMudar }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniRotulo}>{rotulo}</Text>
      <View style={styles.miniLinha}>
        <Pressable style={styles.miniBotao} onPress={() => aoMudar(-1)} hitSlop={6}>
          <Text style={styles.miniTexto}>−</Text>
        </Pressable>
        <Text style={styles.miniValor}>{valor}h</Text>
        <Pressable style={styles.miniBotao} onPress={() => aoMudar(1)} hitSlop={6}>
          <Text style={styles.miniTexto}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TelaAgua({ usuario, medidas = [], aoVoltar }) {
  const [carregando, setCarregando] = useState(true);
  const [config, setConfig] = useState({ modo: 'automatico', meta_ml: null });
  const [ficha, setFicha] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [quantidade, setQuantidade] = useState(200);
  const [lembreteAtivo, setLembreteAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState(2);
  const [inicio, setInicio] = useState(8);
  const [fim, setFim] = useState(20);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [pulso, setPulso] = useState(0);

  const chaveConsumo = `agua_consumo_${usuario.id}`;
  const chaveLembrete = `agua_lembrete_${usuario.id}`;

  const consumido = registros.reduce((soma, r) => soma + r.ml, 0);

  const peso = medidas
    .map((m) => Number(m?.valores?.peso))
    .find((p) => Number.isFinite(p) && p > 0);

  const sensivel = ehSensivel(ficha);

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
      if (salvo.data === hoje) {
        if (Array.isArray(salvo.registros)) setRegistros(salvo.registros);
        else if (salvo.ml > 0) setRegistros([{ ml: salvo.ml, h: '--:--' }]);
      }
    }
    if (textoLembrete) {
      const salvo = JSON.parse(textoLembrete);
      setLembreteAtivo(!!salvo.ativo);
      setIntervalo(salvo.intervalo || 2);
      setInicio(salvo.inicio ?? 8);
      setFim(salvo.fim ?? 20);
    }
    setCarregando(false);
  }, [usuario.id, chaveConsumo, chaveLembrete]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (carregando) return;
    if (desligado || meta === null) {
      cancelarLembretesAgua(pegarNotificacoes());
      if (lembreteAtivo) {
        setLembreteAtivo(false);
        salvarPreferencia({ ativo: false, intervalo, inicio, fim });
      }
    }
  }, [carregando, desligado, meta]);

  async function guardarRegistros(novos) {
    setRegistros(novos);
    await AsyncStorage.setItem(
      chaveConsumo,
      JSON.stringify({ data: new Date().toLocaleDateString('pt-BR'), registros: novos })
    );
  }

  const registrar = () => {
    setPulso((p) => p + 1);
    guardarRegistros([...registros, { ml: quantidade, h: agora() }]);
  };
  const desfazer = () => guardarRegistros(registros.slice(0, -1));
  const apagar = (idx) => guardarRegistros(registros.filter((_, i) => i !== idx));

  async function salvarPreferencia(pref) {
    await AsyncStorage.setItem(chaveLembrete, JSON.stringify(pref));
  }

  async function ativarLembretes(cfg = { intervalo, inicio, fim }) {
    if (meta === null) return;
    const Notifications = pegarNotificacoes();

    if (!Notifications) {
      avisar(
        'Indisponível aqui',
        'Notificação só funciona no celular (development build ou iPhone). No navegador, use "Simular lembrete".'
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

      const horas = horasDosLembretes(cfg.inicio, cfg.fim, cfg.intervalo);
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
      await salvarPreferencia({ ativo: true, ...cfg });
      avisar('Lembretes ativados', `A cada ${cfg.intervalo}h, das ${cfg.inicio}h às ${cfg.fim}h.`);
    } catch (erro) {
      console.log('Erro ao agendar lembretes de água', erro);
      avisar('Erro', 'Não foi possível ativar os lembretes.');
    }
  }

  async function desativarLembretes() {
    await cancelarLembretesAgua(pegarNotificacoes());
    setLembreteAtivo(false);
    await salvarPreferencia({ ativo: false, intervalo, inicio, fim });
  }

  async function mudarConfig(nova) {
    setIntervalo(nova.intervalo);
    setInicio(nova.inicio);
    setFim(nova.fim);
    if (lembreteAtivo) await ativarLembretes(nova);
    else await salvarPreferencia({ ativo: false, ...nova });
  }

  const mudarInicio = (d) => {
    const v = Math.min(fim - 1, Math.max(0, inicio + d));
    if (v !== inicio) mudarConfig({ intervalo, inicio: v, fim });
  };
  const mudarFim = (d) => {
    const v = Math.max(inicio + 1, Math.min(23, fim + d));
    if (v !== fim) mudarConfig({ intervalo, inicio, fim: v });
  };

  function simular() {
    const horas = horasDosLembretes(inicio, fim, intervalo);
    const porLembrete = meta ? Math.max(50, arredondar50(meta / horas.length)) : 200;
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
  const falta = meta ? Math.max(0, meta - consumido) : 0;
  const batida = meta !== null && consumido >= meta;

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
            <View style={[styles.cartao, batida && styles.cartaoBatida]}>
              <Text style={styles.rotuloCartao}>Meta de hoje</Text>

              <CopoAgua percentual={percentual} pulso={pulso} />
              <Text style={[styles.valorGrande, { textAlign: 'center' }]}>
                {consumido} <Text style={styles.valorMeta}>/ {meta} ml</Text>
              </Text>
              <Text style={[styles.pequeno, { textAlign: 'center' }, batida && styles.textoBatida]}>
                {batida ? ' Meta batida! Parabéns!' : `faltam ${falta} ml`}
              </Text>

              <View style={styles.linhaBotoes}>
                {QUANTIDADES.map((q) => {
                  const on = quantidade === q;
                  return (
                    <Pressable
                      key={q}
                      onPress={() => setQuantidade(q)}
                      style={[styles.opcao, on && styles.opcaoAtiva]}
                    >
                      <Text style={[styles.textoOpcao, on && styles.textoOpcaoAtiva]}>{q}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.linhaBotoes}>
                <Pressable style={[styles.botao, styles.botaoEspaco]} onPress={registrar}>
                  <Text style={styles.textoBotao}>+ {quantidade} ml</Text>
                </Pressable>
                <Pressable
                  style={[styles.botaoIcone, registros.length === 0 && styles.desabilitado]}
                  onPress={desfazer}
                  disabled={registros.length === 0}
                  accessibilityLabel="Desfazer"
                >
                  <Text style={styles.textoIcone}>↶</Text>
                </Pressable>
              </View>
            </View>

            {registros.length > 0 && (
              <>
                <Text style={styles.secao}>Hoje</Text>
                <View style={styles.cartao}>
                  {registros
                    .map((r, i) => ({ ...r, i }))
                    .reverse()
                    .map((r) => (
                      <View key={r.i} style={styles.registro}>
                        <Text style={styles.textoRegistro}>
                          {r.h} <Text style={styles.registroMl}>· {r.ml} ml</Text>
                        </Text>
                        <Pressable onPress={() => apagar(r.i)} hitSlop={10}>
                          <Text style={styles.apagar}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>
              </>
            )}

            <Pressable onPress={() => setAvisoAberto((v) => !v)} style={styles.infoLinha}>
              <Text style={styles.infoIcone}>ⓘ</Text>
              <Text style={styles.infoTexto}>Meta {origem}</Text>
            </Pressable>
            {avisoAberto && (
              <Text style={styles.aviso}>
                É só uma estimativa e não substitui orientação profissional. Se sentir qualquer
                mal-estar, pare e procure seu professor ou médico.
              </Text>
            )}

            <Text style={styles.secao}>Lembretes</Text>
            <View style={styles.cartao}>
              <View style={styles.linhaMini}>
                <Mini rotulo="Das" valor={inicio} aoMudar={mudarInicio} />
                <Mini rotulo="Às" valor={fim} aoMudar={mudarFim} />
              </View>

              <Text style={[styles.rotuloCartao, { marginTop: 14 }]}>A cada:</Text>
              <View style={styles.linhaBotoes}>
                {INTERVALOS.map((valor) => {
                  const ativo = intervalo === valor;
                  return (
                    <Pressable
                      key={valor}
                      onPress={() => mudarConfig({ intervalo: valor, inicio, fim })}
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
                <>
                  <Text style={styles.proximo}>
                    Próximo lembrete: {proximoLembrete(inicio, fim, intervalo)}
                  </Text>
                  <Pressable style={styles.botaoSecundarioCheio} onPress={desativarLembretes}>
                    <Text style={styles.textoSecundario}>Desativar lembretes</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.botaoCheio} onPress={() => ativarLembretes()}>
                  <Text style={styles.textoBotao}>Ativar lembretes</Text>
                </Pressable>
              )}

              {SEM_SUPORTE && (
                <Pressable style={styles.botaoSecundarioCheio} onPress={simular}>
                  <Text style={styles.textoSecundario}>Simular lembrete</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.fundo },
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
  cartaoBatida: { borderColor: CORES.destaque },
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
  pequeno: { fontSize: 13, color: CORES.textoSecundario, marginTop: 6 },
  textoBatida: { color: CORES.destaque, fontWeight: 'bold' },
  linhaBotoes: { flexDirection: 'row', marginTop: 14 },
  botao: {
    flex: 1,
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoEspaco: { marginRight: 8 },
  botaoIcone: {
    width: 50,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoIcone: { fontSize: 20, color: CORES.textoSecundario },
  desabilitado: { opacity: 0.35 },
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
  registro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  textoRegistro: { fontSize: 14, fontWeight: 'bold', color: CORES.texto },
  registroMl: { color: CORES.textoSecundario, fontWeight: 'normal' },
  apagar: { fontSize: 14, color: CORES.textoSecundario, paddingHorizontal: 6 },
  infoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoIcone: { fontSize: 14, color: CORES.textoSecundario, marginRight: 6 },
  infoTexto: { fontSize: 12, color: CORES.textoSecundario },
  aviso: {
    fontSize: 12,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginBottom: 10,
  },
  linhaMini: { flexDirection: 'row', justifyContent: 'space-between' },
  mini: { alignItems: 'center', flex: 1 },
  miniRotulo: { fontSize: 12, color: CORES.textoSecundario, marginBottom: 6 },
  miniLinha: { flexDirection: 'row', alignItems: 'center' },
  miniBotao: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTexto: { fontSize: 18, fontWeight: 'bold', color: CORES.texto },
  miniValor: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
    minWidth: 56,
    textAlign: 'center',
  },
  proximo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.destaque,
    textAlign: 'center',
    marginTop: 14,
  },
});