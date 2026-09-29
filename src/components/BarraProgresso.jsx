import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

export default function BarraProgresso({ total, concluidos }) {
  const porcentagem = total === 0 ? 0 : (concluidos / total) * 100;
  const completo = total > 0 && concluidos === total;

  return (
    <View style={styles.container}>
      <Text style={[styles.texto, completo && styles.textoCompleto]}>
        {completo
          ? 'Treino completo!'
          : `${concluidos} de ${total} concluídos`}
      </Text>
      <View style={styles.fundo}>
        <View style={[styles.preenchimento, { width: `${porcentagem}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  texto: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 8,
  },
  textoCompleto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  fundo: {
    height: 10,
    backgroundColor: CORES.borda,
    borderRadius: 5,
    overflow: 'hidden',
  },
  preenchimento: {
    height: 10,
    backgroundColor: CORES.destaque,
    borderRadius: 5,
  },
});