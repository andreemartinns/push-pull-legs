import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Treino {divisao ? divisao.nome : ''}</Text>
          <Text style={styles.descricao}>{divisao ? divisao.descricao : ''}</Text>

          <ScrollView>
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
                  <Text style={adicionado ? styles.estadoAdicionado : styles.estadoAdicionar}>
                    {adicionado ? 'Adicionado' : 'Adicionar'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.botaoTodos, faltando.length === 0 && styles.botaoTodosInativo]}
            disabled={faltando.length === 0}
            onPress={adicionarTodos}
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
    maxHeight: '85%',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  descricao: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginTop: 2,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  textos: {
    flex: 1,
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
  estadoAdicionar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  estadoAdicionado: {
    fontSize: 14,
    color: CORES.textoSecundario,
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
    marginTop: 16,
  },
  textoFechar: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
});