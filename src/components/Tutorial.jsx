import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../utils/tema';

const PASSOS = {
  aluno: [
    {
      titulo: 'Bem-vindo ao Ritmo Brasil',
      texto: 'Aqui você acompanha seus treinos, suas medidas e sua hidratação. Vamos ver como funciona em poucos passos.',
    },
    {
      titulo: 'Seu treino',
      texto: 'Se o seu professor montou um treino, ele aparece como "Treino do professor". É só tocar em "Começar treino". Se ainda não houver um, você pode montar o seu.',
    },
    {
      titulo: 'Marque e acompanhe',
      texto: 'Toque no círculo de cada exercício para concluir e informe a carga usada. Em Histórico e Medidas você vê sua evolução.',
    },
    {
      titulo: 'Água e lembretes',
      texto: 'Em Água você vê sua meta do dia. Ela é só uma estimativa e seu professor pode ajustar. Em caso de dúvida ou mal-estar, fale com ele.',
    },
  ],
  professor: [
    {
      titulo: 'Bem-vindo, professor',
      texto: 'Aqui você acompanha os alunos vinculados a você e monta o treino de cada um.',
    },
    {
      titulo: 'Sua lista de alunos',
      texto: 'Veja há quantos dias cada aluno não treina. A etiqueta "Risco" indica condição de saúde ou restrição médica, e "Sem ficha" indica que a ficha de saúde ainda não foi preenchida.',
    },
    {
      titulo: 'Ficha e treino',
      texto: 'Abra um aluno para ler a ficha de saúde e tocar em "Montar treino". Em alunos com risco, considere liberação médica antes de prescrever.',
    },
    {
      titulo: 'Meta de água',
      texto: 'Na ficha do aluno você escolhe entre meta automática, manual ou desligada. Cardíacos e renais podem ter restrição de líquidos.',
    },
  ],
  admin: [
    {
      titulo: 'Bem-vindo, administrador',
      texto: 'Aqui você gerencia professores e alunos da academia.',
    },
    {
      titulo: 'Alunos e professores',
      texto: 'Nas abas Alunos e Professores você vê todos os cadastros e pode transformar um aluno em professor, e voltar.',
    },
    {
      titulo: 'Vínculos',
      texto: 'Vincule cada aluno a um professor. Você pode trocar ou remover o vínculo quando precisar.',
    },
  ],
};

export default function Tutorial({ tipo = 'aluno', aoConcluir }) {
  const passos = PASSOS[tipo] || PASSOS.aluno;
  const [indice, setIndice] = useState(0);

  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <Text style={styles.contador}>
          {indice + 1} de {passos.length}
        </Text>
        {!ultimo && (
          <Pressable onPress={aoConcluir} hitSlop={10}>
            <Text style={styles.pular}>Pular</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.meio}>
        <View style={styles.barraTitulo} />
        <Text style={styles.titulo}>{passo.titulo}</Text>
        <Text style={styles.texto}>{passo.texto}</Text>
      </View>

      <View style={styles.pontos}>
        {passos.map((_, i) => (
          <View key={i} style={[styles.ponto, i === indice && styles.pontoAtivo]} />
        ))}
      </View>

      <View style={styles.linhaBotoes}>
        {indice > 0 && (
          <Pressable
            style={[styles.botaoSecundario, styles.botaoEspaco]}
            onPress={() => setIndice(indice - 1)}
          >
            <Text style={styles.textoSecundario}>Voltar</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.botao}
          onPress={() => (ultimo ? aoConcluir() : setIndice(indice + 1))}
        >
          <Text style={styles.textoBotao}>{ultimo ? 'Começar' : 'Próximo'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  contador: { fontSize: 13, color: CORES.textoSecundario },
  pular: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
  meio: { flex: 1, justifyContent: 'center' },
  barraTitulo: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: CORES.destaque,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.texto,
    marginBottom: 14,
  },
  texto: { fontSize: 16, lineHeight: 24, color: CORES.textoSecundario },
  pontos: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CORES.borda,
    marginHorizontal: 4,
  },
  pontoAtivo: { backgroundColor: CORES.destaque, width: 24 },
  linhaBotoes: { flexDirection: 'row' },
  botao: {
    flex: 1,
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoEspaco: { marginRight: 10 },
  textoBotao: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: CORES.textoSobreDestaque,
  },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoSecundario: { fontSize: 14, fontWeight: 'bold', color: CORES.textoSecundario },
});