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
import { P } from '../utils/theme';

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
            placeholderTextColor={P.textoSecundario}
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
    backgroundColor: 'rgba(11, 31, 23, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cartao: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: P.fundo,
    borderRadius: 32,
    padding: 24,
  },
  titulo: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 22 },
  barraTitulo: { width: 4, borderRadius: 2, backgroundColor: P.verde, marginRight: 12 },
  textosTitulo: { flex: 1 },
  rotulo: { fontSize: 13, color: P.textoSecundario },
  nome: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: P.texto, marginTop: 2 },
  campo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  campoEspaco: { marginBottom: 14 },
  rotuloCampo: { fontSize: 14, fontWeight: '700', color: P.textoSecundario },
  controles: { flexDirection: 'row', alignItems: 'center' },
  botaoMudar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMudar: { fontSize: 20, fontWeight: '700', color: P.texto },
  valor: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', width: 78 },
  input: {
    fontSize: 22,
    fontWeight: '800',
    color: P.verde,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  unidade: { fontSize: 12, color: P.textoSecundario, marginLeft: 2 },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  textoPrincipal: { fontSize: 16, fontWeight: '800', color: P.verde },
  botaoCancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  textoCancelar: { fontSize: 14, fontWeight: '700', color: P.textoSecundario },
});