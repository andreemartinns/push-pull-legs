import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';
import Botao from './Botao';

export default function ModalEditarExercicio({ visivel, exercicio, aoFechar, aoSalvar }) {
  const [series, setSeries] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [peso, setPeso] = useState('');

  useEffect(() => {
    if (exercicio) {
      setSeries(exercicio.series || '');
      setRepeticoes(exercicio.repeticoes || '');
      setPeso(exercicio.peso || '');
    }
  }, [exercicio]);

  function salvar() {
    aoSalvar(series.trim(), repeticoes.trim(), peso.trim());
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Editar {exercicio?.nome}</Text>

          <View style={styles.linha}>
            <View style={styles.campo}>
              <Text style={styles.rotulo}>Séries</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={series}
                onChangeText={setSeries}
                placeholder="3"
                placeholderTextColor={CORES.textoSecundario}
              />
            </View>
            <View style={styles.campo}>
              <Text style={styles.rotulo}>Repetições</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={repeticoes}
                onChangeText={setRepeticoes}
                placeholder="12"
                placeholderTextColor={CORES.textoSecundario}
              />
            </View>
          </View>

          <View style={styles.campoPeso}>
            <Text style={styles.rotulo}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={peso}
              onChangeText={setPeso}
              placeholder="Ex.: 20"
              placeholderTextColor={CORES.textoSecundario}
            />
          </View>

          <Botao titulo="Salvar" aoPressionar={salvar} />

          <TouchableOpacity style={styles.cancelar} onPress={aoFechar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 16,
  },
  linha: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  campo: {
    flex: 1,
    marginRight: 10,
  },
  campoPeso: {
    marginBottom: 20,
  },
  rotulo: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginBottom: 6,
  },
  input: {
    backgroundColor: CORES.fundo,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: CORES.texto,
  },
  cancelar: {
    alignItems: 'center',
    marginTop: 14,
  },
  textoCancelar: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
});