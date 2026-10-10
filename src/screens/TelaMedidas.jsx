import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import GraficoEvolucao from '../components/GraficoEvolucao';
import { avisar } from '../utils/avisar';
import { CORES } from '../utils/tema';

const MEDIDAS = [
  { chave: 'peso', nome: 'Peso', unidade: 'kg' },
  { chave: 'peito', nome: 'Peito', unidade: 'cm' },
  { chave: 'cintura', nome: 'Cintura', unidade: 'cm' },
  { chave: 'braco', nome: 'Braço', unidade: 'cm' },
  { chave: 'coxa', nome: 'Coxa', unidade: 'cm' },
];

// Converte "72,5" ou "72.5" em número. Se não for número, devolve 0.
function paraNumero(texto) {
  const numero = Number(String(texto || '').trim().replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

// Mostra o número com vírgula e no máximo uma casa decimal (72.5 vira "72,5").
function formatar(numero) {
  return String(Math.round(numero * 10) / 10).replace('.', ',');
}

export default function TelaMedidas({ medidas, aoSalvarMedida, aoRemoverMedida, aoVoltar }) {
  const [campos, setCampos] = useState({});
  const [campoFocado, setCampoFocado] = useState(null);
  const [medidaSelecionada, setMedidaSelecionada] = useState('peso');

  const infoSelecionada = MEDIDAS.find((item) => item.chave === medidaSelecionada);

  // As medidas são guardadas da mais nova para a mais antiga.
  // O gráfico precisa da ordem inversa, da mais antiga para a mais nova.
  const pontos = [...medidas]
    .reverse()
    .filter((registro) => registro.valores && registro.valores[medidaSelecionada])
    .map((registro) => ({
      data: registro.data,
      valor: Number(registro.valores[medidaSelecionada]),
    }));

  let variacao = '';
  if (pontos.length >= 2) {
    const primeiro = pontos[0];
    const ultimo = pontos[pontos.length - 1];
    const diferenca = ultimo.valor - primeiro.valor;
    const desde = primeiro.data.slice(0, 5);

    if (Math.round(diferenca * 10) === 0) {
      variacao = `Sem variação desde ${desde}`;
    } else {
      const sinal = diferenca > 0 ? '+' : '−';
      variacao = `${sinal}${formatar(Math.abs(diferenca))} ${infoSelecionada.unidade} desde ${desde}`;
    }
  }

  function mudarCampo(chave, texto) {
    setCampos({ ...campos, [chave]: texto });
  }

  function salvar() {
    const valores = {};

    for (const item of MEDIDAS) {
      const numero = paraNumero(campos[item.chave]);
      if (numero > 0) {
        valores[item.chave] = numero;
      }
    }

    if (Object.keys(valores).length === 0) {
      avisar('Nada para salvar', 'Preencha pelo menos uma medida.');
      return;
    }

    aoSalvarMedida({
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      valores,
    });
    setCampos({});
  }

  function resumoDoRegistro(registro) {
    return MEDIDAS.filter((item) => registro.valores && registro.valores[item.chave])
      .map((item) => `${item.nome} ${formatar(Number(registro.valores[item.chave]))} ${item.unidade}`)
      .join(' · ');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={aoVoltar}>
        <Text style={styles.voltar}>‹ Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>Medidas</Text>

      <Text style={styles.secao}>Registrar hoje</Text>
      <Text style={styles.dica}>Preencha só o que você mediu.</Text>

      <View style={styles.grade}>
        {MEDIDAS.map((item) => (
          <View key={item.chave} style={styles.campo}>
            <Text style={styles.rotulo}>
              {item.nome} ({item.unidade})
            </Text>
            <TextInput
              style={[styles.input, campoFocado === item.chave && styles.inputFocado]}
              value={campos[item.chave] || ''}
              onChangeText={(texto) => mudarCampo(item.chave, texto)}
              onFocus={() => setCampoFocado(item.chave)}
              onBlur={() => setCampoFocado(null)}
              placeholder="0"
              placeholderTextColor={CORES.textoSecundario}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>
        ))}
      </View>

      <Botao titulo="Salvar medidas" aoPressionar={salvar} />

      <Text style={[styles.secao, styles.secaoEspaco]}>Evolução</Text>

      <View style={styles.seletor}>
        {MEDIDAS.map((item) => {
          const ativa = medidaSelecionada === item.chave;

          return (
            <TouchableOpacity
              key={item.chave}
              style={[styles.chip, ativa && styles.chipAtivo]}
              onPress={() => setMedidaSelecionada(item.chave)}
            >
              <Text style={[styles.textoChip, ativa && styles.textoChipAtivo]}>{item.nome}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GraficoEvolucao
        pontos={pontos}
        unidade={infoSelecionada.unidade}
        escalaRelativa
        textoVazio="Registre essa medida para ver a evolução aqui."
      />

      {variacao !== '' && <Text style={styles.variacao}>{variacao}</Text>}

      <Text style={[styles.secao, styles.secaoEspaco]}>Registros</Text>

      {medidas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma medida registrada ainda.</Text>
      ) : (
        medidas.map((registro) => (
          <View key={registro.id} style={styles.cartaoRegistro}>
            <View style={styles.textosRegistro}>
              <Text style={styles.dataRegistro}>{registro.data}</Text>
              <Text style={styles.resumoRegistro}>{resumoDoRegistro(registro)}</Text>
            </View>
            <TouchableOpacity onPress={() => aoRemoverMedida(registro.id)}>
              <Text style={styles.remover}>Remover</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  conteudo: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  voltar: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.texto,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginBottom: 20,
  },
  secao: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  secaoEspaco: {
    marginTop: 28,
    marginBottom: 12,
  },
  dica: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginTop: 2,
    marginBottom: 14,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  campo: {
    width: '48%',
    marginBottom: 14,
  },
  rotulo: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: CORES.textoSecundario,
    marginBottom: 6,
  },
  input: {
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: CORES.texto,
  },
  inputFocado: {
    borderColor: CORES.destaque,
  },
  seletor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoChip: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  textoChipAtivo: {
    color: CORES.textoSobreDestaque,
  },
  variacao: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.texto,
    marginTop: 8,
  },
  vazio: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  cartaoRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  textosRegistro: {
    flex: 1,
    marginRight: 12,
  },
  dataRegistro: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
    marginBottom: 4,
  },
  resumoRegistro: {
    fontSize: 13,
    color: CORES.textoSecundario,
  },
  remover: {
    fontSize: 14,
    color: CORES.textoSecundario,
  },
});