import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import FundoTela from '../components/FundoTela';
import LinhaBatimento from '../components/LinhaBatimento';
import LogoAnimada from '../components/LogoAnimada';
import TituloAnimado from '../components/TituloAnimado';
import { avisar } from '../utils/avisar';
import { supabase } from '../utils/supabase';
import { CORES } from '../utils/tema';

export default function TelaLogin({ aoIrParaCadastro, aoIrParaEsqueci }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    if (enviando) return;
    const emailLimpo = email.trim().toLowerCase();

    if (emailLimpo === '' || senha === '') {
      avisar('Campos vazios', 'Preencha e-mail e senha.');
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLimpo,
      password: senha,
    });
    setEnviando(false);

    if (error) {
      avisar('Não foi possível entrar', 'E-mail ou senha incorretos.');
    }
    // Se deu certo, o App.jsx percebe a sessão e abre o app sozinho.
  }

  return (
    <FundoTela>
      <ScrollView
        style={styles.fundo}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.marca}>
          <LogoAnimada tamanho={110} />
        </View>

        <LinhaBatimento style={styles.batimento} />

        <TituloAnimado texto="Entrar" style={styles.titulo} />
        <Text style={styles.subtitulo}>Bem-vindo de volta</Text>

        <CampoTexto
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          placeholder="voce@email.com"
          teclado="email-address"
        />
        <CampoTexto
          rotulo="Senha"
          valor={senha}
          aoMudar={setSenha}
          placeholder="Sua senha"
          senha
        />

        <Botao titulo="Entrar" aoPressionar={entrar} />

        <Pressable
          onPress={aoIrParaEsqueci}
          hitSlop={8}
          style={({ pressed }) => [styles.linkEsqueci, pressed && styles.pressionado]}
        >
          <Text style={styles.textoLinkSecundario}>Esqueci a senha</Text>
        </Pressable>

        <View style={styles.divisor}>
          <View style={styles.linhaDivisor} />
          <Text style={styles.textoDivisor}>ou</Text>
          <View style={styles.linhaDivisor} />
        </View>

        <Pressable
          onPress={aoIrParaCadastro}
          style={({ pressed }) => [
            styles.botaoCadastro,
            pressed && styles.botaoCadastroAtivo,
          ]}
        >
          {({ pressed }) => (
            <Text style={[styles.textoCadastro, pressed && styles.textoCadastroAtivo]}>
              Criar conta
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </FundoTela>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  marca: {
    alignItems: 'center',
    marginBottom: 8,
  },
  batimento: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  subtitulo: {
    fontSize: 16,
    color: CORES.textoSecundario,
    marginTop: 4,
    marginBottom: 28,
  },
  linkEsqueci: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  textoLinkSecundario: {
    fontSize: 15,
    color: CORES.textoSecundario,
  },
  pressionado: {
    opacity: 0.6,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  linhaDivisor: {
    flex: 1,
    height: 1,
    backgroundColor: CORES.borda,
  },
  textoDivisor: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginHorizontal: 12,
  },
  botaoCadastro: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    borderRadius: 10,
    paddingVertical: 14,
  },
  botaoCadastroAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  textoCadastro: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
  },
  textoCadastroAtivo: {
    color: CORES.textoSobreDestaque,
  },
});