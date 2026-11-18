import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import TanqueAgua from '../components/WaterGlass';
import SemanaAgua from '../components/WaterWeek';
import { Cabecalho, Cartao, Secao, Tela } from '../components/UI';
import { api } from '../utils/api';
import { avisar } from '../utils/notify';
import { P } from '../utils/theme';

const NA_WEB = Platform.OS === 'web';
const NO_EXPO_GO = Constants.appOwnership === 'expo';
const SEM_SUPORTE = NA_WEB || (Platform.OS === 'android' && NO_EXPO_GO);

const INTERVALOS = [1, 2, 3];
const QUANTIDADES = [100, 200, 300, 500];

const BotaoAnimado = Animated.createAnimatedComponent(Pressable);

// Vibração leve ao adicionar. Mais forte quando bate a meta. (No navegador não faz nada.)
function vibrar(tipo) {
  if (Platform.OS === 'web') return;
  try {
    if (tipo === 'sucesso') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  } catch (erro) {
    // ignora
  }
}

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

// Quantos dias seguidos bateu a meta. Se hoje ainda não bateu, conta a partir de ontem.
function calcularSequencia(historico, consumidoHoje, metaHoje) {
  let total = 0;
  const dia = new Date();

  for (let i = 0; i < 365; i++) {
    const chave = dia.toLocaleDateString('pt-BR');
    const reg = i === 0 ? { ml: consumidoHoje, meta: metaHoje } : historico[chave];
    const bateu = !!reg && !!reg.meta && reg.ml >= reg.meta;

    if (bateu) total += 1;
    else if (i > 0) break;

    dia.setDate(dia.getDate() - 1);
  }

  return total;
}

// Monta os últimos 7 dias (terminando hoje) para o gráfico.
function montarSemana(historico, consumidoHoje, metaHoje) {
  const letras = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dias = [];

  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setDate(dia.getDate() - i);

    const reg =
      i === 0
        ? { ml: consumidoHoje, meta: metaHoje }
        : historico[dia.toLocaleDateString('pt-BR')];
    const ml = reg?.ml || 0;
    const metaDia = reg?.meta || null;

    dias.push({
      letra: letras[dia.getDay()],
      hoje: i === 0,
      batida: !!metaDia && ml >= metaDia,
      proporcao: metaDia ? Math.min(1, ml / metaDia) : 0,
    });
  }

  return dias;
}

// Faz o bloco aparecer subindo suavemente. "atraso" escalona a entrada.
function Entrar({ atraso = 0, children }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay: atraso }}
    >
      {children}
    </MotiView>
  );
}

// Botão que "afunda" com uma mola quando tocado.
function BotaoMola({ onPress, disabled, style, children, accessibilityLabel }) {
  const escala = useSharedValue(1);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <BotaoAnimado
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        escala.value = withSpring(0.94, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        escala.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      style={[style, estilo]}
    >
      {children}
    </BotaoAnimado>
  );
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
  const [historico, setHistorico] = useState({});
  const [quantidade, setQuantidade] = useState(200);
  const [lembreteAtivo, setLembreteAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState(2);
  const [inicio, setInicio] = useState(8);
  const [fim, setFim] = useState(20);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [pulso, setPulso] = useState(0);

  const chaveConsumo = `agua_consumo_${usuario.id}`;
  const chaveLembrete = `agua_lembrete_${usuario.id}`;
  const chaveHistorico = `agua_historico_${usuario.id}`;

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
    const [respConfig, respFicha, textoConsumo, textoLembrete, textoHistorico] = await Promise.all([
      api('GET', '/agua').catch((e) => {
        console.log('Erro ao carregar config de água', e);
        return null;
      }),
      api('GET', '/anamnese').catch((e) => {
        console.log('Erro ao carregar ficha', e);
        return null;
      }),
      AsyncStorage.getItem(chaveConsumo),
      AsyncStorage.getItem(chaveLembrete),
      AsyncStorage.getItem(chaveHistorico),
    ]);

    if (respConfig) setConfig({ modo: respConfig.modo, meta_ml: respConfig.meta_ml });
    setFicha(respFicha || null);

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
    if (textoHistorico) {
      try {
        setHistorico(JSON.parse(textoHistorico) || {});
      } catch (erro) {
        setHistorico({});
      }
    }
    setCarregando(false);
  }, [usuario.id, chaveConsumo, chaveLembrete, chaveHistorico]);

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

  // Guarda o consumo de hoje e também o total do dia no histórico (para o gráfico da semana).
  async function guardarRegistros(novos) {
    setRegistros(novos);

    const hoje = new Date().toLocaleDateString('pt-BR');
    const total = novos.reduce((soma, r) => soma + r.ml, 0);
    const novoHistorico = { ...historico, [hoje]: { ml: total, meta } };
    setHistorico(novoHistorico);

    await AsyncStorage.setItem(chaveConsumo, JSON.stringify({ data: hoje, registros: novos }));
    await AsyncStorage.setItem(chaveHistorico, JSON.stringify(novoHistorico));
  }

  const registrar = () => {
    const depois = consumido + quantidade;
    const bateuAgora = meta !== null && consumido < meta && depois >= meta;

    setPulso((p) => p + 1);
    vibrar(bateuAgora ? 'sucesso' : 'leve');
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
        <ActivityIndicator size="large" color={P.verde} />
      </View>
    );
  }

  const percentual = meta ? Math.min(100, Math.round((consumido / meta) * 100)) : 0;
  const falta = meta ? Math.max(0, meta - consumido) : 0;
  const batida = meta !== null && consumido >= meta;

  const semana = montarSemana(historico, consumido, meta);
  const sequencia = calcularSequencia(historico, consumido, meta);

  return (
    <Tela>
      <Cabecalho titulo="Água" subtitulo="Hidratação" aoVoltar={aoVoltar} />

      {desligado && (
        <Cartao style={styles.bloco}>
          <Text style={styles.textoCartao}>
            Seu professor desativou a meta de água para você. Em caso de dúvida, fale com ele.
          </Text>
        </Cartao>
      )}

      {!desligado && meta === null && sensivel && config.modo === 'automatico' && (
        <Cartao style={[styles.bloco, styles.cartaoAlerta]}>
          <Text style={styles.textoAlerta}>
            Pela sua ficha de saúde, não sugerimos uma meta automática. Algumas condições exigem
            controle de líquidos. Converse com seu professor ou médico sobre quanto beber.
          </Text>
        </Cartao>
      )}

      {!desligado && meta === null && !sensivel && !peso && (
        <Cartao style={styles.bloco}>
          <Text style={styles.textoCartao}>
            Para sugerir uma meta, registre seu peso em Medidas.
          </Text>
        </Cartao>
      )}

      {meta !== null && (
        <>
          <Entrar>
            <TanqueAgua
              consumido={consumido}
              meta={meta}
              percentual={percentual}
              falta={falta}
              batida={batida}
              pulso={pulso}
            />
          </Entrar>

          <Entrar atraso={120}>
            <Cartao style={styles.bloco}>
              <Text style={styles.rotuloCartao}>Quanto você bebeu?</Text>

              <View style={styles.linhaBotoes}>
                {QUANTIDADES.map((q, i) => {
                  const on = quantidade === q;
                  return (
                    <BotaoMola
                      key={q}
                      onPress={() => setQuantidade(q)}
                      style={[
                        styles.opcao,
                        i < QUANTIDADES.length - 1 && styles.opcaoEspaco,
                        on && styles.opcaoAtiva,
                      ]}
                    >
                      <Text style={[styles.textoOpcao, on && styles.textoOpcaoAtiva]}>{q}</Text>
                    </BotaoMola>
                  );
                })}
              </View>

              <View style={styles.linhaBotoes}>
                <BotaoMola style={[styles.botao, styles.botaoEspaco]} onPress={registrar}>
                  <Ionicons name="water" size={18} color={P.verde} />
                  <Text style={styles.textoBotao}>+ {quantidade} ml</Text>
                </BotaoMola>
                <BotaoMola
                  style={[styles.botaoIcone, registros.length === 0 && styles.desabilitado]}
                  onPress={desfazer}
                  disabled={registros.length === 0}
                  accessibilityLabel="Desfazer"
                >
                  <Ionicons name="arrow-undo" size={20} color={P.texto} />
                </BotaoMola>
              </View>
            </Cartao>
          </Entrar>

          <Entrar atraso={240}>
            <Secao titulo="Últimos 7 dias" />
            <SemanaAgua dias={semana} sequencia={sequencia} />
          </Entrar>

          {registros.length > 0 && (
            <Entrar atraso={320}>
              <Secao titulo="Hoje" />
              <Cartao style={styles.bloco}>
                {registros
                  .map((r, i) => ({ ...r, i }))
                  .reverse()
                  .map((r, pos, lista) => (
                    <View
                      key={r.i}
                      style={[styles.registro, pos === lista.length - 1 && styles.semBorda]}
                    >
                      <Text style={styles.textoRegistro}>
                        {r.h} <Text style={styles.registroMl}>· {r.ml} ml</Text>
                      </Text>
                      <Pressable onPress={() => apagar(r.i)} hitSlop={10}>
                        <Text style={styles.apagar}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
              </Cartao>
            </Entrar>
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

          <Entrar atraso={400}>
            <Secao titulo="Lembretes" />
            <Cartao style={styles.bloco}>
              <View style={styles.linhaMini}>
                <Mini rotulo="Das" valor={inicio} aoMudar={mudarInicio} />
                <Mini rotulo="Às" valor={fim} aoMudar={mudarFim} />
              </View>

              <Text style={[styles.rotuloCartao, { marginTop: 16 }]}>A cada:</Text>
              <View style={styles.linhaBotoes}>
                {INTERVALOS.map((valor, i) => {
                  const ativo = intervalo === valor;
                  return (
                    <Pressable
                      key={valor}
                      onPress={() => mudarConfig({ intervalo: valor, inicio, fim })}
                      style={[
                        styles.opcao,
                        i < INTERVALOS.length - 1 && styles.opcaoEspaco,
                        ativo && styles.opcaoAtiva,
                      ]}
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
            </Cartao>
          </Entrar>
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: P.fundo },
  bloco: { marginBottom: 12 },
  cartaoAlerta: { borderWidth: 2, borderColor: P.erro },
  textoCartao: { fontSize: 14, lineHeight: 20, color: P.texto },
  textoAlerta: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: P.erro },
  rotuloCartao: { fontSize: 13, fontWeight: '700', color: P.textoSecundario },
  linhaBotoes: { flexDirection: 'row', marginTop: 16 },
  botao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
  },
  botaoEspaco: { marginRight: 8 },
  botaoIcone: {
    width: 54,
    backgroundColor: P.fundo,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desabilitado: { opacity: 0.35 },
  botaoCheio: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  textoBotao: { fontSize: 15, fontWeight: '800', color: P.verde, marginLeft: 6 },
  botaoSecundarioCheio: {
    backgroundColor: P.fundo,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoSecundario: { fontSize: 14, fontWeight: '700', color: P.texto },
  opcao: {
    flex: 1,
    backgroundColor: P.fundo,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  opcaoEspaco: { marginRight: 8 },
  opcaoAtiva: { backgroundColor: P.verde },
  textoOpcao: { fontSize: 15, fontWeight: '700', color: P.texto },
  textoOpcaoAtiva: { color: P.textoSobreVerde },
  registro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  semBorda: { borderBottomWidth: 0 },
  textoRegistro: { fontSize: 14, fontWeight: '700', color: P.texto },
  registroMl: { color: P.textoSecundario, fontWeight: '400' },
  apagar: { fontSize: 14, color: P.textoSecundario, paddingHorizontal: 6 },
  infoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  infoIcone: { fontSize: 14, color: P.textoSecundario, marginRight: 6 },
  infoTexto: { fontSize: 12, color: P.textoSecundario },
  aviso: { fontSize: 12, color: P.textoSecundario, textAlign: 'center', marginBottom: 10 },
  linhaMini: { flexDirection: 'row', justifyContent: 'space-between' },
  mini: { alignItems: 'center', flex: 1 },
  miniRotulo: { fontSize: 12, fontWeight: '700', color: P.textoSecundario, marginBottom: 8 },
  miniLinha: { flexDirection: 'row', alignItems: 'center' },
  miniBotao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTexto: { fontSize: 18, fontWeight: '700', color: P.texto },
  miniValor: {
    fontSize: 20,
    fontWeight: '800',
    color: P.texto,
    minWidth: 56,
    textAlign: 'center',
  },
  proximo: {
    fontSize: 13,
    fontWeight: '800',
    color: P.verde,
    textAlign: 'center',
    marginTop: 16,
  },
});