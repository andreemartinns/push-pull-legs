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

  const temUltima = Boolean(ultimaCarga && ultimaCarga.peso);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <Pressable style={styles.fundo} onPress={aoCancelar}>
        <Pressable style={styles.cartao} onPress={() => {}}>
          <View style={styles.titulo}>
            <View style={styles.barraTitulo} />
            <View style={styles.textosTitulo}>
              <Text style={styles.rotulo}>Carga</Text>
              <Text style={styles.nome}>{exercicio.nome}</Text>
            </View>
          </View>

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

          {temUltima ? (
            <Pressable
              onPress={() => setPeso(String(ultimaCarga.peso))}
              style={({ pressed }) => [styles.botaoUltima, pressed && styles.botaoUltimaAtivo]}
            >
              {({ pressed }) => (
                <Text style={[styles.textoUltima, pressed && styles.textoUltimaAtivo]}>
                  Última vez: {ultimaCarga.peso} kg · usar
                </Text>
              )}
            </Pressable>
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
  linhaPeso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoMudar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: CORES.fundo,
    borderWidth: 1.5,
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
  },
  inputPeso: {
    fontSize: 44,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.destaque,
    textAlign: 'center',
    width: 90,
    padding: 0,
  },
  unidade: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginLeft: 2,
  },
  dica: {
    fontSize: 12,
    color: CORES.textoSecundario,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  botaoUltima: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 14,
    marginBottom: 20,
  },
  botaoUltimaAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoUltima: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.textoSecundario,
  },
  textoUltimaAtivo: {
    color: CORES.textoSobreDestaque,
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