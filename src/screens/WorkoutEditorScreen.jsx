import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ModalDivisao from '../components/SplitModal';
import ModalEditarExercicio from '../components/EditExerciseModal';
import ModalExercicios from '../components/ExercisesModal';
import { Cabecalho, Tela } from '../components/UI';
import { api } from '../utils/api';
import { avisar } from '../utils/notify';
import { DIVISOES } from '../utils/splits';
import { GRUPOS } from '../utils/muscleGroups';
import { P } from '../utils/theme';

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
      let respTreino = null;
      let respFicha = null;
      try {
        [respTreino, respFicha] = await Promise.all([
          api('GET', '/treinos-prescritos?aluno_id=' + aluno.id),
          api('GET', '/anamnese?aluno_id=' + aluno.id),
        ]);
      } catch (e) {
        console.log('Erro ao carregar', e);
        avisar('Erro', 'Não foi possível carregar os dados do aluno.');
      }

      const bruto = respTreino?.exercicios;
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
      setFicha(respFicha || null);
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

  // Devolve null se deu certo, ou o erro se falhou.
  async function gravar(lista) {
    const prox = lista.some((t) => t.id === proximoId) ? proximoId : lista[0].id;
    try {
      await api('PUT', '/treinos-prescritos', {
        aluno_id: aluno.id,
        exercicios: { treinos: lista, proximoId: prox },
      });
      setProximoId(prox);
      return null;
    } catch (e) {
      return e;
    }
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
    let error = null;
    if (resto.length === 0) {
      try {
        await api('DELETE', '/treinos-prescritos?aluno_id=' + aluno.id);
      } catch (e) {
        error = e;
      }
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
        <ActivityIndicator size="large" color={P.verde} />
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      <Tela>
        <Cabecalho
          titulo={`Treino de ${aluno.nome || 'aluno'}`}
          subtitulo="Monte e salve para o aluno ver"
          aoVoltar={aoVoltar}
        />

        {!ficha && (
          <View style={styles.avisoNeutro}>
            <Text style={styles.avisoNeutroTexto}>
              O aluno ainda não preencheu a ficha de saúde. Considere esperar antes de montar o
              treino.
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
              placeholderTextColor={P.textoSecundario}
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
          style={({ pressed }) => [
            styles.botaoSalvar,
            salvando && styles.desabilitado,
            pressed && styles.pressionado,
          ]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar treinos'}</Text>
        </Pressable>

        {sel && (
          <Pressable style={styles.botaoRemoverTreino} onPress={removerEsteTreino}>
            <Text style={[styles.textoRemover, styles.textoRemoverTreino]}>Remover este treino</Text>
          </Pressable>
        )}
      </Tela>

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
  raiz: { flex: 1, backgroundColor: P.fundo },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.fundo,
  },
  pressionado: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  sub: { fontSize: 13, color: P.textoSecundario, marginBottom: 4 },

  avisoRisco: {
    borderWidth: 2,
    borderColor: P.erro,
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
  },
  avisoRiscoTitulo: { fontSize: 15, fontWeight: '800', color: P.erro, marginBottom: 6 },
  avisoRiscoTexto: { fontSize: 14, lineHeight: 20, color: P.texto, marginTop: 2 },
  avisoNeutro: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
  },
  avisoNeutroTexto: { fontSize: 14, lineHeight: 20, color: P.textoSecundario },

  secao: { fontSize: 18, fontWeight: '700', color: P.texto, marginTop: 20, marginBottom: 12 },
  linha: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipTexto: { fontSize: 14, fontWeight: '700', color: P.texto },
  chipAtivo: { backgroundColor: P.verde },
  chipTextoAtivo: { color: P.textoSobreVerde },
  inputNome: {
    backgroundColor: P.cartao,
    borderRadius: 20,
    color: P.texto,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
  },
  vazio: { color: P.textoSecundario, marginTop: 4 },
  cartao: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
  },
  nome: { fontSize: 16, fontWeight: '800', color: P.texto },
  detalhe: { fontSize: 14, color: P.textoSecundario, marginTop: 2 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  botaoPequeno: {
    backgroundColor: P.fundo,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 6,
  },
  botaoPequenoTexto: { fontSize: 13, fontWeight: '700', color: P.texto },
  textoRemover: { color: P.erro },
  textoRemoverTreino: { fontSize: 14, fontWeight: '700' },
  botaoSalvar: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: P.limao,
  },
  botaoSalvarTexto: { fontSize: 16, fontWeight: '800', color: P.verde },
  desabilitado: { opacity: 0.6 },
  botaoRemoverTreino: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
});