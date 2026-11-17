// Demonstrações dos exercícios: fotos de início e fim, músculos trabalhados e passo a passo.
// Imagens: Free Exercise DB (domínio público), buscadas pela internet.
// Para trocar uma foto por outra (ou por vídeo no futuro), mude só a entrada do exercício aqui.

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const DEMONSTRACOES = {
  "Supino reto": {
    imagens: [
      BASE + 'Barbell_Bench_Press_-_Medium_Grip/0.jpg',
      BASE + 'Barbell_Bench_Press_-_Medium_Grip/1.jpg',
    ],
    principais: ["Peito"],
    secundarios: ["Ombros", "Tríceps"],
    passos: [
      "Deite no banco com os pés firmes no chão e segure a barra um pouco mais aberta que a largura dos ombros.",
      "Tire a barra do suporte e deixe-a sobre o peito, com os braços esticados.",
      "Desça devagar até a barra tocar a parte do meio do peito, inspirando.",
      "Empurre a barra para cima, expirando, sem tirar o quadril do banco.",
      "Ao terminar, devolva a barra ao suporte.",
    ],
  },
  "Supino inclinado": {
    imagens: [
      BASE + 'Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg',
      BASE + 'Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg',
    ],
    principais: ["Peito"],
    secundarios: ["Ombros", "Tríceps"],
    passos: [
      "Deite no banco inclinado com os pés firmes no chão e segure a barra um pouco mais aberta que a largura dos ombros.",
      "Tire a barra do suporte e deixe-a sobre o peito, com os braços esticados.",
      "Desça devagar até a barra encostar na parte de cima do peito, inspirando.",
      "Empurre a barra para cima, expirando, até esticar os braços.",
      "Ao terminar, devolva a barra ao suporte.",
    ],
  },
  "Crucifixo": {
    imagens: [
      BASE + 'Dumbbell_Flyes/0.jpg',
      BASE + 'Dumbbell_Flyes/1.jpg',
    ],
    principais: ["Peito"],
    secundarios: [],
    passos: [
      "Deite no banco com um halter em cada mão, braços esticados acima do peito e palmas voltadas uma para a outra.",
      "Com os cotovelos levemente flexionados, abra os braços em arco até sentir o peito alongar, inspirando.",
      "Volte pelo mesmo arco, apertando o peito, expirando.",
      "Mantenha os cotovelos levemente flexionados o tempo todo para proteger o bíceps.",
    ],
  },
  "Flexão de braço": {
    imagens: [
      BASE + 'Pushups/0.jpg',
      BASE + 'Pushups/1.jpg',
    ],
    principais: ["Peito"],
    secundarios: ["Ombros", "Tríceps"],
    passos: [
      "Apoie as mãos no chão, um pouco mais abertas que os ombros, com o corpo reto da cabeça aos calcanhares.",
      "Desça até o peito quase tocar o chão, inspirando.",
      "Empurre o chão e suba até esticar os braços, expirando.",
      "Mantenha o abdômen firme para o quadril não cair.",
    ],
  },
  "Crossover": {
    imagens: [
      BASE + 'Cable_Crossover/0.jpg',
      BASE + 'Cable_Crossover/1.jpg',
    ],
    principais: ["Peito"],
    secundarios: ["Ombros"],
    passos: [
      "Regule as polias na parte alta, escolha a carga e segure uma em cada mão.",
      "Dê um passo à frente, incline o tronco um pouco e junte as mãos à sua frente. Essa é a posição inicial.",
      "Com os cotovelos levemente flexionados, abra os braços em arco para os lados até sentir o peito alongar, inspirando.",
      "Volte juntando as mãos pelo mesmo arco, expirando, e segure um segundo.",
    ],
  },
  "Puxada frente": {
    imagens: [
      BASE + 'Wide-Grip_Lat_Pulldown/0.jpg',
      BASE + 'Wide-Grip_Lat_Pulldown/1.jpg',
    ],
    principais: ["Dorsais"],
    secundarios: ["Bíceps", "Costas", "Ombros"],
    passos: [
      "Sente na máquina, ajuste o apoio dos joelhos e segure a barra com as mãos mais abertas que os ombros, palmas para a frente.",
      "Incline o tronco um pouco para trás e estufe o peito.",
      "Puxe a barra até a parte de cima do peito, levando os cotovelos para baixo e para trás, expirando.",
      "Aperte as costas por um segundo e suba a barra devagar até esticar os braços, inspirando.",
    ],
  },
  "Remada curvada": {
    imagens: [
      BASE + 'Bent_Over_Barbell_Row/0.jpg',
      BASE + 'Bent_Over_Barbell_Row/1.jpg',
    ],
    principais: ["Costas"],
    secundarios: ["Bíceps", "Dorsais", "Ombros"],
    passos: [
      "Segure a barra com as palmas para baixo, flexione levemente os joelhos e incline o tronco à frente, com a coluna reta, quase paralelo ao chão.",
      "Mantendo o tronco parado, puxe a barra em direção ao abdômen, com os cotovelos junto ao corpo, expirando.",
      "Aperte as costas no topo por um segundo.",
      "Desça devagar até esticar os braços, inspirando.",
    ],
  },
  "Remada unilateral": {
    imagens: [
      BASE + 'One-Arm_Dumbbell_Row/0.jpg',
      BASE + 'One-Arm_Dumbbell_Row/1.jpg',
    ],
    principais: ["Costas"],
    secundarios: ["Bíceps", "Dorsais", "Ombros"],
    passos: [
      "Apoie um joelho e a mão do mesmo lado no banco, com o tronco paralelo ao chão e a coluna reta.",
      "Pegue o halter com a outra mão, palma voltada para o corpo.",
      "Puxe o halter em linha reta até a lateral do peito, com o cotovelo junto ao corpo, expirando.",
      "Desça devagar, inspirando. Termine as repetições e troque de lado.",
    ],
  },
  "Pull-down": {
    imagens: [
      BASE + 'Straight-Arm_Pulldown/0.jpg',
      BASE + 'Straight-Arm_Pulldown/1.jpg',
    ],
    principais: ["Dorsais"],
    secundarios: [],
    passos: [
      "Segure a barra na polia alta com as mãos mais abertas que os ombros, palmas para baixo, e dê dois passos para trás.",
      "Incline o tronco cerca de 30 graus à frente, com os braços esticados e os cotovelos levemente flexionados.",
      "Mantendo os braços retos, puxe a barra para baixo contraindo as costas, até as mãos ficarem ao lado das coxas, expirando.",
      "Volte devagar, ainda com os braços retos, inspirando.",
    ],
  },
  "Levantamento terra": {
    imagens: [
      BASE + 'Barbell_Deadlift/0.jpg',
      BASE + 'Barbell_Deadlift/1.jpg',
    ],
    principais: ["Lombar"],
    secundarios: ["Panturrilhas", "Antebraços", "Glúteos", "Posteriores de coxa"],
    passos: [
      "Fique em frente à barra, com os pés na largura dos ombros.",
      "Dobre os joelhos, incline o tronco com a coluna reta e segure a barra na largura dos ombros, palmas para baixo.",
      "Suba empurrando o chão com as pernas e levando o tronco à posição em pé, com o peito aberto, expirando.",
      "Desça flexionando os joelhos e inclinando o tronco, com a coluna sempre reta, até a barra tocar o chão.",
      "Cuidado: nunca arredonde as costas durante o movimento.",
    ],
  },
  "Agachamento": {
    imagens: [
      BASE + 'Barbell_Full_Squat/0.jpg',
      BASE + 'Barbell_Full_Squat/1.jpg',
    ],
    principais: ["Quadríceps"],
    secundarios: ["Panturrilhas", "Glúteos", "Posteriores de coxa", "Lombar"],
    passos: [
      "Apoie a barra nas costas, na altura dos ombros (de preferência dentro do rack), e tire-a do suporte.",
      "Afaste os pés na largura dos ombros, com as pontas levemente para fora. Olhe para a frente e mantenha a coluna reta.",
      "Desça flexionando os joelhos e levando o quadril para trás, o mais fundo que sua mobilidade permitir, inspirando.",
      "Suba empurrando o chão com o meio do pé ou o calcanhar, até esticar as pernas, expirando.",
    ],
  },
  "Leg press": {
    imagens: [
      BASE + 'Leg_Press/0.jpg',
      BASE + 'Leg_Press/1.jpg',
    ],
    principais: ["Quadríceps"],
    secundarios: ["Panturrilhas", "Glúteos", "Posteriores de coxa"],
    passos: [
      "Sente na máquina e apoie os pés na plataforma, na largura dos ombros.",
      "Destrave as travas de segurança e empurre a plataforma até esticar as pernas, sem travar os joelhos.",
      "Desça devagar até as pernas formarem cerca de 90 graus, inspirando.",
      "Empurre de volta pelos calcanhares, expirando.",
      "Ao terminar, trave a plataforma nas travas de segurança.",
    ],
  },
  "Cadeira extensora": {
    imagens: [
      BASE + 'Leg_Extensions/0.jpg',
      BASE + 'Leg_Extensions/1.jpg',
    ],
    principais: ["Quadríceps"],
    secundarios: [],
    passos: [
      "Ajuste o peso e sente com as pernas sob o apoio e as mãos segurando as laterais.",
      "Estique as pernas ao máximo, expirando, com o resto do corpo parado no banco. Segure um segundo.",
      "Desça devagar, inspirando, sem passar de 90 graus de flexão do joelho.",
    ],
  },
  "Mesa flexora": {
    imagens: [
      BASE + 'Lying_Leg_Curls/0.jpg',
      BASE + 'Lying_Leg_Curls/1.jpg',
    ],
    principais: ["Posteriores de coxa"],
    secundarios: [],
    passos: [
      "Regule a máquina e deite de bruços, com o apoio na parte de trás das pernas, logo acima dos calcanhares.",
      "Mantenha o tronco no banco, as pernas esticadas e as mãos nas alças.",
      "Dobre as pernas o máximo possível sem tirar as coxas do apoio, expirando. Segure um segundo.",
      "Volte devagar, inspirando.",
    ],
  },
  "Afundo": {
    imagens: [
      BASE + 'Dumbbell_Lunges/0.jpg',
      BASE + 'Dumbbell_Lunges/1.jpg',
    ],
    principais: ["Quadríceps"],
    secundarios: ["Panturrilhas", "Glúteos", "Posteriores de coxa"],
    passos: [
      "Fique em pé com um halter em cada mão, ao lado do corpo, e o tronco ereto.",
      "Dê um passo à frente e desça o corpo, mantendo o tronco ereto e o equilíbrio, inspirando.",
      "Empurre pelo calcanhar da perna da frente para voltar, expirando.",
      "Repita as repetições e depois faça com a outra perna.",
    ],
  },
  "Rosca direta": {
    imagens: [
      BASE + 'Barbell_Curl/0.jpg',
      BASE + 'Barbell_Curl/1.jpg',
    ],
    principais: ["Bíceps"],
    secundarios: ["Antebraços"],
    passos: [
      "Em pé, com o tronco ereto, segure a barra na largura dos ombros, palmas para a frente e cotovelos junto ao corpo.",
      "Sem balançar o corpo, suba a barra até a altura dos ombros, contraindo o bíceps e expirando. Só os antebraços se movem.",
      "Segure um segundo e desça devagar, inspirando.",
    ],
  },
  "Rosca alternada": {
    imagens: [
      BASE + 'Dumbbell_Alternate_Bicep_Curl/0.jpg',
      BASE + 'Dumbbell_Alternate_Bicep_Curl/1.jpg',
    ],
    principais: ["Bíceps"],
    secundarios: ["Antebraços"],
    passos: [
      "Em pé, com um halter em cada mão, braços esticados, cotovelos junto ao corpo e palmas voltadas para as coxas.",
      "Suba o halter direito girando a palma para a frente, até contrair o bíceps, expirando.",
      "Desça devagar girando a palma de volta, inspirando.",
      "Repita com o braço esquerdo. Isso conta como uma repetição.",
    ],
  },
  "Tríceps corda": {
    imagens: [
      BASE + 'Triceps_Pushdown_-_Rope_Attachment/0.jpg',
      BASE + 'Triceps_Pushdown_-_Rope_Attachment/1.jpg',
    ],
    principais: ["Tríceps"],
    secundarios: [],
    passos: [
      "Prenda a corda na polia alta e segure com as palmas voltadas uma para a outra.",
      "Em pé, com o tronco reto e levemente inclinado à frente, mantenha os cotovelos junto ao corpo.",
      "Empurre a corda para baixo até esticar os braços, levando as pontas para os lados das coxas, expirando.",
      "Segure um segundo e suba devagar, inspirando. Só os antebraços se movem.",
    ],
  },
  "Tríceps testa": {
    imagens: [
      BASE + 'EZ-Bar_Skullcrusher/0.jpg',
      BASE + 'EZ-Bar_Skullcrusher/1.jpg',
    ],
    principais: ["Tríceps"],
    secundarios: ["Antebraços"],
    passos: [
      "Deite no banco e segure a barra com as mãos próximas, braços esticados na vertical.",
      "Mantendo os braços parados, dobre os cotovelos e leve a barra até perto da testa, inspirando.",
      "Estique os cotovelos para voltar à posição inicial, expirando.",
    ],
  },
  "Rosca martelo": {
    imagens: [
      BASE + 'Hammer_Curls/0.jpg',
      BASE + 'Hammer_Curls/1.jpg',
    ],
    principais: ["Bíceps"],
    secundarios: [],
    passos: [
      "Em pé, com um halter em cada mão, braços esticados, cotovelos junto ao corpo e palmas voltadas para o corpo.",
      "Sem mexer a parte de cima do braço, suba os halteres até a altura dos ombros, expirando, mantendo as palmas voltadas para dentro.",
      "Segure um segundo e desça devagar, inspirando.",
    ],
  },
  "Desenvolvimento": {
    imagens: [
      BASE + 'Dumbbell_Shoulder_Press/0.jpg',
      BASE + 'Dumbbell_Shoulder_Press/1.jpg',
    ],
    principais: ["Ombros"],
    secundarios: ["Tríceps"],
    passos: [
      "Sente num banco com encosto, com um halter em cada mão apoiado nas coxas.",
      "Leve os halteres à altura dos ombros, um de cada vez, com as palmas voltadas para a frente.",
      "Empurre os halteres para cima até quase se tocarem, expirando.",
      "Desça devagar até a altura dos ombros, inspirando.",
    ],
  },
  "Elevação lateral": {
    imagens: [
      BASE + 'Side_Lateral_Raise/0.jpg',
      BASE + 'Side_Lateral_Raise/1.jpg',
    ],
    principais: ["Ombros"],
    secundarios: [],
    passos: [
      "Em pé, com o tronco reto, segure um halter em cada mão ao lado do corpo, palmas voltadas para as coxas.",
      "Sem balançar o tronco, suba os braços para os lados, com os cotovelos levemente flexionados, até a altura dos ombros, expirando.",
      "Desça devagar, inspirando.",
    ],
  },
  "Elevação frontal": {
    imagens: [
      BASE + 'Front_Dumbbell_Raise/0.jpg',
      BASE + 'Front_Dumbbell_Raise/1.jpg',
    ],
    principais: ["Ombros"],
    secundarios: [],
    passos: [
      "Em pé, com o tronco reto, segure os halteres à frente das coxas, palmas voltadas para as coxas.",
      "Sem balançar o tronco, suba um halter à frente, com o cotovelo levemente flexionado e a palma para baixo, até a altura dos ombros.",
      "Desça devagar enquanto sobe o outro halter.",
      "Continue alternando os braços.",
    ],
  },
  "Remada alta": {
    imagens: [
      BASE + 'Upright_Barbell_Row/0.jpg',
      BASE + 'Upright_Barbell_Row/1.jpg',
    ],
    principais: ["Ombros"],
    secundarios: ["Trapézio"],
    passos: [
      "Em pé, segure a barra com as mãos um pouco mais fechadas que a largura dos ombros, apoiada nas coxas, com os braços esticados e a coluna reta.",
      "Expire e suba a barra junto ao corpo, levando os cotovelos para cima e para os lados, até quase tocar o queixo.",
      "Mantenha os cotovelos mais altos que as mãos.",
      "Desça devagar, inspirando. Se sentir incômodo no ombro, pare de subir quando os cotovelos chegarem na altura dos ombros.",
    ],
  },
  "Crucifixo invertido": {
    imagens: [
      BASE + 'Reverse_Flyes/0.jpg',
      BASE + 'Reverse_Flyes/1.jpg',
    ],
    principais: ["Ombros"],
    secundarios: [],
    passos: [
      "Deite de bruços num banco inclinado, com o peito apoiado e um halter em cada mão, palmas voltadas uma para a outra.",
      "Estique os braços para baixo, perpendiculares ao banco.",
      "Com os cotovelos levemente flexionados, abra os braços para os lados em arco, juntando as escápulas, até ficarem na altura dos ombros, expirando.",
      "Sinta a contração e desça devagar, inspirando.",
    ],
  },
};