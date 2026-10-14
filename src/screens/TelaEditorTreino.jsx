import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [treinos, setTreinos] = useState([]);
  const [selId, setSelId] = useState(null);
  const [proximoId, setProximoId] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [grupoModal, setGrupoModal] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [divisaoAberta, setDivisaoAberta] = useState(null);
  const [editando, setEditando] = useState(null);
  const divisaoNome = useRef('');

  const sel = treinos.find((t) => t.id === selId) || null;
  const exercicios = sel?.exercicios || [];

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

      const bruto = respTreino.data?.exercicios;
      let lista = [];
      let prox = null;
      if (Array.isArray(bruto)) {
        // formato antigo: lista única vira "Treino 1"
        if (bruto.length > 0) lista = [{ id: 't1', nome: 'Treino 1', exercicios: bruto }];
      } else if (bruto?.treinos) {
        lista = bruto.treinos;
        prox = bruto.proximoId || null;
      }

      setTreinos(lista);
      setSelId(lista[0]?.id || null);
      setProximoId(prox);
      setFicha(respFicha.data || null);
      setCarregando(false);
    }
    carregar();
  }, [aluno.id]);

  const condicoes = Array.isArray(ficha?.condicoes) ? ficha.condicoes : [];
  const temRisco = condicoes.length > 0 || ficha?.restricao_medica === true;
  const temLesao = !!ficha?.lesoes;

  function editarSel(fn) {
    if (!sel) {
      const novo = { id: `${Date.now()}`, nome: 'Treino 1', exercicios: fn([]) };
      setTreinos([novo]);
      setSelId(novo.id);
      return;
    }
    setTreinos((atual) =>
      atual.map((t) => (t.id === selId ? { ...t, exercicios: fn(t.exercicios) } : t))
    );
  }

  function novoTreino(nome, exs = []) {
    const novo = {
      id: `${Date.now()}`,
      nome: nome || `Treino ${treinos.length + 1}`,
      exercicios: exs,
    };
    setTreinos((atual) => [...atual, novo]);
    setSelId(novo.id);
  }

  function renomear(nome) {
    setTreinos((atual) => atual.map((t) => (t.id === selId ? { ...t, nome } : t)));
  }

  function moverTreino(passo) {
    const i = treinos.findIndex((t) => t.id === selId);
    const d = i + passo;
    if (i < 0 || d < 0 || d >= treinos.length) return;
    const copia = [...treinos];
    [copia[i], copia[d]] = [copia[d], copia[i]];
    setTreinos(copia);
  }

  function abrirGrupo(nome) {
    setGrupoModal(nome);
    setModalVisivel(true);
  }

  function criarExercicio(nome, grupo) {
    return {
      id: `${Date.now()}${Math.random()}`,
      nome,
      series: '3',
      repeticoes: '12',
      peso: '',
      grupo,
    };
  }

  function adicionarExercicio(nome) {
    editarSel((atual) => [...atual, criarExercicio(nome, grupoModal)]);
    setModalVisivel(false);
  }

  // Treino pronto: cria um treino NOVO com o nome da divisão (Push, Pull, Legs...).
  function adicionarDaDivisao(lista) {
    const exs = lista.map((item) => criarExercicio(item.nome, item.grupo));
    novoTreino(divisaoNome.current, exs);
  }

  function mover(indice, passo) {
    editarSel((atual) => {
      const destino = indice + passo;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function remover(id) {
    editarSel((atual) => atual.filter((item) => item.id !== id));
  }

  function salvarEdicao(novasSeries, novasRepeticoes, novoPeso) {
    editarSel((atual) =>
      atual.map((item) =>
        item.id === editando.id
          ? { ...item, series: novasSeries, repeticoes: novasRepeticoes, peso: novoPeso }
          : item
      )
    );
    setEditando(null);
  }

  async function gravar(lista) {
    const prox = lista.some((t) => t.id === proximoId) ? proximoId : lista[0].id;
    const { error } = await supabase.from('treinos_prescritos').upsert(
      {
        aluno_id: aluno.id,
        professor_id: professorId,
        exercicios: { treinos: lista, proximoId: prox },
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'aluno_id' }
    );
    if (!error) setProximoId(prox);
    return error;
  }

  async function salvar() {
    if (treinos.length === 0 || treinos.some((t) => t.exercicios.length === 0)) {
      avisar('Treino vazio', 'Cada treino precisa de pelo menos um exercício.');
      return;
    }
    setSalvando(true);
    const error = await gravar(treinos);
    setSalvando(false);

    if (error) {
      console.log('Erro ao salvar treino', error);
      avisar('Erro', 'Não foi possível salvar o treino.');
      return;
    }
    avisar('Treino salvo', `${aluno.nome} já pode ver o treino no app.`);
  }

  async function removerEsteTreino() {
    const resto = treinos.filter((t) => t.id !== selId);
    let error;
    if (resto.length === 0) {
      ({ error } = await supabase.from('treinos_prescritos').delete().eq('aluno_id', aluno.id));
    } else {
      error = await gravar(resto);
    }
    if (error) {
      console.log('Erro ao remover treino', error);
      avisar('Erro', 'Não foi possível remover o treino.');
      return;
    }
    setTreinos(resto);
    setSelId(resto[0]?.id || null);
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

        <Text style={styles.secao}>Treino pronto (cria um treino novo)</Text>
        <View style={styles.linha}>
          {DIVISOES.map((item) => (
            <Pressable
              key={item.nome}
              style={styles.chip}
              onPress={() => {
                divisaoNome.current = item.nome;
                setDivisaoAberta(item);
              }}
            >
              <Text style={styles.chipTexto}>{item.nome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.secao}>Fila de treinos do aluno</Text>
        <View style={styles.linha}>
          {treinos.map((t, i) => (
            <Pressable
              key={t.id}
              style={[styles.chip, t.id === selId && styles.chipAtivo]}
              onPress={() => setSelId(t.id)}
            >
              <Text style={[styles.chipTexto, t.id === selId && styles.chipTextoAtivo]}>
                {i + 1}. {t.nome}
                {t.id === proximoId ? ' ★' : ''}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.chip} onPress={() => novoTreino()}>
            <Text style={styles.chipTexto}>+ Novo</Text>
          </Pressable>
        </View>
        {proximoId && (
          <Text style={styles.sub}>
            ★ Próximo do aluno: {treinos.find((t) => t.id === proximoId)?.nome}
          </Text>
        )}

        {sel && (
          <>
            <TextInput
              style={styles.inputNome}
              value={sel.nome}
              onChangeText={renomear}
              placeholder="Nome do treino"
              placeholderTextColor={CORES.textoSecundario}
            />
            <View style={styles.linhaBotoes}>
              <Pressable style={styles.botaoPequeno} onPress={() => moverTreino(-1)}>
                <Text style={styles.botaoPequenoTexto}>Treino antes</Text>
              </Pressable>
              <Pressable style={styles.botaoPequeno} onPress={() => moverTreino(1)}>
                <Text style={styles.botaoPequenoTexto}>Treino depois</Text>
              </Pressable>
            </View>
          </>
        )}

        <Text style={styles.secao}>
          Adicionar por grupo muscular{sel ? ` em ${sel.nome}` : ''}
        </Text>
        <View style={styles.linha}>
          {GRUPOS.map((item) => (
            <Pressable key={item.nome} style={styles.chip} onPress={() => abrirGrupo(item.nome)}>
              <Text style={styles.chipTexto}>{item.nome}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.secao}>
          Exercícios{sel ? ` de ${sel.nome}` : ''} ({exercicios.length})
        </Text>

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
          <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar treinos'}</Text>
        </Pressable>

        {sel && (
          <Pressable style={styles.botaoRemoverTreino} onPress={removerEsteTreino}>
            <Text style={styles.textoRemover}>Remover este treino</Text>
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
        jaAdicionados={[]}
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
  chipAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  chipTextoAtivo: {
    color: CORES.textoSobreDestaque,
  },
  inputNome: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    color: CORES.texto,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 8,
    fontSize: 15,
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