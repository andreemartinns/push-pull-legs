import { StyleSheet, Text, View } from 'react-native';

export default function BarraProgresso({ total, concluidos }) {
  const porcentagem = total === 0 ? 0 : (concluidos / total) * 100;
  const completo = total > 0 && concluidos === total;

  return (
    <View style={styles.container}>
      <Text style={[styles.texto, completo && styles.textoCompleto]}>
        {completo
          ? 'Treino completo! '
          : `${concluidos} de ${total} concluídos`}
      </Text>
      <View style={styles.fundo}>
        <View
          style={[
            styles.preenchimento,
            { width: `${porcentagem}%` },
            completo && styles.preenchimentoCompleto,
          ]}
        />
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
    color: '#1F2D30',
    marginBottom: 8,
  },
  textoCompleto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E9E6B',
  },
  fundo: {
    height: 10,
    backgroundColor: '#D5DDD8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  preenchimento: {
    height: 10,
    backgroundColor: '#2E9E6B',
    borderRadius: 5,
  },
  preenchimentoCompleto: {
    backgroundColor: '#0F4C5C',
  },
});