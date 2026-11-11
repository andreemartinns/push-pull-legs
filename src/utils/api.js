import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://ritmo-brasil-backend.onrender.com';
const CHAVE_TOKEN = 'ritmo_token';

export async function getToken() {
  return AsyncStorage.getItem(CHAVE_TOKEN);
}

async function setToken(t) {
  if (t) await AsyncStorage.setItem(CHAVE_TOKEN, t);
  else await AsyncStorage.removeItem(CHAVE_TOKEN);
}

export async function api(metodo, caminho, corpo) {
  const token = await getToken();
  const res = await fetch(API_URL + caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let dados = null;
  try { dados = await res.json(); } catch {}
  if (!res.ok) throw new Error(dados?.erro || 'Erro de conexão');
  return dados;
}

export async function entrar(email, senha) {
  const r = await api('POST', '/auth/login', { email, senha });
  await setToken(r.token);
  return r.perfil;
}

export async function cadastrar(email, senha, nome, tipo) {
  const r = await api('POST', '/auth/cadastro', { email, senha, nome, tipo });
  await setToken(r.token);
  return r.perfil;
}

export async function sair() {
  await setToken(null);
}

export async function carregarPerfil() {
  if (!(await getToken())) return null;
  try {
    return await api('GET', '/perfil');
  } catch {
    await setToken(null);
    return null;
  }
}