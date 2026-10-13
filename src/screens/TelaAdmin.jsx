import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

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
    <View style={styles.tela}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>Administração</Text>
          <Text style={styles.sub}>Olá, {usuario?.nome}</Text>
        </View>
        <Pressable style={styles.botaoSair} onPress={aoSair}>
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.abas}>
        <Pressable
          style={[styles.aba, aba === 'alunos' && styles.abaAtiva]}
          onPress={() => setAba('alunos')}
        >
          <Text style={[styles.abaTexto, aba === 'alunos' && styles.abaTextoAtivo]}>
            Alunos ({alunos.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.aba, aba === 'professores' && styles.abaAtiva]}
          onPress={() => setAba('professores')}
        >
          <Text style={[styles.abaTexto, aba === 'professores' && styles.abaTextoAtivo]}>
            Professores ({professores.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {aba === 'alunos' && alunos.length === 0 && (
          <Text style={styles.vazio}>Nenhum aluno cadastrado.</Text>
        )}

        {aba === 'alunos' &&
          alunos.map((aluno) => {
            const professorId = vinculos[aluno.id];
            return (
              <View key={aluno.id} style={styles.cartao}>
                <Text style={styles.nome}>{aluno.nome || 'Sem nome'}</Text>
                <Text style={styles.detalhe}>
                  {professorId ? `Professor: ${nomeDe(professorId)}` : 'Sem professor'}
                </Text>

                <View style={styles.linhaBotoes}>
                  <Pressable
                    style={styles.botao}
                    onPress={() => setEscolhendo(escolhendo === aluno.id ? null : aluno.id)}
                  >
                    <Text style={styles.botaoTexto}>
                      {professorId ? 'Trocar professor' : 'Escolher professor'}
                    </Text>
                  </Pressable>
                  {professorId && (
                    <Pressable style={styles.botaoSecundario} onPress={() => desvincular(aluno.id)}>
                      <Text style={styles.botaoSecundarioTexto}>Remover vínculo</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.botaoSecundario}
                    onPress={() => mudarTipo(aluno.id, 'professor')}
                  >
                    <Text style={styles.botaoSecundarioTexto}>Tornar professor</Text>
                  </Pressable>
                </View>

                {escolhendo === aluno.id && (
                  <View style={styles.escolha}>
                    {professores.length === 0 ? (
                      <Text style={styles.detalhe}>
                        Ainda não há professores. Torne alguém professor primeiro.
                      </Text>
                    ) : (
                      professores.map((prof) => (
                        <Pressable
                          key={prof.id}
                          style={styles.opcao}
                          onPress={() => vincular(aluno.id, prof.id)}
                        >
                          <Text style={styles.opcaoTexto}>{prof.nome || 'Sem nome'}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}

        {aba === 'professores' && professores.length === 0 && (
          <Text style={styles.vazio}>
            Nenhum professor ainda. Na aba Alunos, toque em "Tornar professor".
          </Text>
        )}

        {aba === 'professores' &&
          professores.map((prof) => {
            const qtd = Object.values(vinculos).filter((id) => id === prof.id).length;
            return (
              <View key={prof.id} style={styles.cartao}>
                <Text style={styles.nome}>{prof.nome || 'Sem nome'}</Text>
                <Text style={styles.detalhe}>
                  {qtd === 1 ? '1 aluno' : `${qtd} alunos`}
                </Text>
                <View style={styles.linhaBotoes}>
                  <Pressable
                    style={styles.botaoSecundario}
                    onPress={() => mudarTipo(prof.id, 'aluno')}
                  >
                    <Text style={styles.botaoSecundarioTexto}>Voltar para aluno</Text>
                  </Pressable>
                </View>
              </View>
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
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingTop: 48,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  sub: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  botaoSair: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  botaoSairTexto: {
    color: '#FFFFFF',
  },
  abas: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  aba: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
  },
  abaAtiva: {
    borderBottomColor: CORES.destaque,
  },
  abaTexto: {
    color: '#BBBBBB',
    fontWeight: '600',
  },
  abaTextoAtivo: {
    color: CORES.destaque,
  },
  lista: {
    padding: 20,
    paddingBottom: 48,
  },
  vazio: {
    color: '#BBBBBB',
    textAlign: 'center',
    marginTop: 32,
  },
  cartao: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detalhe: {
    fontSize: 14,
    color: '#BBBBBB',
    marginTop: 2,
  },
  linhaBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  botao: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: CORES.destaque,
  },
  botaoTexto: {
    fontWeight: 'bold',
    color: '#000000',
  },
  botaoSecundario: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  botaoSecundarioTexto: {
    color: '#FFFFFF',
  },
  escolha: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
  },
  opcao: {
    paddingVertical: 10,
  },
  opcaoTexto: {
    color: CORES.destaque,
    fontSize: 16,
  },
});