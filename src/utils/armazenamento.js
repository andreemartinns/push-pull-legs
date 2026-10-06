import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVES = {
  USUARIOS: '@meutreino:usuarios',
  USUARIO_LOGADO: '@meutreino:usuarioLogado',
  HISTORICO: '@meutreino:historico',
  EXERCICIOS_ANDAMENTO: '@meutreino:exerciciosAndamento',
};

export async function salvarUsuarios(usuarios) {
  try {
    await AsyncStorage.setItem(CHAVES.USUARIOS, JSON.stringify(usuarios));
  } catch (erro) {
    console.log('Erro ao salvar usuários', erro);
  }
}

export async function carregarUsuarios() {
  try {
    const valor = await AsyncStorage.getItem(CHAVES.USUARIOS);
    return valor ? JSON.parse(valor) : [];
  } catch (erro) {
    console.log('Erro ao carregar usuários', erro);
    return [];
  }
}

export async function salvarUsuarioLogado(usuario) {
  try {
    if (usuario) {
      await AsyncStorage.setItem(CHAVES.USUARIO_LOGADO, JSON.stringify(usuario));
    } else {
      await AsyncStorage.removeItem(CHAVES.USUARIO_LOGADO);
    }
  } catch (erro) {
    console.log('Erro ao salvar usuário logado', erro);
  }
}

export async function carregarUsuarioLogado() {
  try {
    const valor = await AsyncStorage.getItem(CHAVES.USUARIO_LOGADO);
    return valor ? JSON.parse(valor) : null;
  } catch (erro) {
    console.log('Erro ao carregar usuário logado', erro);
    return null;
  }
}

export async function salvarHistorico(historico) {
  try {
    await AsyncStorage.setItem(CHAVES.HISTORICO, JSON.stringify(historico));
  } catch (erro) {
    console.log('Erro ao salvar histórico', erro);
  }
}

export async function carregarHistorico() {
  try {
    const valor = await AsyncStorage.getItem(CHAVES.HISTORICO);
    return valor ? JSON.parse(valor) : [];
  } catch (erro) {
    console.log('Erro ao carregar histórico', erro);
    return [];
  }
}

export async function salvarExerciciosAndamento(exercicios) {
  try {
    await AsyncStorage.setItem(CHAVES.EXERCICIOS_ANDAMENTO, JSON.stringify(exercicios));
  } catch (erro) {
    console.log('Erro ao salvar exercícios em andamento', erro);
  }
}

export async function carregarExerciciosAndamento() {
  try {
    const valor = await AsyncStorage.getItem(CHAVES.EXERCICIOS_ANDAMENTO);
    return valor ? JSON.parse(valor) : [];
  } catch (erro) {
    console.log('Erro ao carregar exercícios em andamento', erro);
    return [];
  }
}