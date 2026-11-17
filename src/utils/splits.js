// Treinos prontos de cada dia da divisão.
// O campo "grupo" precisa ser um dos grupos de grupos.js.
export const DIVISOES = [
  {
    nome: 'Push',
    descricao: 'Peito, ombros e tríceps',
    exercicios: [
      { grupo: 'Peito', nome: 'Supino reto' },
      { grupo: 'Peito', nome: 'Supino inclinado' },
      { grupo: 'Peito', nome: 'Crucifixo' },
      { grupo: 'Ombros', nome: 'Desenvolvimento' },
      { grupo: 'Ombros', nome: 'Elevação lateral' },
      { grupo: 'Braços', nome: 'Tríceps corda' },
      { grupo: 'Braços', nome: 'Tríceps testa' },
    ],
  },
  {
    nome: 'Pull',
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
    nome: 'Legs',
    descricao: 'Pernas',
    exercicios: [
      { grupo: 'Pernas', nome: 'Agachamento' },
      { grupo: 'Pernas', nome: 'Leg press' },
      { grupo: 'Pernas', nome: 'Cadeira extensora' },
      { grupo: 'Pernas', nome: 'Mesa flexora' },
      { grupo: 'Pernas', nome: 'Afundo' },
    ],
  },
];