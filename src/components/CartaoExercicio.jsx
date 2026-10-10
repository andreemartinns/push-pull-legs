import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function CartaoExercicio({
  exercicio,
  ultimaCarga,
  novoRecorde,
  aoAlternar,
  aoRemover,
  aoEditar,
}) {
  const detalhe =
    exercicio.series && exercicio.repeticoes
      ? `${exercicio.series} x ${exercicio.repeticoes}`
      : '';
  const peso = exercicio.peso ? `${exercicio.peso} kg` : '';

  const textoUltima = ultimaCarga
    ? `Última vez: ${ultimaCarga.peso} kg` +
      (ultimaCarga.series && ultimaCarga.repeticoes
        ? ` (${ultimaCarga.series} x ${ultimaCarga.repeticoes})`
        : '')
    : '';

  return (
    <View style={[styles.cartao, exercicio.concluido && styles.cartaoConcluido]}>
      <TouchableOpacity style={styles.area} onPress={aoAlternar}>
        <View style={[styles.marcador, exercicio.concluido && styles.marcadorAtivo]}>
          {exercicio.concluido && <Text style={styles.check}>✓</Text>}
        </View>

        <View style={styles.textos}>
          <Text style={[styles.nome, exercicio.concluido && styles.nomeConcluido]}>
            {exercicio.nome}
          </Text>
          <View style={styles.linhaDetalhes}>
            <View style={styles.etiqueta}>
              <Text style={styles.textoEtiqueta}>{exercicio.grupo}</Text>
            </View>
            {detalhe !== '' && <Text style={styles.detalhe}>{detalhe}</Text>}
            {peso !== '' && <Text style={styles.peso}>{peso}</Text>}
          </View>

          {textoUltima !== '' && (
            <Text style={styles.ultimaCarga}>{textoUltima}</Text>
          )}

          {novoRecorde && (
            <View style={styles.selo}>
              <Text style={styles.textoSelo}>Novo recorde</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.acoes}>
        <TouchableOpacity onPress={aoEditar}>
          <Text style={styles.editar}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={aoRemover}>
          <Text style={styles.remover}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cartaoConcluido: {
    borderColor: CORES.destaque,
    opacity: 0.7,
  },
  area: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CORES.textoSecundario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  marcadorAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  check: {
    color: CORES.textoSobreDestaque,
    fontSize: 14,
    fontWeight: 'bold',
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    color: CORES.texto,
  },
  nomeConcluido: {
    textDecorationLine: 'line-through',
    color: CORES.textoSecundario,
  },
  linhaDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  etiqueta: {
    backgroundColor: CORES.borda,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  textoEtiqueta: {
    color: CORES.texto,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detalhe: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginRight: 8,
  },
  peso: {
    fontSize: 13,
    color: CORES.texto,
    fontWeight: 'bold',
  },
  ultimaCarga: {
    fontSize: 12,
    color: CORES.textoSecundario,
    fontStyle: 'italic',
  },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  textoSelo: {
    color: CORES.textoSobreDestaque,
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  editar: {
    color: CORES.texto,
    fontSize: 14,
    marginRight: 14,
  },
  remover: {
    color: CORES.textoSecundario,
    fontSize: 14,
  },
});