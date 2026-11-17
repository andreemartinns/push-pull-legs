import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GraficoEvolucao from '../components/ProgressChart';
import { BotaoPrincipal, Cabecalho, Campo, Cartao, Pilula, Secao, Tela } from '../components/UI';
import { avisar } from '../utils/notify';
import { P } from '../utils/theme';

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
    <Tela>
      <Cabecalho titulo="Medidas" aoVoltar={aoVoltar} />

      <Secao titulo="Registrar hoje" descricao="Preencha só o que você mediu." />

      <View style={styles.grade}>
        {MEDIDAS.map((item) => (
          <View key={item.chave} style={styles.campo}>
            <Campo
              rotulo={`${item.nome} (${item.unidade})`}
              valor={campos[item.chave] || ''}
              aoMudar={(texto) => mudarCampo(item.chave, texto)}
              placeholder="0"
              teclado="decimal-pad"
              maxLength={6}
            />
          </View>
        ))}
      </View>

      <BotaoPrincipal titulo="Salvar medidas" aoPressionar={salvar} />

      <Secao titulo="Evolução" />

      <View style={styles.seletor}>
        {MEDIDAS.map((item) => (
          <Pilula
            key={item.chave}
            texto={item.nome}
            ativo={medidaSelecionada === item.chave}
            aoPressionar={() => setMedidaSelecionada(item.chave)}
          />
        ))}
      </View>

      <GraficoEvolucao
        pontos={pontos}
        unidade={infoSelecionada.unidade}
        escalaRelativa
        textoVazio="Registre essa medida para ver a evolução aqui."
      />

      {variacao !== '' && <Text style={styles.variacao}>{variacao}</Text>}

      <Secao titulo="Registros" />

      {medidas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma medida registrada ainda.</Text>
      ) : (
        medidas.map((registro) => (
          <Cartao key={registro.id} style={styles.cartaoRegistro}>
            <View style={styles.textosRegistro}>
              <Text style={styles.dataRegistro}>{registro.data}</Text>
              <Text style={styles.resumoRegistro}>{resumoDoRegistro(registro)}</Text>
            </View>
            <Pressable onPress={() => aoRemoverMedida(registro.id)} hitSlop={10}>
              <Text style={styles.remover}>Remover</Text>
            </Pressable>
          </Cartao>
        ))
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  campo: { width: '48%' },
  seletor: { flexDirection: 'row', flexWrap: 'wrap' },
  variacao: { fontSize: 14, fontWeight: '800', color: P.texto, marginTop: 12 },
  vazio: { fontSize: 15, color: P.textoSecundario },
  cartaoRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  textosRegistro: { flex: 1, marginRight: 12 },
  dataRegistro: { fontSize: 15, fontWeight: '800', color: P.texto, marginBottom: 4 },
  resumoRegistro: { fontSize: 13, color: P.textoSecundario },
  remover: { fontSize: 13, fontWeight: '700', color: P.erro },
});