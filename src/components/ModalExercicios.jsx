import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EXERCICIOS_POR_GRUPO } from '../utils/exercicios';
import { CORES } from '../utils/tema';

// Tira maiúsculas, acentos e espaços sobrando, para comparar nomes.
function normalizar(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export default function ModalExercicios({
  visivel,
  grupo,
  personalizados = [],
  aoFechar,
  aoSelecionar,
  aoCriar,
  aoApagar,
}) {
  const [nomeNovo, setNomeNovo] = useState('');

  const padrao = grupo ? EXERCICIOS_POR_GRUPO[grupo] || [] : [];
  const meus = personalizados.filter((item) => item.grupo === grupo);

  function selecionar(nome) {
    aoSelecionar(nome);
    setNomeNovo('');
  }

  function adicionarNovo() {
    const limpo = nomeNovo.trim().replace(/\s+/g, ' ');
    if (limpo === '') return;

    const formatado = limpo.charAt(0).toUpperCase() + limpo.slice(1);
    const chave = normalizar(formatado);

    // Se já existe (na lista padrão ou entre os seus), usa o que já existe.
    const existente = [...padrao, ...meus.map((item) => item.nome)].find(
      (nome) => normalizar(nome) === chave
    );

    if (existente) {
      selecionar(existente);
      return;
    }

    aoCriar(formatado);
    setNomeNovo('');
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Exercícios de {grupo}</Text>

          <View style={styles.novo}>
            <TextInput
              style={styles.input}
              placeholder="Criar um exercício novo"
              placeholderTextColor={CORES.textoSecundario}
              value={nomeNovo}
              onChangeText={setNomeNovo}
              onSubmitEditing={adicionarNovo}
              maxLength={50}
            />
            <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarNovo}>
              <Text style={styles.textoBotaoAdicionar}>+</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {meus.map((item) => (
              <View key={item.id} style={styles.itemLinha}>
                <TouchableOpacity
                  style={styles.areaItem}
                  onPress={() => selecionar(item.nome)}
                >
                  <Text style={styles.textoItem}>{item.nome}</Text>
                  <View style={styles.etiqueta}>
                    <Text style={styles.textoEtiqueta}>Seu</Text>
                  </View>
                </TouchableOpacity>

                <Pressable
                  onPress={() => aoApagar(item.id)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.botaoApagar, pressed && styles.apagarAtivo]}
                >
                  <Text style={styles.textoApagar}>×</Text>
                </Pressable>
              </View>
            ))}

            {padrao.map((item) => (
              <TouchableOpacity key={item} style={styles.item} onPress={() => selecionar(item)}>
                <Text style={styles.textoItem}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
  novo: {
    flexDirection: 'row',
    marginBottom: 8,
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
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  areaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  textoItem: {
    fontSize: 16,
    color: CORES.texto,
  },
  etiqueta: {
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 10,
  },
  textoEtiqueta: {
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.textoSobreDestaque,
  },
  botaoApagar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  apagarAtivo: {
    opacity: 0.6,
  },
  textoApagar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e57373',
    marginTop: -2,
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