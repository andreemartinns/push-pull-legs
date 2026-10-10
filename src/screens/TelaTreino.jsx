import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BarraProgresso from '../components/BarraProgresso';
import Botao from '../components/Botao';
import CartaoExercicio from '../components/CartaoExercicio';
import Logo from '../components/Logo';
import ModalEditarExercicio from '../components/ModalEditarExercicio';
import ModalExercicios from '../components/ModalExercicios';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { GRUPOS } from '../utils/grupos';
import { CORES } from '../utils/tema';
import {
  carregarExerciciosAndamento,
  carregarHistorico,
  salvarExerciciosAndamento,
} from '../utils/armazenamento';

// Converte "12,5" ou "12.5" em número. Se não for número, devolve 0.
function paraNumero(valor) {
  const numero = Number(String(valor || '').replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

// Lê o histórico e guarda, para cada exercício, a carga mais recente.
// Considera que o registro mais recente é o primeiro da lista.
function montarUltimasCargas(historico) {
  const mapa = {};

  for (const registro of historico) {
    const lista = Array.isArray(registro) ? registro : registro.exercicios || [];

    for (const ex of lista) {
      if (ex.peso && mapa[ex.nome] === undefined) {
        mapa[ex.nome] = {
          peso: ex.peso,
          series: ex.series,
          repeticoes: ex.repeticoes,
        };
      }
    }
  }

  return mapa;
}

// Lê o histórico e guarda, para cada exercício, a MAIOR carga já usada.
function montarRecordes(historico) {
  const mapa = {};

  for (const registro of historico) {
    const lista = Array.isArray(registro) ? registro : registro.exercicios || [];

    for (const ex of lista) {
      const peso = paraNumero(ex.peso);
      if (peso > 0 && (mapa[ex.nome] === undefined || peso > mapa[ex.nome])) {
        mapa[ex.nome] = peso;
      }
    }
  }

  return mapa;
}

// Pega as cargas de um treino que acabou de ser finalizado.
function cargasDoTreino(lista) {
  const mapa = {};

  for (const ex of lista) {
    if (ex.peso) {
      mapa[ex.nome] = {
        peso: ex.peso,
        series: ex.series,
        repeticoes: ex.repeticoes,
      };
    }
  }

  return mapa;
}

// Mesmo formato de data que o App.jsx usa ao salvar o treino (ex: "09/10/2026").
function formatarData(data) {
  return data.toLocaleDateString('pt-BR');
}

// Lista as datas em que houve treino concluído.
function montarDatasTreino(historico) {
  return historico.map((registro) => registro.data).filter(Boolean);
}

// Conta quantos dias seguidos você treinou.
// Se hoje ainda não treinou, a sequência continua valendo a partir de ontem.
function calcularSequencia(datas) {
  const conjunto = new Set(datas);
  const dia = new Date();

  if (!conjunto.has(formatarData(dia))) {
    dia.setDate(dia.getDate() - 1);
  }

  let total = 0;
  while (conjunto.has(formatarData(dia))) {
    total += 1;
    dia.setDate(dia.getDate() - 1);
  }

  return total;
}

export default function TelaTreino({ usuario, aoSair, aoSalvarTreino, aoVerHistorico }) {
  const [exercicios, setExercicios] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [grupoModal, setGrupoModal] = useState(null);
  const [exercicioEditando, setExercicioEditando] = useState(null);
  const [temporizadorVisivel, setTemporizadorVisivel] = useState(false);
  const [ultimasCargas, setUltimasCargas] = useState({});
  const [recordes, setRecordes] = useState({});
  const [datasTreino, setDatasTreino] = useState([]);
  const carregouInicial = useRef(false);

  const concluidos = exercicios.filter((item) => item.concluido).length;
  const sequencia = calcularSequencia(datasTreino);

  useEffect(() => {
    async function carregar() {
      const salvos = await carregarExerciciosAndamento();
      setExercicios(salvos);
      carregouInicial.current = true;

      const historico = await carregarHistorico();
      setUltimasCargas(montarUltimasCargas(historico));
      setRecordes(montarRecordes(historico));
      setDatasTreino(montarDatasTreino(historico));
    }
    carregar();
  }, []);

  useEffect(() => {
    if (carregouInicial.current) {
      salvarExerciciosAndamento(exercicios);
    }
  }, [exercicios]);

  useEffect(() => {
    if (exercicios.length > 0 && concluidos === exercicios.length) {
      setUltimasCargas((atual) => ({ ...atual, ...cargasDoTreino(exercicios) }));
      setRecordes((atual) => {
        const novo = { ...atual };
        for (const ex of exercicios) {
          const peso = paraNumero(ex.peso);
          if (peso > (novo[ex.nome] || 0)) {
            novo[ex.nome] = peso;
          }
        }
        return novo;
      });
      setDatasTreino((atual) => [...atual, formatarData(new Date())]);
      aoSalvarTreino(exercicios);
      setExercicios([]);
    }
  }, [concluidos]);

  // É recorde quando o exercício já tem histórico e a carga atual passa da maior de antes.
  function ehNovoRecorde(exercicio) {
    const recorde = recordes[exercicio.nome];
    if (recorde === undefined) return false;
    return paraNumero(exercicio.peso) > recorde;
  }

  function abrirModal(nomeGrupo) {
    setGrupoModal(nomeGrupo);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
  }

  function adicionarExercicio(nomeExercicio) {
    const novoExercicio = {
      id: Date.now().toString(),
      nome: nomeExercicio,
      series: '3',
      repeticoes: '12',
      peso: '',
      grupo: grupoModal,
      concluido: false,
    };

    setExercicios([...exercicios, novoExercicio]);
    setModalVisivel(false);
  }

  function alternarConcluido(id) {
    const exercicio = exercicios.find((item) => item.id === id);
    const vaiConcluir = !exercicio.concluido;

    setExercicios(
      exercicios.map((item) =>
        item.id === id ? { ...item, concluido: vaiConcluir } : item
      )
    );

    if (vaiConcluir) {
      setTemporizadorVisivel(true);
    }
  }

  function removerExercicio(id) {
    setExercicios(exercicios.filter((item) => item.id !== id));
  }

  function limparConcluidos() {
    setExercicios(exercicios.filter((item) => !item.concluido));
  }

  function abrirEdicao(exercicio) {
    setExercicioEditando(exercicio);
  }

  function fecharEdicao() {
    setExercicioEditando(null);
  }

  function salvarEdicao(novasSeries, novasRepeticoes, novoPeso) {
    setExercicios(
      exercicios.map((item) =>
        item.id === exercicioEditando.id
          ? { ...item, series: novasSeries, repeticoes: novasRepeticoes, peso: novoPeso }
          : item
      )
    );
    setExercicioEditando(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.marca}>
          <Logo tamanho={56} style={styles.logo} />
          <View style={styles.nomeMarca}>
            <Text style={styles.academia}>Academia</Text>
            <Text style={styles.nomeAcademia}>Ritmo Brasil</Text>
          </View>
        </View>

        <View style={styles.acoesCabecalho}>
          <TouchableOpacity onPress={aoVerHistorico}>
            <Text style={styles.historico}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={aoSair}>
            <Text style={styles.sair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.linhaAmarela} />

      <View style={styles.cabecalho}>
        <Text style={styles.saudacao}>Olá, {usuario.nome}</Text>
        <Text style={styles.titulo}>Meu Treino</Text>
      </View>

      <Text style={styles.sequencia}>
        {sequencia > 0
          ? `${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'} de treino`
          : 'Conclua um treino para começar sua sequência'}
      </Text>

      <Text style={styles.instrucao}>Escolha um grupo muscular para ver os exercícios</Text>

      <View style={styles.grupos}>
        {GRUPOS.map((item) => {
          const aberto = modalVisivel && grupoModal === item.nome;

          return (
            <Pressable
              key={item.nome}
              onPress={() => abrirModal(item.nome)}
              style={({ pressed }) => [
                styles.chip,
                (pressed || aberto) && styles.chipAtivo,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.textoChip,
                    (pressed || aberto) && styles.textoChipAtivo,
                  ]}
                >
                  {item.nome}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {exercicios.length > 0 && (
        <BarraProgresso total={exercicios.length} concluidos={concluidos} />
      )}

      {concluidos > 0 && (
        <View style={styles.limpar}>
          <Botao
            titulo="Limpar concluídos"
            aoPressionar={limparConcluidos}
            cor={CORES.erro}
          />
        </View>
      )}

      <FlatList
        data={exercicios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartaoExercicio
            exercicio={item}
            ultimaCarga={ultimasCargas[item.nome]}
            novoRecorde={ehNovoRecorde(item)}
            aoAlternar={() => alternarConcluido(item.id)}
            aoRemover={() => removerExercicio(item.id)}
            aoEditar={() => abrirEdicao(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum exercício ainda. Toque em um grupo acima para começar.</Text>
        }
      />

      <ModalExercicios
        visivel={modalVisivel}
        grupo={grupoModal}
        aoFechar={fecharModal}
        aoSelecionar={adicionarExercicio}
      />

      <ModalEditarExercicio
        visivel={exercicioEditando !== null}
        exercicio={exercicioEditando}
        aoFechar={fecharEdicao}
        aoSalvar={salvarEdicao}
      />

      <TemporizadorDescanso
        visivel={temporizadorVisivel}
        aoFechar={() => setTemporizadorVisivel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: CORES.fundo,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    alignSelf: 'auto',
    marginBottom: 0,
  },
  nomeMarca: {
    marginLeft: 12,
  },
  academia: {
    fontSize: 12,
    fontStyle: 'italic',
    color: CORES.textoSecundario,
  },
  nomeAcademia: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: CORES.texto,
  },
  acoesCabecalho: {
    alignItems: 'flex-end',
  },
  historico: {
    fontSize: 14,
    color: CORES.texto,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sair: {
    fontSize: 15,
    color: CORES.textoSecundario,
    fontWeight: 'bold',
  },
  linhaAmarela: {
    height: 4,
    backgroundColor: CORES.destaque,
    marginHorizontal: -20,
    marginBottom: 20,
  },
  cabecalho: {
    marginBottom: 8,
  },
  saudacao: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  sequencia: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CORES.destaque,
    marginBottom: 16,
  },
  instrucao: {
    fontSize: 14,
    color: CORES.textoSecundario,
    marginBottom: 12,
  },
  grupos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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
  limpar: {
    marginBottom: 16,
  },
  vazio: {
    fontSize: 16,
    color: CORES.textoSecundario,
  },
});