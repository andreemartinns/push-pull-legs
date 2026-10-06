import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BarraProgresso from '../components/BarraProgresso';
import Botao from '../components/Botao';
import CartaoExercicio from '../components/CartaoExercicio';
import ModalEditarExercicio from '../components/ModalEditarExercicio';
import ModalExercicios from '../components/ModalExercicios';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { GRUPOS } from '../utils/grupos';
import { CORES } from '../utils/tema';
import { carregarExerciciosAndamento, salvarExerciciosAndamento } from '../utils/armazenamento';

export default function TelaTreino({ usuario, aoSair, aoSalvarTreino, aoVerHistorico }) {
  const [exercicios, setExercicios] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [grupoModal, setGrupoModal] = useState(null);
  const [exercicioEditando, setExercicioEditando] = useState(null);
  const [temporizadorVisivel, setTemporizadorVisivel] = useState(false);
  const carregouInicial = useRef(false);

  const concluidos = exercicios.filter((item) => item.concluido).length;

  useEffect(() => {
    async function carregar() {
      const salvos = await carregarExerciciosAndamento();
      setExercicios(salvos);
      carregouInicial.current = true;
    }
    carregar();
  }, []);

  useEffect(() => {
    if (carregouInicial.current) {
      salvarExerciciosAndamento(exercicios);
    }
  }, [exercicios]);

  useEffect(() => {
    if (exercicios.length > 0 && concluidos === exercicios.length) {
      aoSalvarTreino(exercicios);
      setExercicios([]);
    }
  }, [concluidos]);

  function abrirModal(nomeGrupo) {
    setGrupoModal(nomeGrupo);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
  }

  function adicionarExercicio(nomeExercicio) {
    const novoExercicio = {
      id: Date.now().toString(),
      nome: nomeExercicio,
      series: '3',
      repeticoes: '12',
      peso: '',
      grupo: grupoModal,
      concluido: false,
    };

    setExercicios([...exercicios, novoExercicio]);
    setModalVisivel(false);
  }

  function alternarConcluido(id) {
    const exercicio = exercicios.find((item) => item.id === id);
    const vaiConcluir = !exercicio.concluido;

    setExercicios(
      exercicios.map((item) =>
        item.id === id ? { ...item, concluido: vaiConcluir } : item
      )
    );

    if (vaiConcluir) {
      setTemporizadorVisivel(true);
    }
  }

  function removerExercicio(id) {
    setExercicios(exercicios.filter((item) => item.id !== id));
  }

  function limparConcluidos() {
    setExercicios(exercicios.filter((item) => !item.concluido));
  }

  function abrirEdicao(exercicio) {
    setExercicioEditando(exercicio);
  }

  function fecharEdicao() {
    setExercicioEditando(null);
  }

  function salvarEdicao(novasSeries, novasRepeticoes, novoPeso) {
    setExercicios(
      exercicios.map((item) =>
        item.id === exercicioEditando.id
          ? { ...item, series: novasSeries, repeticoes: novasRepeticoes, peso: novoPeso }
          : item
      )
    );
    setExercicioEditando(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>Olá, {usuario.nome}</Text>
          <Text style={styles.titulo}>Meu Treino</Text>
        </View>
        <View style={styles.acoesCabecalho}>
          <TouchableOpacity onPress={aoVerHistorico}>
            <Text style={styles.historico}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={aoSair}>
            <Text style={styles.sair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.instrucao}>Escolha um grupo muscular para ver os exercícios</Text>

      <View style={styles.grupos}>
        {GRUPOS.map((item) => (
          <TouchableOpacity
            key={item.nome}
            style={[styles.chip, { borderColor: item.cor }]}
            onPress={() => abrirModal(item.nome)}
          >
            <Text style={[styles.textoChip, { color: item.cor }]}>{item.nome}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {exercicios.length > 0 && (
        <BarraProgresso total={exercicios.length} concluidos={concluidos} />
      )}

      {concluidos > 0 && (
        <View style={styles.limpar}>
          <Botao
            titulo="Limpar concluídos"
            aoPressionar={limparConcluidos}
            cor={CORES.erro}
          />
        </View>
      )}

      <FlatList
        data={exercicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartaoExercicio
            exercicio={item}
            aoAlternar={() => alternarConcluido(item.id)}
            aoRemover={() => removerExercicio(item.id)}
            aoEditar={() => abrirEdicao(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum exercício ainda. Toque em um grupo acima para começar.</Text>
        }
      />

      <ModalExercicios
        visivel={modalVisivel}
        grupo={grupoModal}
        aoFechar={fecharModal}
        aoSelecionar={adicionarExercicio}
      />

      <ModalEditarExercicio
        visivel={exercicioEditando !== null}
        exercicio={exercicioEditando}
        aoFechar={fecharEdicao}
        aoSalvar={salvarEdicao}
      />

      <TemporizadorDescanso
        visivel={temporizadorVisivel}
        aoFechar={() => setTemporizadorVisivel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: CORES.fundo,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  saudacao: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.destaque,
  },
  acoesCabecalho: {
    alignItems: 'flex-end',
  },
  historico: {
    fontSize: 14,
    color: CORES.destaque,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sair: {
    fontSize: 15,
    color: CORES.erro,
    fontWeight: 'bold',
  },
  instrucao: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 12,
  },
  grupos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1.5,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  textoChip: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  limpar: {
    marginBottom: 16,
  },
  vazio: {
    fontSize: 16,
    color: CORES.textoSecundario,
  },
});