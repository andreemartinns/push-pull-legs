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
      <Pressable style={styles.fundo} onPress={aoFechar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <View style={styles.titulo}>
            <View style={styles.barraTitulo} />
            <View style={styles.textosTitulo}>
              <Text style={styles.rotulo}>Exercícios</Text>
              <Text style={styles.nomeGrupo}>{grupo}</Text>
            </View>
          </View>

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

          <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
            {meus.map((item) => (
              <View key={item.id} style={styles.itemLinha}>
                <TouchableOpacity style={styles.areaItem} onPress={() => selecionar(item.nome)}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: CORES.borda,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18,
  },
  barraTitulo: {
    width: 4,
    borderRadius: 2,
    backgroundColor: CORES.destaque,
    marginRight: 10,
  },
  textosTitulo: {
    flex: 1,
  },
  rotulo: {
    fontSize: 12,
    color: CORES.textoSecundario,
  },
  nomeGrupo: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginTop: 2,
  },
  novo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: CORES.fundo,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
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
  lista: {
    flexGrow: 0,
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
    borderRadius: 8,
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
    paddingVertical: 12,
    marginTop: 8,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
});