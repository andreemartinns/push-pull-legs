import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GRUPOS } from '../utils/grupos';

export default function CartaoExercicio({ exercicio, aoAlternar, aoRemover }) {
  const grupo = GRUPOS.find((g) => g.nome === exercicio.grupo);
  const cor = grupo ? grupo.cor : '#6B7A7F';
  const detalhe =
    exercicio.series && exercicio.repeticoes
      ? `${exercicio.series} x ${exercicio.repeticoes}`
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
            <View style={[styles.etiqueta, { backgroundColor: cor }]}>
              <Text style={styles.textoEtiqueta}>{exercicio.grupo}</Text>
            </View>
            {detalhe !== '' && <Text style={styles.detalhe}>{detalhe}</Text>}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={aoRemover}>
        <Text style={styles.remover}>Remover</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cartaoConcluido: {
    backgroundColor: '#E3EFE9',
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
    borderColor: '#0F4C5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  marcadorAtivo: {
    backgroundColor: '#0F4C5C',
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    color: '#1F2D30',
  },
  nomeConcluido: {
    textDecorationLine: 'line-through',
    color: '#6B7A7F',
  },
  linhaDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  etiqueta: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  textoEtiqueta: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detalhe: {
    fontSize: 13,
    color: '#6B7A7F',
  },
  remover: {
    color: '#C0392B',
    fontSize: 14,
    marginLeft: 10,
  },
});