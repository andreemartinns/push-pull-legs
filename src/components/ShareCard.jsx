import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { P } from '../utils/theme';
import Logo from './Logo';

// Tamanho do cartão em pontos. Na captura vira 1080x1920 (3x), formato de stories.
export const LARGURA_CARTAO = 360;
export const ALTURA_CARTAO = 640;

const MAXIMO_LINHAS = 5;
const VERDE_CLARO = '#14573F';
const CREME = '#F1EFE4';

// A imagem que vai para os stories. Fica escondida fora da tela e só é "fotografada".
export default function CartaoCompartilhar({
  divisao,
  data,
  numeros = [],
  exercicios = [],
  nomesRecorde = [],
}) {
  const visiveis = exercicios.slice(0, MAXIMO_LINHAS);
  const restantes = exercicios.length - visiveis.length;

  return (
    <View style={styles.cartao}>
      <View style={styles.circuloGrande} />
      <View style={styles.circuloPequeno} />

      <View style={styles.conteudo}>
        <View style={styles.marca}>
          <Logo tamanho={48} style={styles.logo} animado={false} pulsar={false} />
          <View style={styles.nomeMarca}>
            <Text style={styles.academia}>Academia</Text>
            <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
          </View>
        </View>

        <View style={styles.pilula}>
          <Text style={styles.textoPilula}>{divisao ? `TREINO ${divisao}` : 'TREINO'}</Text>
        </View>
        <Text style={styles.concluido}>CONCLUÍDO</Text>
        <Text style={styles.data}>{data}</Text>

        <View style={styles.numeros}>
          {numeros.map((item, indice) => (
            <View
              key={item.rotulo}
              style={[
                styles.numero,
                indice > 0 && styles.numeroEspaco,
                item.destaque && styles.numeroDestaque,
              ]}
            >
              <Text style={[styles.valor, item.destaque && styles.valorDestaque]}>
                {item.valor}
              </Text>
              <Text style={[styles.rotuloNumero, item.destaque && styles.rotuloDestaque]}>
                {item.rotulo}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.lista}>
          {visiveis.map((exercicio, indice) => (
            <View
              key={exercicio.id ?? indice}
              style={[styles.linha, indice === visiveis.length - 1 && styles.linhaUltima]}
            >
              <View style={styles.marcaCheck}>
                <Ionicons name="checkmark" size={13} color={P.limao} />
              </View>
              <Text style={styles.nomeExercicio} numberOfLines={1}>
                {exercicio.nome}
              </Text>
              {nomesRecorde.includes(exercicio.nome) && (
                <View style={styles.etiqueta}>
                  <Text style={styles.textoEtiqueta}>RECORDE</Text>
                </View>
              )}
              {exercicio.peso ? <Text style={styles.peso}>{exercicio.peso} kg</Text> : null}
            </View>
          ))}

          {restantes > 0 && (
            <Text style={styles.restantes}>
              + {restantes} {restantes === 1 ? 'exercício' : 'exercícios'}
            </Text>
          )}
        </View>

        <View style={styles.espaco} />

        <Text style={styles.rodape}>Treino registrado no Ritmo Brasil</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    width: LARGURA_CARTAO,
    height: ALTURA_CARTAO,
    backgroundColor: P.verde,
    overflow: 'hidden',
  },
  circuloGrande: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: VERDE_CLARO,
  },
  circuloPequeno: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: VERDE_CLARO,
    opacity: 0.6,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 22,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  logo: {
    alignSelf: 'auto',
    marginBottom: 0,
  },
  nomeMarca: {
    marginLeft: 10,
  },
  academia: {
    fontSize: 11,
    fontWeight: '600',
    color: CREME,
    opacity: 0.8,
  },
  nomeAcademia: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 22,
    lineHeight: 24,
    color: CREME,
  },
  pilula: {
    alignSelf: 'flex-start',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoPilula: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.verde,
  },
  concluido: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 72,
    lineHeight: 74,
    color: CREME,
    marginTop: 6,
  },
  data: {
    fontSize: 13,
    fontWeight: '600',
    color: CREME,
    opacity: 0.8,
    marginTop: 2,
    marginBottom: 18,
  },
  numeros: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  numero: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  numeroEspaco: {
    marginLeft: 8,
  },
  numeroDestaque: {
    backgroundColor: P.limao,
  },
  valor: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 40,
    lineHeight: 42,
    color: CREME,
  },
  valorDestaque: {
    color: P.verde,
  },
  rotuloNumero: {
    fontSize: 12,
    fontWeight: '600',
    color: CREME,
    opacity: 0.85,
    marginTop: 2,
  },
  rotuloDestaque: {
    color: P.verde,
    opacity: 1,
  },
  lista: {
    backgroundColor: P.cartao,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: P.pontoVazio,
  },
  linhaUltima: {
    borderBottomWidth: 0,
  },
  marcaCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: P.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nomeExercicio: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: P.texto,
    marginRight: 8,
  },
  etiqueta: {
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  textoEtiqueta: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: P.verde,
  },
  peso: {
    fontSize: 13,
    fontWeight: '800',
    color: P.verde,
  },
  restantes: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textoSecundario,
    paddingTop: 4,
    paddingBottom: 8,
  },
  espaco: {
    flex: 1,
  },
  rodape: {
    fontSize: 12,
    fontWeight: '600',
    color: CREME,
    opacity: 0.8,
    textAlign: 'center',
  },
});