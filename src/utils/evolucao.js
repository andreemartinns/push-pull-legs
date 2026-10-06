export function listarExerciciosComPeso(historico) {
  const nomes = new Set();

  historico.forEach((treino) => {
    treino.exercicios.forEach((exercicio) => {
      const peso = parseFloat(exercicio.peso);
      if (!isNaN(peso) && peso > 0) {
        nomes.add(exercicio.nome);
      }
    });
  });

  return Array.from(nomes);
}

export function obterEvolucao(historico, nomeExercicio) {
  const pontos = [];

  const historicoOrdenado = [...historico].reverse();

  historicoOrdenado.forEach((treino) => {
    const exercicio = treino.exercicios.find((item) => item.nome === nomeExercicio);
    if (exercicio) {
      const peso = parseFloat(exercicio.peso);
      if (!isNaN(peso) && peso > 0) {
        pontos.push({ data: treino.data, peso });
      }
    }
  });

  return pontos;
}