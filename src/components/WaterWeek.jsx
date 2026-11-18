import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { P } from '../utils/theme';

const ALTURA_BARRA = 96;
const AZUL_HOJE = '#1C8FD0';
const AZUL_PASSADO = '#9CCBE6';

// Gráfico dos últimos 7 dias. Cada barra é o quanto da meta foi bebido.
// dias: [{ letra, hoje, batida, proporcao }]
export default function SemanaAgua({ dias, sequencia }) {
  const batidos = dias.filter((d) => d.batida).length;

  return (
    <View style={styles.cartao}>
      <View style={styles.topo}>
        <Text style={styles.resumo}>
          Meta batida em <Text style={styles.resumoForte}>{batidos}</Text> de 7 dias
        </Text>

        <View style={styles.pilula}>
          <Ionicons name="flame" size={14} color={P.verde} />
          <Text style={styles.textoPilula}>
            {sequencia} {sequencia === 1 ? 'dia' : 'dias'}
          </Text>
        </View>
      </View>

      <View style={styles.barras}>
        {dias.map((dia, indice) => {
          const cor = dia.batida ? P.verde : dia.hoje ? AZUL_HOJE : AZUL_PASSADO;
          const altura = dia.proporcao > 0 ? Math.max(8, Math.round(dia.proporcao * ALTURA_BARRA)) : 0;

          return (
            <View key={indice} style={styles.coluna}>
              <View style={styles.trilha}>
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: altura }}
                  transition={{ type: 'timing', duration: 600, delay: indice * 70 }}
                  style={[styles.barra, { backgroundColor: cor }]}
                />
                {dia.batida && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color={P.limao} />
                  </View>
                )}
              </View>

              <Text style={[styles.letra, dia.hoje && styles.letraHoje]}>{dia.letra}</Text>
              {dia.hoje && <View style={styles.pontoHoje} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  resumo: {
    fontSize: 13,
    color: P.textoSecundario,
    flex: 1,
    paddingRight: 8,
  },
  resumoForte: {
    fontWeight: '800',
    color: P.texto,
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoPilula: {
    fontSize: 12,
    fontWeight: '800',
    color: P.verde,
    marginLeft: 4,
  },
  barras: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coluna: {
    alignItems: 'center',
    flex: 1,
  },
  trilha: {
    width: 26,
    height: ALTURA_BARRA,
    borderRadius: 13,
    backgroundColor: P.fundo,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barra: {
    width: '100%',
    borderRadius: 13,
  },
  check: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  letra: {
    fontSize: 12,
    fontWeight: '700',
    color: P.textoSecundario,
    marginTop: 8,
  },
  letraHoje: {
    color: P.verde,
    fontWeight: '800',
  },
  pontoHoje: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: P.verde,
    marginTop: 4,
  },
});