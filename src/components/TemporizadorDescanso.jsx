import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CORES } from '../utils/tema';

const OPCOES = [30, 60, 90, 120];

export default function TemporizadorDescanso({ visivel, aoFechar }) {
  const [duracao, setDuracao] = useState(60);
  const [restante, setRestante] = useState(60);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef(null);

  useEffect(() => {
    if (visivel) {
      setDuracao(60);
      setRestante(60);
      setRodando(true);
    } else {
      setRodando(false);
    }
  }, [visivel]);

  useEffect(() => {
    if (!rodando) return;

    if (restante <= 0) {
      setRodando(false);
      return;
    }

    intervaloRef.current = setTimeout(() => {
      setRestante((valor) => valor - 1);
    }, 1000);

    return () => clearTimeout(intervaloRef.current);
  }, [rodando, restante]);

  function escolherDuracao(segundos) {
    setDuracao(segundos);
    setRestante(segundos);
    setRodando(true);
  }

  function alternarPausa() {
    setRodando(!rodando);
  }

  function reiniciar() {
    setRestante(duracao);
    setRodando(true);
  }

  if (!visivel) return null;

  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const tempoFormatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;
  const progresso = duracao === 0 ? 0 : (restante / duracao) * 100;
  const terminou = restante <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.cartao}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>{terminou ? 'Descanso concluído! 💪' : 'Descansando...'}</Text>
          <TouchableOpacity onPress={aoFechar}>
            <Text style={styles.fechar}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tempo}>{tempoFormatado}</Text>

        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchimento, { width: `${progresso}%` }]} />
        </View>

        <View style={styles.opcoes}>
          {OPCOES.map((segundosOpcao) => (
            <TouchableOpacity
              key={segundosOpcao}
              style={[styles.opcao, duracao === segundosOpcao && styles.opcaoAtiva]}
              onPress={() => escolherDuracao(segundosOpcao)}
            >
              <Text style={[styles.textoOpcao, duracao === segundosOpcao && styles.textoOpcaoAtiva]}>
                {segundosOpcao}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.acoes}>
          <TouchableOpacity style={styles.botaoAcao} onPress={alternarPausa}>
            <Text style={styles.textoBotaoAcao}>{rodando ? 'Pausar' : 'Continuar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoAcao} onPress={reiniciar}>
            <Text style={styles.textoBotaoAcao}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  cartao: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.destaque,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 360,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
  },
  fechar: {
    fontSize: 16,
    color: CORES.textoSecundario,
    paddingHorizontal: 6,
  },
  tempo: {
    fontSize: 40,
    fontWeight: '900',
    color: CORES.texto,
    textAlign: 'center',
    marginVertical: 8,
  },
  barraFundo: {
    height: 8,
    backgroundColor: CORES.borda,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barraPreenchimento: {
    height: 8,
    backgroundColor: CORES.destaque,
    borderRadius: 4,
  },
  opcoes: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  opcao: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  opcaoAtiva: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoOpcao: {
    fontSize: 13,
    color: CORES.texto,
  },
  textoOpcaoAtiva: {
    color: CORES.textoSobreDestaque,
    fontWeight: 'bold',
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  botaoAcao: {
    marginHorizontal: 10,
  },
  textoBotaoAcao: {
    fontSize: 14,
    color: CORES.destaque,
    fontWeight: 'bold',
  },
});