import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Logo from '../components/Logo';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

const USAR_NATIVO = Platform.OS !== 'web';

// Conteúdo que aparece subindo. "atraso" escalona a entrada.
function Aparecer({ atraso = 0, style, children }) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(valor, {
      toValue: 1,
      duration: 450,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USAR_NATIVO,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: valor,
          transform: [
            { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Botão com pulinho de mola ao tocar.
function BotaoMola({ style, onPress, children }) {
  const escala = useRef(new Animated.Value(1)).current;

  const apertar = () =>
    Animated.timing(escala, { toValue: 0.94, duration: 90, useNativeDriver: USAR_NATIVO }).start();
  const soltar = () =>
    Animated.spring(escala, {
      toValue: 1,
      friction: 3,
      tension: 140,
      useNativeDriver: USAR_NATIVO,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={apertar} onPressOut={soltar}>
      <Animated.View style={[style, { transform: [{ scale: escala }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Cabeçalho de seção: barrinha amarela, título e explicação.
function TituloSecao({ titulo, descricao }) {
  return (
    <View style={styles.secao}>
      <View style={styles.barraSecao} />
      <View style={styles.textosSecao}>
        <Text style={styles.tituloSecao}>{titulo}</Text>
        <Text style={styles.descricaoSecao}>{descricao}</Text>
      </View>
    </View>
  );
}

export default function TelaAdmin({ usuario, aoSair }) {
  const [carregando, setCarregando] = useState(true);
  const [pessoas, setPessoas] = useState([]);
  const [vinculos, setVinculos] = useState({}); // { alunoId: professorId }
  const [aba, setAba] = useState('alunos');
  const [escolhendo, setEscolhendo] = useState(null); // aluno que está escolhendo professor

  const carregar = useCallback(async () => {
    const [respPerfis, respVinculos] = await Promise.all([
      supabase.from('perfis').select('id, nome, tipo').order('nome'),
      supabase.from('vinculos').select('aluno_id, professor_id'),
    ]);

    if (respPerfis.error || respVinculos.error) {
      console.log('Erro ao carregar', respPerfis.error, respVinculos.error);
      avisar('Erro', 'Não foi possível carregar os usuários.');
    }

    const mapa = {};
    (respVinculos.data || []).forEach((v) => {
      mapa[v.aluno_id] = v.professor_id;
    });

    setPessoas(respPerfis.data || []);
    setVinculos(mapa);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alunos = pessoas.filter((p) => p.tipo === 'aluno');
  const professores = pessoas.filter((p) => p.tipo === 'professor');

  function nomeDe(id) {
    return pessoas.find((p) => p.id === id)?.nome || 'Sem nome';
  }

  async function mudarTipo(id, novoTipo) {
    const { error } = await supabase.rpc('definir_tipo', { p_usuario: id, p_tipo: novoTipo });
    if (error) {
      console.log('Erro ao mudar tipo', error);
      avisar('Erro', 'Não foi possível alterar o tipo.');
      return;
    }
    setEscolhendo(null);
    carregar();
  }

  async function vincular(alunoId, professorId) {
    const { error } = await supabase
      .from('vinculos')
      .upsert({ aluno_id: alunoId, professor_id: professorId }, { onConflict: 'aluno_id' });
    if (error) {
      console.log('Erro ao vincular', error);
      avisar('Erro', 'Não foi possível vincular.');
      return;
    }
    setEscolhendo(null);
    carregar();
  }

  async function desvincular(alunoId) {
    const { error } = await supabase.from('vinculos').delete().eq('aluno_id', alunoId);
    if (error) {
      console.log('Erro ao desvincular', error);
      avisar('Erro', 'Não foi possível remover o vínculo.');
      return;
    }
    carregar();
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.topo}>
          <View style={styles.marca}>
            <Logo tamanho={56} style={styles.logo} />
            <View style={styles.nomeMarca}>
              <Text style={styles.academia}>Olá, {usuario?.nome}</Text>
              <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
            </View>
          </View>

          <Pressable
            onPress={aoSair}
            hitSlop={10}
            style={({ pressed }) => [styles.botaoSair, pressed && styles.pressionado]}
          >
            <Text style={styles.sair}>Sair</Text>
          </Pressable>
        </View>

        <View style={styles.linhaAmarela} />

        <Aparecer atraso={0}>
          <View style={styles.cabecalho}>
            <Text style={styles.saudacao}>Painel de controle</Text>
            <Text style={styles.titulo}>Administração</Text>
          </View>
        </Aparecer>

        <Aparecer atraso={100}>
          <View style={styles.abas}>
            <BotaoMola
              onPress={() => {
                setAba('alunos');
                setEscolhendo(null);
              }}
              style={[styles.aba, styles.abaEspaco, aba === 'alunos' && styles.abaAtiva]}
            >
              <Text style={[styles.abaNumero, aba === 'alunos' && styles.textoAtivo]}>
                {alunos.length}
              </Text>
              <Text style={[styles.abaTexto, aba === 'alunos' && styles.textoAtivo]}>Alunos</Text>
            </BotaoMola>

            <BotaoMola
              onPress={() => {
                setAba('professores');
                setEscolhendo(null);
              }}
              style={[styles.aba, aba === 'professores' && styles.abaAtiva]}
            >
              <Text style={[styles.abaNumero, aba === 'professores' && styles.textoAtivo]}>
                {professores.length}
              </Text>
              <Text style={[styles.abaTexto, aba === 'professores' && styles.textoAtivo]}>
                Professores
              </Text>
            </BotaoMola>
          </View>
        </Aparecer>

        <Aparecer atraso={200} key={`secao-${aba}`}>
          <TituloSecao
            titulo={aba === 'alunos' ? 'Alunos' : 'Professores'}
            descricao={
              aba === 'alunos'
                ? 'Vincule cada aluno a um professor'
                : 'Veja quantos alunos cada professor tem'
            }
          />
        </Aparecer>

        {aba === 'alunos' && alunos.length === 0 && (
          <Text style={styles.vazio}>Nenhum aluno cadastrado.</Text>
        )}

        {aba === 'alunos' &&
          alunos.map((aluno, idx) => {
            const professorId = vinculos[aluno.id];
            return (
              <Aparecer
                key={aluno.id}
                atraso={260 + Math.min(idx, 8) * 80}
                style={styles.cartao}
              >
                <Text style={styles.nome}>{aluno.nome || 'Sem nome'}</Text>
                <Text style={styles.detalhe}>
                  {professorId ? `Professor: ${nomeDe(professorId)}` : 'Sem professor'}
                </Text>

                <View style={styles.linhaBotoes}>
                  <BotaoMola
                    style={styles.botao}
                    onPress={() => setEscolhendo(escolhendo === aluno.id ? null : aluno.id)}
                  >
                    <Text style={styles.textoBotao}>
                      {professorId ? 'Trocar professor' : 'Escolher professor'}
                    </Text>
                  </BotaoMola>
                  {professorId && (
                    <BotaoMola style={styles.botaoSecundario} onPress={() => desvincular(aluno.id)}>
                      <Text style={styles.textoSecundario}>Remover vínculo</Text>
                    </BotaoMola>
                  )}
                  <BotaoMola
                    style={styles.botaoSecundario}
                    onPress={() => mudarTipo(aluno.id, 'professor')}
                  >
                    <Text style={styles.textoSecundario}>Tornar professor</Text>
                  </BotaoMola>
                </View>

                {escolhendo === aluno.id && (
                  <Aparecer style={styles.escolha}>
                    {professores.length === 0 ? (
                      <Text style={styles.detalhe}>
                        Ainda não há professores. Torne alguém professor primeiro.
                      </Text>
                    ) : (
                      <View style={styles.chips}>
                        {professores.map((prof) => (
                          <Pressable
                            key={prof.id}
                            onPress={() => vincular(aluno.id, prof.id)}
                            style={({ pressed }) => [styles.chip, pressed && styles.chipAtivo]}
                          >
                            {({ pressed }) => (
                              <Text style={[styles.textoChip, pressed && styles.textoAtivo]}>
                                {prof.nome || 'Sem nome'}
                              </Text>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </Aparecer>
                )}
              </Aparecer>
            );
          })}

        {aba === 'professores' && professores.length === 0 && (
          <Text style={styles.vazio}>
            Nenhum professor ainda. Na aba Alunos, toque em "Tornar professor".
          </Text>
        )}

        {aba === 'professores' &&
          professores.map((prof, idx) => {
            const qtd = Object.values(vinculos).filter((id) => id === prof.id).length;
            return (
              <Aparecer
                key={prof.id}
                atraso={260 + Math.min(idx, 8) * 80}
                style={styles.cartao}
              >
                <Text style={styles.nome}>{prof.nome || 'Sem nome'}</Text>
                <Text style={styles.detalhe}>{qtd === 1 ? '1 aluno' : `${qtd} alunos`}</Text>
                <View style={styles.linhaBotoes}>
                  <BotaoMola
                    style={styles.botaoSecundario}
                    onPress={() => mudarTipo(prof.id, 'aluno')}
                  >
                    <Text style={styles.textoSecundario}>Voltar para aluno</Text>
                  </BotaoMola>
                </View>
              </Aparecer>
            );
          })}
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
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  // Topo
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
  },
  marca: { flexDirection: 'row', alignItems: 'center' },
  logo: { alignSelf: 'auto', marginBottom: 0 },
  nomeMarca: { marginLeft: 12 },
  academia: { fontSize: 12, fontStyle: 'italic', color: CORES.textoSecundario },
  nomeAcademia: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  botaoSair: { paddingVertical: 6, paddingHorizontal: 4 },
  sair: { fontSize: 14, color: CORES.textoSecundario, fontWeight: 'bold' },
  pressionado: { opacity: 0.6 },
  linhaAmarela: {
    height: 4,
    backgroundColor: CORES.destaque,
    marginHorizontal: -20,
    marginBottom: 16,
  },
  cabecalho: { marginBottom: 16 },
  saudacao: { fontSize: 15, color: CORES.textoSecundario },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },

  // Abas
  abas: { flexDirection: 'row', marginBottom: 20 },
  aba: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  abaEspaco: { marginRight: 8 },
  abaAtiva: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  abaNumero: {
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  abaTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  textoAtivo: { color: CORES.textoSobreDestaque },

  // Seção
  secao: { flexDirection: 'row', alignItems: 'stretch', marginTop: 8, marginBottom: 12 },
  barraSecao: { width: 4, borderRadius: 2, backgroundColor: CORES.destaque, marginRight: 10 },
  textosSecao: { flex: 1 },
  tituloSecao: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  descricaoSecao: { fontSize: 12, color: CORES.textoSecundario, marginTop: 2 },
  vazio: { color: CORES.textoSecundario, textAlign: 'center', marginTop: 24, fontSize: 14 },

  // Cartões
  cartao: {
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nome: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  detalhe: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  botao: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  textoBotao: {
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoSecundario: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  textoSecundario: { fontSize: 13, fontWeight: 'bold', color: CORES.textoSecundario },

  // Escolha de professor
  escolha: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
    paddingTop: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipAtivo: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  textoChip: { fontSize: 14, fontWeight: 'bold', color: CORES.texto },
});