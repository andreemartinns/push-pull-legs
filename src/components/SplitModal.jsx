import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { P } from '../utils/theme';

export default function ModalDivisao({ visivel, divisao, jaAdicionados, aoFechar, aoAdicionar }) {
  const exercicios = divisao ? divisao.exercicios : [];
  const faltando = exercicios.filter((item) => !jaAdicionados.includes(item.nome));

  function adicionarTodos() {
    if (faltando.length === 0) return;
    aoAdicionar(faltando);
    aoFechar();
  }

  function textoBotaoTodos() {
    if (faltando.length === 0) return 'Tudo adicionado';
    if (faltando.length === exercicios.length) return 'Adicionar treino completo';
    if (faltando.length === 1) return 'Adicionar o que falta';
    return `Adicionar os ${faltando.length} que faltam`;
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <Pressable style={styles.fundo} onPress={aoFechar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <View style={styles.titulo}>
            <View style={styles.barraTitulo} />
            <View style={styles.textosTitulo}>
              <Text style={styles.rotulo}>Treino</Text>
              <Text style={styles.nomeDivisao}>{divisao ? divisao.nome : ''}</Text>
              <Text style={styles.descricao}>{divisao ? divisao.descricao : ''}</Text>
            </View>
          </View>

          <ScrollView style={styles.lista}>
            {exercicios.map((item) => {
              const adicionado = jaAdicionados.includes(item.nome);

              return (
                <TouchableOpacity
                  key={item.nome}
                  style={styles.item}
                  disabled={adicionado}
                  onPress={() => aoAdicionar([item])}
                >
                  <View style={styles.textos}>
                    <Text style={[styles.textoItem, adicionado && styles.textoAdicionado]}>
                      {item.nome}
                    </Text>
                    <Text style={styles.grupo}>{item.grupo}</Text>
                  </View>

                  <View style={[styles.marca, adicionado && styles.marcaAtiva]}>
                    <Text style={[styles.textoMarca, adicionado && styles.textoMarcaAtiva]}>
                      {adicionado ? '✓' : '+'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.botaoTodos, faltando.length === 0 && styles.botaoTodosInativo]}
            disabled={faltando.length === 0}
            onPress={adicionarTodos}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoBotaoTodos,
                faltando.length === 0 && styles.textoBotaoTodosInativo,
              ]}
            >
              {textoBotaoTodos()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fechar} onPress={aoFechar}>
            <Text style={styles.textoFechar}>Fechar</Text>
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
    maxHeight: '85%',
  },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 14 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: P.verde, marginRight: 12 },
  textosTitulo: { flex: 1 },
  rotulo: { fontSize: 13, color: P.textoSecundario },
  nomeDivisao: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: P.texto,
    marginTop: 2,
  },
  descricao: { fontSize: 13, color: P.textoSecundario, marginTop: 2 },
  lista: { flexGrow: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  textos: { flex: 1, marginRight: 12 },
  textoItem: { fontSize: 16, fontWeight: '600', color: P.texto },
  textoAdicionado: { color: P.textoSecundario },
  grupo: { fontSize: 12, color: P.textoSecundario, marginTop: 2 },
  marca: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: P.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaAtiva: { backgroundColor: P.verde },
  textoMarca: { fontSize: 18, fontWeight: '700', color: P.texto, marginTop: -1 },
  textoMarcaAtiva: { fontSize: 14, color: P.limao },
  botaoTodos: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoTodosInativo: { backgroundColor: P.cartao },
  textoBotaoTodos: { fontSize: 15, fontWeight: '800', color: P.verde },
  textoBotaoTodosInativo: { color: P.textoSecundario },
  fechar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  textoFechar: { fontSize: 14, fontWeight: '700', color: P.textoSecundario },
});