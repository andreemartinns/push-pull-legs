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
import { EXERCICIOS_POR_GRUPO } from '../utils/exercises';
import { P } from '../utils/theme';

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
              placeholderTextColor={P.textoSecundario}
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
  fundo: { flex: 1, backgroundColor: 'rgba(11, 31, 23, 0.55)', justifyContent: 'flex-end' },
  cartao: {
    backgroundColor: P.fundo,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 18 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: P.verde, marginRight: 12 },
  textosTitulo: { flex: 1 },
  rotulo: { fontSize: 13, color: P.textoSecundario },
  nomeGrupo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: P.texto, marginTop: 2 },
  novo: { flexDirection: 'row', marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: P.texto,
    marginRight: 10,
  },
  botaoAdicionar: {
    backgroundColor: P.limao,
    borderRadius: 999,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoAdicionar: { fontSize: 24, fontWeight: '700', color: P.verde },
  lista: { flexGrow: 0 },
  item: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: P.pontoVazio },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  areaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  textoItem: { fontSize: 16, fontWeight: '600', color: P.texto },
  etiqueta: {
    backgroundColor: P.verde,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 10,
  },
  textoEtiqueta: { fontSize: 11, fontWeight: '800', color: P.limao },
  botaoApagar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(194,59,59,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  apagarAtivo: { opacity: 0.6 },
  textoApagar: { fontSize: 18, fontWeight: '700', color: P.erro, marginTop: -2 },
  cancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  textoCancelar: { fontSize: 14, fontWeight: '700', color: P.textoSecundario },
});