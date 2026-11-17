// Treinos prontos, além do Push / Pull / Legs.
// O campo "grupo" precisa ser um dos grupos de grupos.js.
// Os nomes dos exercícios seguem os de exercicios.js, para a última carga
// e o recorde continuarem funcionando.

export const DIVISAO_ABC = [
  {
    nome: 'A',
    descricao: 'Peito e tríceps',
    exercicios: [
      { grupo: 'Peito', nome: 'Supino reto' },
      { grupo: 'Peito', nome: 'Supino inclinado' },
      { grupo: 'Peito', nome: 'Crucifixo' },
      { grupo: 'Braços', nome: 'Tríceps corda' },
      { grupo: 'Braços', nome: 'Tríceps testa' },
    ],
  },
  {
    nome: 'B',
    descricao: 'Costas e bíceps',
    exercicios: [
      { grupo: 'Costas', nome: 'Puxada frente' },
      { grupo: 'Costas', nome: 'Remada curvada' },
      { grupo: 'Costas', nome: 'Remada unilateral' },
      { grupo: 'Braços', nome: 'Rosca direta' },
      { grupo: 'Braços', nome: 'Rosca martelo' },
    ],
  },
  {
    nome: 'C',
    descricao: 'Pernas e ombros',
    exercicios: [
      { grupo: 'Pernas', nome: 'Agachamento' },
      { grupo: 'Pernas', nome: 'Leg press' },
      { grupo: 'Pernas', nome: 'Mesa flexora' },
      { grupo: 'Ombros', nome: 'Desenvolvimento' },
      { grupo: 'Ombros', nome: 'Elevação lateral' },
    ],
  },
];

export const FULL_BODY = {
  nome: 'Full Body',
  descricao: 'Corpo todo em um dia',
  exercicios: [
    { grupo: 'Pernas', nome: 'Agachamento' },
    { grupo: 'Peito', nome: 'Supino reto' },
    { grupo: 'Costas', nome: 'Remada curvada' },
    { grupo: 'Ombros', nome: 'Desenvolvimento' },
    { grupo: 'Braços', nome: 'Rosca direta' },
    { grupo: 'Braços', nome: 'Tríceps corda' },
  ],
};