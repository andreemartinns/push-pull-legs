import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GraficoEvolucao from '../components/GraficoEvolucao';
import { GRUPOS } from '../utils/grupos';
import { CORES } from '../utils/tema';
import { listarExerciciosComPeso, obterEvolucao } from '../utils/evolucao';

export default function TelaHistorico({ historico, aoVoltar }) {
  const [aba, setAba] = useState('historico');
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);

  const exerciciosComPeso = listarExerciciosComPeso(historico);
  const pontosEvolucao = exercicioSelecionado
    ? obterEvolucao(historico, exercicioSelecionado)
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={aoVoltar}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Histórico</Text>
      </View>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'historico' && styles.abaAtiva]}
          onPress={() => setAba('historico')}
        >
          <Text style={[styles.textoAba, aba === 'historico' && styles.textoAbaAtiva]}>
            Treinos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aba, aba === 'evolucao' && styles.abaAtiva]}
          onPress={() => setAba('evolucao')}
        >
          <Text style={[styles.textoAba, aba === 'evolucao' && styles.textoAbaAtiva]}>
            Evolução
          </Text>
        </TouchableOpacity>
      </View>

      {aba === 'historico' && (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cartaoTreino}>
              <Text style={styles.data}>{item.data}</Text>
              {item.exercicios.map((exercicio) => {
                const grupo = GRUPOS.find((g) => g.nome === exercicio.grupo);
                const cor = grupo ? grupo.cor : CORES.textoSecundario;
                const detalhe =
                  exercicio.series && exercicio.repeticoes
                    ? `${exercicio.series} x ${exercicio.repeticoes}`
                    : '';
                const peso = exercicio.peso ? `${exercicio.peso} kg` : '';

                return (
                  <View key={exercicio.id} style={styles.linhaExercicio}>
                    <View style={[styles.etiqueta, { backgroundColor: cor }]}>
                      <Text style={styles.textoEtiqueta}>{exercicio.grupo}</Text>
                    </View>
                    <Text style={styles.nomeExercicio}>{exercicio.nome}</Text>
                    <Text style={styles.detalheExercicio}>
                      {detalhe}
                      {peso !== '' ? ` · ${peso}` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhum treino concluído ainda. Finalize um treino para ele aparecer aqui.
            </Text>
          }
        />
      )}

      {aba === 'evolucao' && (
        <View style={styles.evolucaoContainer}>
          {exerciciosComPeso.length === 0 ? (
            <Text style={styles.vazio}>
              Registre o peso de algum exercício para ver a evolução aqui.
            </Text>
          ) : (
            <>
              <Text style={styles.instrucao}>Escolha um exercício</Text>
              <View style={styles.listaExercicios}>
                {exerciciosComPeso.map((nome) => (
                  <TouchableOpacity
                    key={nome}
                    style={[
                      styles.chipExercicio,
                      exercicioSelecionado === nome && styles.chipExercicioAtivo,
                    ]}
                    onPress={() => setExercicioSelecionado(nome)}
                  >
                    <Text
                      style={[
                        styles.textoChipExercicio,
                        exercicioSelecionado === nome && styles.textoChipExercicioAtivo,
                      ]}
                    >
                      {nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {exercicioSelecionado && <GraficoEvolucao pontos={pontosEvolucao} />}
            </>
          )}
        </View>
      )}
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
    marginBottom: 16,
  },
  voltar: {
    fontSize: 15,
    color: CORES.destaque,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.destaque,
  },
  abas: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aba: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 10,
  },
  abaAtiva: {
    borderBottomColor: CORES.destaque,
  },
  textoAba: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  textoAbaAtiva: {
    color: CORES.destaque,
    fontWeight: 'bold',
  },
  cartaoTreino: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  data: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 10,
  },
  linhaExercicio: {
    marginBottom: 8,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  textoEtiqueta: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nomeExercicio: {
    fontSize: 15,
    color: CORES.texto,
  },
  detalheExercicio: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  vazio: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginTop: 20,
  },
  evolucaoContainer: {
    flex: 1,
  },
  instrucao: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 10,
  },
  listaExercicios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chipExercicio: {
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipExercicioAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoChipExercicio: {
    fontSize: 13,
    color: CORES.texto,
  },
  textoChipExercicioAtivo: {
    color: CORES.textoSobreDestaque,
    fontWeight: 'bold',
  },
});