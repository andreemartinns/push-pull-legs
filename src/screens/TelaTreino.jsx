import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BarraProgresso from '../components/BarraProgresso';
import Botao from '../components/Botao';
import CartaoExercicio from '../components/CartaoExercicio';
import { GRUPOS } from '../utils/grupos';
import { CORES } from '../utils/tema';

export default function TelaTreino({ usuario, aoSair }) {
  const [nome, setNome] = useState('');
  const [series, setSeries] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [grupo, setGrupo] = useState(GRUPOS[0].nome);
  const [exercicios, setExercicios] = useState([]);

  const concluidos = exercicios.filter((item) => item.concluido).length;

  function adicionarExercicio() {
    if (nome.trim() === '') return;

    const novoExercicio = {
      id: Date.now().toString(),
      nome: nome.trim(),
      series: series.trim(),
      repeticoes: repeticoes.trim(),
      grupo: grupo,
      concluido: false,
    };

    setExercicios([...exercicios, novoExercicio]);
    setNome('');
    setSeries('');
    setRepeticoes('');
  }

  function alternarConcluido(id) {
    setExercicios(
      exercicios.map((item) =>
        item.id === id ? { ...item, concluido: !item.concluido } : item
      )
    );
  }

  function removerExercicio(id) {
    setExercicios(exercicios.filter((item) => item.id !== id));
  }

  function limparConcluidos() {
    setExercicios(exercicios.filter((item) => !item.concluido));
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>Olá, {usuario.nome}</Text>
          <Text style={styles.titulo}>Meu Treino</Text>
        </View>
        <TouchableOpacity onPress={aoSair}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Supino reto"
        placeholderTextColor={CORES.textoSecundario}
        value={nome}
        onChangeText={setNome}
      />

      <View style={styles.grupos}>
        {GRUPOS.map((item) => (
          <TouchableOpacity
            key={item.nome}
            style={[
              styles.chip,
              grupo === item.nome && { backgroundColor: item.cor, borderColor: item.cor },
            ]}
            onPress={() => setGrupo(item.nome)}
          >
            <Text style={[styles.textoChip, grupo === item.nome && styles.textoChipAtivo]}>
              {item.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formulario}>
        <TextInput
          style={[styles.input, styles.inputPequeno]}
          placeholder="Séries"
          placeholderTextColor={CORES.textoSecundario}
          keyboardType="numeric"
          value={series}
          onChangeText={setSeries}
        />
        <TextInput
          style={[styles.input, styles.inputPequeno, styles.ultimoInput]}
          placeholder="Reps"
          placeholderTextColor={CORES.textoSecundario}
          keyboardType="numeric"
          value={repeticoes}
          onChangeText={setRepeticoes}
        />
      </View>

      <View style={styles.adicionar}>
        <Botao titulo="Adicionar" aoPressionar={adicionarExercicio} />
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
          />
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum exercício ainda</Text>
        }
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
  sair: {
    fontSize: 15,
    color: CORES.erro,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: CORES.texto,
    marginBottom: 12,
  },
  grupos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  textoChip: {
    fontSize: 14,
    color: CORES.texto,
  },
  textoChipAtivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formulario: {
    flexDirection: 'row',
    marginTop: 4,
  },
  inputPequeno: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  ultimoInput: {
    marginRight: 0,
  },
  adicionar: {
    marginBottom: 16,
  },
  limpar: {
    marginBottom: 16,
  },
  vazio: {
    fontSize: 16,
    color: CORES.textoSecundario,
  },
});