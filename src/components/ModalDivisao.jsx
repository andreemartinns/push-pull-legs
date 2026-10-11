import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

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
    maxHeight: '85%',
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
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
  nomeDivisao: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginTop: 2,
  },
  descricao: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  lista: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  textos: {
    flex: 1,
    marginRight: 12,
  },
  textoItem: {
    fontSize: 16,
    color: CORES.texto,
  },
  textoAdicionado: {
    color: CORES.textoSecundario,
  },
  grupo: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  marca: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoMarca: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.texto,
    marginTop: -1,
  },
  textoMarcaAtiva: {
    fontSize: 14,
    color: CORES.textoSobreDestaque,
  },
  botaoTodos: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoTodosInativo: {
    backgroundColor: CORES.borda,
  },
  textoBotaoTodos: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  textoBotaoTodosInativo: {
    color: CORES.textoSecundario,
  },
  fechar: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  textoFechar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
});