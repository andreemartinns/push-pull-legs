import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ModalDivisao from '../components/ModalDivisao';
import ModalEditarExercicio from '../components/ModalEditarExercicio';
import ModalExercicios from '../components/ModalExercicios';
import { avisar } from '../utils/avisar';
import { DIVISOES } from '../utils/divisoes';
import { GRUPOS } from '../utils/grupos';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

export default function TelaEditorTreino({ aluno, professorId, aoVoltar }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [existe, setExiste] = useState(false);
  const [exercicios, setExercicios] = useState([]);
  const [ficha, setFicha] = useState(null);
  const [grupoModal, setGrupoModal] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [divisaoAberta, setDivisaoAberta] = useState(null);
  const [editando, setEditando] = useState(null);

  // Carrega o treino já montado para este aluno (se houver) e a ficha de saúde dele.
  useEffect(() => {
    async function carregar() {
      const [respTreino, respFicha] = await Promise.all([
        supabase
          .from('treinos_prescritos')
          .select('exercicios')
          .eq('aluno_id', aluno.id)
          .maybeSingle(),
        supabase.from('anamneses').select('*').eq('aluno_id', aluno.id).maybeSingle(),
      ]);

      if (respTreino.error || respFicha.error) {
        console.log('Erro ao carregar', respTreino.error, respFicha.error);
        avisar('Erro', 'Não foi possível carregar os dados do aluno.');
      }

      setExercicios(respTreino.data?.exercicios || []);
      setExiste(!!respTreino.data);
      setFicha(respFicha.data || null);
      setCarregando(false);
    }
    carregar();
  }, [aluno.id]);

  const condicoes = Array.isArray(ficha?.condicoes) ? ficha.condicoes : [];
  const temRisco = condicoes.length > 0 || ficha?.restricao_medica === true;
  const temLesao = !!ficha?.lesoes;

  function abrirGrupo(nome) {
    setGrupoModal(nome);
    setModalVisivel(true);
  }

  function adicionarExercicio(nome) {
    setExercicios((atual) => [
      ...atual,
      {
        id: `${Date.now()}`,
        nome,
        series: '3',
        repeticoes: '12',
        peso: '',
        grupo: grupoModal,
      },
    ]);
    setModalVisivel(false);
  }

  // Adiciona vários de uma vez, sem repetir os que já estão na lista.
  function adicionarDaDivisao(lista) {
    setExercicios((atual) => {
      const nomes = atual.map((item) => item.nome);
      const base = Date.now();
      const novos = lista
        .filter((item) => !nomes.includes(item.nome))
        .map((item, indice) => ({
          id: `${base + indice}`,
          nome: item.nome,
          series: '3',
          repeticoes: '12',
          peso: '',
          grupo: item.grupo,
        }));
      return [...atual, ...novos];
    });
  }

  function mover(indice, passo) {
    const destino = indice + passo;
    if (destino < 0 || destino >= exercicios.length) return;
    const copia = [...exercicios];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    setExercicios(copia);
  }

  function remover(id) {
    setExercicios((atual) => atual.filter((item) => item.id !== id));
  }

  function salvarEdicao(novasSeries, novasRepeticoes, novoPeso) {
    setExercicios((atual) =>
      atual.map((item) =>
        item.id === editando.id
          ? { ...item, series: novasSeries, repeticoes: novasRepeticoes, peso: novoPeso }
          : item
      )
    );
    setEditando(null);
  }

  async function salvar() {
    if (exercicios.length === 0) {
      avisar('Treino vazio', 'Adicione pelo menos um exercício.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from('treinos_prescritos').upsert(
      {
        aluno_id: aluno.id,
        professor_id: professorId,
        exercicios,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'aluno_id' }
    );
    setSalvando(false);

    if (error) {
      console.log('Erro ao salvar treino', error);
      avisar('Erro', 'Não foi possível salvar o treino.');
      return;
    }

    setExiste(true);
    avisar('Treino salvo', `${aluno.nome} já pode ver o treino no app.`);
  }

  async function removerTreino() {
    const { error } = await supabase.from('treinos_prescritos').delete().eq('aluno_id', aluno.id);
    if (error) {
      console.log('Erro ao remover treino', error);
      avisar('Erro', 'Não foi possível remover o treino.');
      return;
    }
    setExercicios([]);
    setExiste(false);
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
        <View style={styles.textosTopo}>
          <Text style={styles.titulo}>Treino de {aluno.nome || 'aluno'}</Text>
          <Text style={styles.sub}>Monte e salve para o aluno ver</Text>
        </View>
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.botaoVoltarTexto}>Voltar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {!ficha && (
          <View style={styles.avisoNeutro}>
            <Text style={styles.avisoNeutroTexto}>
              O aluno ainda não preencheu a ficha de saúde. Considere esperar antes de montar o treino.
            </Text>
          </View>
        )}

        {ficha && (temRisco || temLesao) && (
          <View style={styles.avisoRisco}>
            <Text style={styles.avisoRiscoTitulo}>Atenção ao montar este treino</Text>

            {condicoes.length > 0 && (
              <Text style={styles.avisoRiscoTexto}>Condições: {condicoes.join(', ')}</Text>
            )}
            {ficha.restricao_medica === true && (
              <Text style={styles.avisoRiscoTexto}>Já recebeu restrição médica a exercícios.</Text>
            )}
            {temLesao && <Text style={styles.avisoRiscoTexto}>Lesões ou dores: {ficha.lesoes}</Text>}
            {ficha.objetivo && (
              <Text style={styles.avisoRiscoTexto}>Objetivo: {ficha.objetivo}</Text>
            )}
          </View>
        )}

        {ficha && !temRisco && !temLesao && ficha.objetivo && (
          <View style={styles.avisoNeutro}>
            <Text style={styles.avisoNeutroTexto}>
              Objetivo: {ficha.objetivo}. Sem condições de saúde informadas.
            </Text>
          </View>
        )}

        <Text style={styles.secao}>Treino pronto</Text>
        <View style={styles.linha}>
          {DIVISOES.map((item) => (
            <Pressable key={item.nome} style={styles.chip} onPress={() => setDivisaoAberta(item)}>
              <Text style={styles.chipTexto}>{item.nome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.secao}>Por grupo muscular</Text>
        <View style={styles.linha}>
          {GRUPOS.map((item) => (
            <Pressable key={item.nome} style={styles.chip} onPress={() => abrirGrupo(item.nome)}>
              <Text style={styles.chipTexto}>{item.nome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.secao}>Exercícios do treino ({exercicios.length})</Text>

        {exercicios.length === 0 && (
          <Text style={styles.vazio}>Nenhum exercício ainda. Escolha acima para começar.</Text>
        )}

        {exercicios.map((ex, indice) => (
          <View key={ex.id} style={styles.cartao}>
            <Text style={styles.nome}>
              {indice + 1}. {ex.nome}
            </Text>
            <Text style={styles.detalhe}>
              {ex.series} x {ex.repeticoes}
              {ex.peso ? ` · ${ex.peso} kg` : ''}
            </Text>

            <View style={styles.linhaBotoes}>
              <Pressable style={styles.botaoPequeno} onPress={() => mover(indice, -1)}>
                <Text style={styles.botaoPequenoTexto}>Subir</Text>
              </Pressable>
              <Pressable style={styles.botaoPequeno} onPress={() => mover(indice, 1)}>
                <Text style={styles.botaoPequenoTexto}>Descer</Text>
              </Pressable>
              <Pressable style={styles.botaoPequeno} onPress={() => setEditando(ex)}>
                <Text style={styles.botaoPequenoTexto}>Editar</Text>
              </Pressable>
              <Pressable style={styles.botaoPequeno} onPress={() => remover(ex.id)}>
                <Text style={[styles.botaoPequenoTexto, styles.textoRemover]}>Remover</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.botaoSalvar, salvando && styles.desabilitado]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar treino'}</Text>
        </Pressable>

        {existe && (
          <Pressable style={styles.botaoRemoverTreino} onPress={removerTreino}>
            <Text style={styles.textoRemover}>Remover treino do aluno</Text>
          </Pressable>
        )}
      </ScrollView>

      <ModalExercicios
        visivel={modalVisivel}
        grupo={grupoModal}
        personalizados={[]}
        aoFechar={() => setModalVisivel(false)}
        aoSelecionar={adicionarExercicio}
        aoCriar={adicionarExercicio}
        aoApagar={() => {}}
      />

      <ModalDivisao
        visivel={divisaoAberta !== null}
        divisao={divisaoAberta}
        jaAdicionados={exercicios.map((item) => item.nome)}
        aoFechar={() => setDivisaoAberta(null)}
        aoAdicionar={adicionarDaDivisao}
      />

      <ModalEditarExercicio
        visivel={editando !== null}
        exercicio={editando}
        aoFechar={() => setEditando(null)}
        aoSalvar={salvarEdicao}
      />
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
    marginBottom: 12,
  },
  textosTopo: {
    flex: 1,
    marginRight: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  sub: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  botaoVoltar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  botaoVoltarTexto: {
    color: CORES.texto,
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  avisoRisco: {
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  avisoRiscoTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 6,
  },
  avisoRiscoTexto: {
    fontSize: 14,
    color: CORES.texto,
    marginTop: 2,
  },
  avisoNeutro: {
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  avisoNeutroTexto: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  secao: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.texto,
    marginTop: 12,
    marginBottom: 8,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
  chipTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  vazio: {
    color: CORES.textoSecundario,
    marginTop: 4,
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  detalhe: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  linhaBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  botaoPequeno: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  botaoPequenoTexto: {
    fontSize: 13,
    color: CORES.texto,
  },
  textoRemover: {
    color: '#FF6B6B',
  },
  botaoSalvar: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: CORES.destaque,
  },
  botaoSalvarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  desabilitado: {
    opacity: 0.6,
  },
  botaoRemoverTreino: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
});