import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';
import Logo from './Logo';

// Tamanho do cartão em pontos. Na captura vira 1080x1920 (3x), formato de stories.
export const LARGURA_CARTAO = 360;
export const ALTURA_CARTAO = 640;

const MAXIMO_LINHAS = 6;

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
      <View style={styles.faixa} />

      <View style={styles.conteudo}>
        <View style={styles.marca}>
          <Logo tamanho={44} style={styles.logo} />
          <View style={styles.nomeMarca}>
            <Text style={styles.academia}>Academia</Text>
            <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
          </View>
        </View>

        <View style={styles.titulo}>
          <View style={styles.barraTitulo} />
          <View style={styles.textosTitulo}>
            <Text style={styles.rotulo}>{divisao ? `Treino ${divisao}` : 'Treino'}</Text>
            <Text style={styles.concluido}>Concluído</Text>
            <Text style={styles.data}>{data}</Text>
          </View>
        </View>

        <View style={styles.numeros}>
          {numeros.map((item, indice) => (
            <View key={item.rotulo} style={[styles.numero, indice > 0 && styles.numeroDivisor]}>
              <Text style={[styles.valor, item.destaque && styles.valorDestaque]}>
                {item.valor}
              </Text>
              <Text style={styles.rotuloNumero}>{item.rotulo}</Text>
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
                <Text style={styles.check}>✓</Text>
              </View>
              <Text style={styles.nomeExercicio} numberOfLines={1}>
                {exercicio.nome}
              </Text>
              {nomesRecorde.includes(exercicio.nome) && (
                <View style={styles.etiqueta}>
                  <Text style={styles.textoEtiqueta}>Recorde</Text>
                </View>
              )}
              {exercicio.peso ? (
                <Text style={styles.peso}>{exercicio.peso} kg</Text>
              ) : null}
            </View>
          ))}
        </View>

        {restantes > 0 && (
          <Text style={styles.restantes}>
            + {restantes} {restantes === 1 ? 'exercício' : 'exercícios'}
          </Text>
        )}

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
    backgroundColor: CORES.fundo,
    overflow: 'hidden',
  },
  faixa: {
    height: 8,
    backgroundColor: CORES.destaque,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
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
    fontStyle: 'italic',
    color: CORES.textoSecundario,
  },
  nomeAcademia: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 24,
  },
  barraTitulo: {
    width: 5,
    borderRadius: 2,
    backgroundColor: CORES.destaque,
    marginRight: 12,
  },
  textosTitulo: {
    flex: 1,
  },
  rotulo: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  concluido: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  data: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginTop: 4,
  },
  numeros: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  numero: {
    flex: 1,
  },
  numeroDivisor: {
    borderLeftWidth: 1,
    borderLeftColor: CORES.borda,
    paddingLeft: 14,
  },
  valor: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  valorDestaque: {
    color: CORES.destaque,
  },
  rotuloNumero: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 2,
  },
  lista: {
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  linhaUltima: {
    borderBottomWidth: 0,
  },
  marcaCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: CORES.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  check: {
    fontSize: 11,
    fontWeight: 'bold',
    color: CORES.textoSobreDestaque,
  },
  nomeExercicio: {
    flex: 1,
    fontSize: 14,
    color: CORES.texto,
    marginRight: 8,
  },
  etiqueta: {
    backgroundColor: CORES.destaque,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 8,
  },
  textoEtiqueta: {
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  peso: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  restantes: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 8,
  },
  espaco: {
    flex: 1,
  },
  rodape: {
    fontSize: 12,
    fontStyle: 'italic',
    color: CORES.textoSecundario,
    textAlign: 'center',
  },
});