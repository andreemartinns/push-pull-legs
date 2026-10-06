import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EXERCICIOS_POR_GRUPO } from '../utils/exercicios';
import { CORES } from '../utils/tema';

export default function ModalExercicios({ visivel, grupo, aoFechar, aoSelecionar }) {
  const [nomePersonalizado, setNomePersonalizado] = useState('');

  const exercicios = grupo ? EXERCICIOS_POR_GRUPO[grupo] || [] : [];

  function selecionar(nome) {
    aoSelecionar(nome);
    setNomePersonalizado('');
  }

  function adicionarPersonalizado() {
    if (nomePersonalizado.trim() === '') return;
    selecionar(nomePersonalizado.trim());
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Exercícios de {grupo}</Text>

          <ScrollView>
            {exercicios.map((item) => (
              <TouchableOpacity key={item} style={styles.item} onPress={() => selecionar(item)}>
                <Text style={styles.textoItem}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.personalizado}>
            <TextInput
              style={styles.input}
              placeholder="Outro exercício"
              placeholderTextColor={CORES.textoSecundario}
              value={nomePersonalizado}
              onChangeText={setNomePersonalizado}
            />
            <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarPersonalizado}>
              <Text style={styles.textoBotaoAdicionar}>+</Text>
            </TouchableOpacity>
          </View>

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
    maxHeight: '80%',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 16,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  textoItem: {
    fontSize: 16,
    color: CORES.texto,
  },
  personalizado: {
    flexDirection: 'row',
    marginTop: 16,
  },
  input: {
    flex: 1,
    backgroundColor: CORES.fundo,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: CORES.texto,
    marginRight: 10,
  },
  botaoAdicionar: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoAdicionar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  cancelar: {
    alignItems: 'center',
    marginTop: 16,
  },
  textoCancelar: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
});