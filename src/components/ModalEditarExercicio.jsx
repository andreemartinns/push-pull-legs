import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CORES } from '../utils/tema';

// Converte "12,5" ou "12.5" em número. Se não for número, devolve 0.
function paraNumero(valor) {
  const numero = Number(String(valor || '').replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

// Devolve o número como texto, com vírgula (ex: 12,5).
function formatar(numero) {
  return String(Math.round(numero * 100) / 100).replace('.', ',');
}

// Uma linha do formulário: rótulo à esquerda, − número + à direita.
function Campo({ rotulo, valor, aoMudar, passo, unidade, decimal, ultimo }) {
  function mudar(delta) {
    const novo = Math.max(0, paraNumero(valor) + delta);
    aoMudar(novo === 0 ? '' : formatar(novo));
  }

  return (
    <View style={[styles.campo, !ultimo && styles.campoEspaco]}>
      <Text style={styles.rotuloCampo}>{rotulo}</Text>

      <View style={styles.controles}>
        <TouchableOpacity style={styles.botaoMudar} onPress={() => mudar(-passo)}>
          <Text style={styles.textoMudar}>−</Text>
        </TouchableOpacity>

        <View style={styles.valor}>
          <TextInput
            style={styles.input}
            value={valor}
            onChangeText={aoMudar}
            placeholder="0"
            placeholderTextColor={CORES.textoSecundario}
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            selectTextOnFocus
            maxLength={6}
          />
          {unidade ? <Text style={styles.unidade}>{unidade}</Text> : null}
        </View>

        <TouchableOpacity style={styles.botaoMudar} onPress={() => mudar(passo)}>
          <Text style={styles.textoMudar}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ModalEditarExercicio({ visivel, exercicio, aoFechar, aoSalvar }) {
  const [series, setSeries] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [peso, setPeso] = useState('');

  // Cada vez que abre, começa com os valores atuais do exercício.
  useEffect(() => {
    if (visivel && exercicio) {
      setSeries(exercicio.series ? String(exercicio.series) : '');
      setRepeticoes(exercicio.repeticoes ? String(exercicio.repeticoes) : '');
      setPeso(exercicio.peso ? String(exercicio.peso) : '');
    }
  }, [visivel, exercicio?.id]);

  function salvar() {
    aoSalvar(series.trim(), repeticoes.trim(), peso.trim());
  }

  if (!exercicio) return null;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable style={styles.fundo} onPress={aoFechar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <View style={styles.titulo}>
            <View style={styles.barraTitulo} />
            <View style={styles.textosTitulo}>
              <Text style={styles.rotulo}>Editar</Text>
              <Text style={styles.nome}>{exercicio.nome}</Text>
            </View>
          </View>

          <Campo rotulo="Séries" valor={series} aoMudar={setSeries} passo={1} />
          <Campo rotulo="Repetições" valor={repeticoes} aoMudar={setRepeticoes} passo={1} />
          <Campo
            rotulo="Carga"
            valor={peso}
            aoMudar={setPeso}
            passo={2.5}
            unidade="kg"
            decimal
            ultimo
          />

          <TouchableOpacity style={styles.botaoPrincipal} onPress={salvar} activeOpacity={0.8}>
            <Text style={styles.textoPrincipal}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoCancelar} onPress={aoFechar}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cartao: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    padding: 20,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 22,
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
  nome: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginTop: 2,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  campoEspaco: {
    marginBottom: 14,
  },
  rotuloCampo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoMudar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CORES.fundo,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMudar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  valor: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: 78,
  },
  input: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  unidade: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginLeft: 2,
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoCancelar: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
});