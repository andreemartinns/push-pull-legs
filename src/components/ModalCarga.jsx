import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

// Quanto o botão − ou + muda a carga a cada toque.
const PASSO = 2.5;

// Converte "12,5" ou "12.5" em número. Se não for número, devolve 0.
function paraNumero(valor) {
  const numero = Number(String(valor || '').replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

// Devolve o número como texto, com vírgula (ex: 12,5).
function formatar(numero) {
  return String(Math.round(numero * 100) / 100).replace('.', ',');
}

export default function ModalCarga({ visivel, exercicio, ultimaCarga, aoCancelar, aoConfirmar }) {
  const [peso, setPeso] = useState('');

  // Cada vez que abre, começa com a carga que o exercício já tem.
  useEffect(() => {
    if (visivel && exercicio) {
      setPeso(exercicio.peso ? String(exercicio.peso) : '');
    }
  }, [visivel, exercicio?.id]);

  function mudar(delta) {
    const novo = Math.max(0, paraNumero(peso) + delta);
    setPeso(novo === 0 ? '' : formatar(novo));
  }

  if (!exercicio) return null;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <Pressable style={styles.fundo} onPress={aoCancelar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <Text style={styles.rotulo}>Quanto você levantou?</Text>
          <Text style={styles.nome}>{exercicio.nome}</Text>

          <View style={styles.linhaPeso}>
            <TouchableOpacity style={styles.botaoMudar} onPress={() => mudar(-PASSO)}>
              <Text style={styles.textoMudar}>−</Text>
            </TouchableOpacity>

            <View style={styles.campoPeso}>
              <TextInput
                style={styles.inputPeso}
                value={peso}
                onChangeText={setPeso}
                placeholder="0"
                placeholderTextColor={CORES.textoSecundario}
                keyboardType="decimal-pad"
                selectTextOnFocus
                maxLength={6}
              />
              <Text style={styles.unidade}>kg</Text>
            </View>

            <TouchableOpacity style={styles.botaoMudar} onPress={() => mudar(PASSO)}>
              <Text style={styles.textoMudar}>+</Text>
            </TouchableOpacity>
          </View>

          {ultimaCarga && ultimaCarga.peso ? (
            <Text style={styles.dica}>Última vez: {ultimaCarga.peso} kg</Text>
          ) : (
            <Text style={styles.dica}>Sem carga? É só concluir.</Text>
          )}

          <TouchableOpacity
            style={styles.botaoPrincipal}
            onPress={() => aoConfirmar(peso.trim())}
            activeOpacity={0.8}
          >
            <Text style={styles.textoPrincipal}>Concluir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoCancelar} onPress={aoCancelar}>
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  rotulo: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: CORES.textoSecundario,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.texto,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  linhaPeso: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoMudar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CORES.fundo,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMudar: {
    fontSize: 26,
    color: CORES.texto,
    fontWeight: 'bold',
  },
  campoPeso: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: 130,
  },
  inputPeso: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
    textAlign: 'center',
    width: 80,
    padding: 0,
  },
  unidade: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginLeft: 4,
  },
  dica: {
    fontSize: 12,
    color: CORES.textoSecundario,
    marginTop: 10,
    marginBottom: 20,
  },
  botaoPrincipal: {
    width: '100%',
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoCancelar: {
    paddingVertical: 12,
    marginTop: 4,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
});