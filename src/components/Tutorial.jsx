import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { P } from '../utils/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FONTE = {
  media: 'BarlowCondensed_600SemiBold',
  forte: 'BarlowCondensed_700Bold',
  extra: 'BarlowCondensed_800ExtraBold',
};

function vibrar() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

// Botão que afunda com mola e vibra.
function Toque({ onPress, style, children, hitSlop, escala = 0.95 }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      onPress={() => {
        vibrar();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(escala, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

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

// Ponto do indicador: o ativo vira uma barra comprida.
function Ponto({ ativo }) {
  return (
    <MotiView
      animate={{ width: ativo ? 28 : 8, backgroundColor: ativo ? P.verde : P.pontoVazio }}
      transition={{ type: 'spring', damping: 15, stiffness: 180 }}
      style={styles.ponto}
    />
  );
}

export default function Tutorial({ tipo = 'aluno', aoConcluir }) {
  const passos = PASSOS[tipo] || PASSOS.aluno;
  const [indice, setIndice] = useState(0);

  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;

  return (
    <View style={styles.container}>
      {/* faixa diagonal de fundo, igual à do login */}
      <View style={styles.faixa} />

      <View style={styles.topo}>
        <Text style={styles.contador}>
          {indice + 1} / {passos.length}
        </Text>
        {!ultimo && (
          <Toque onPress={aoConcluir} hitSlop={10} style={styles.pular} escala={0.92}>
            <Text style={styles.textoPular}>PULAR</Text>
          </Toque>
        )}
      </View>

      <View style={styles.meio}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={indice}
            from={{ opacity: 0, translateX: 40 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -40 }}
            transition={{ type: 'timing', duration: 260 }}
          >
            {/* barrinhas inclinadas do logo */}
            <View style={styles.marca}>
              <View style={styles.marcaVerde} />
              <View style={styles.marcaLimao} />
            </View>
            <Text style={styles.numeroGrande}>{String(indice + 1).padStart(2, '0')}</Text>
            <Text style={styles.titulo}>{passo.titulo.toUpperCase()}</Text>
            <Text style={styles.texto}>{passo.texto}</Text>
          </MotiView>
        </AnimatePresence>
      </View>

      <View style={styles.pontos}>
        {passos.map((_, i) => (
          <Ponto key={i} ativo={i === indice} />
        ))}
      </View>

      <View style={styles.linhaBotoes}>
        {indice > 0 && (
          <Toque
            style={[styles.botaoSecundario, styles.botaoEspaco]}
            onPress={() => setIndice(indice - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={P.texto} />
            <Text style={styles.textoSecundario}>VOLTAR</Text>
          </Toque>
        )}
        <Toque
          style={styles.botao}
          onPress={() => (ultimo ? aoConcluir() : setIndice(indice + 1))}
        >
          <Text style={styles.textoBotao}>{ultimo ? 'COMEÇAR' : 'PRÓXIMO'}</Text>
          <Ionicons name="arrow-forward" size={20} color={P.verde} />
        </Toque>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.fundo,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  faixa: {
    position: 'absolute',
    top: -80,
    right: -120,
    width: 260,
    height: 460,
    backgroundColor: P.verde,
    opacity: 0.08,
    transform: [{ rotate: '25deg' }],
    pointerEvents: 'none',
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  contador: {
    fontFamily: FONTE.forte,
    fontSize: 18,
    letterSpacing: 2,
    color: P.textoSecundario,
  },
  pular: {
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textoPular: {
    fontFamily: FONTE.extra,
    fontSize: 16,
    letterSpacing: 1.5,
    color: P.texto,
  },
  meio: { flex: 1, justifyContent: 'center' },
  marca: { flexDirection: 'row', marginBottom: 8, paddingLeft: 6 },
  marcaVerde: {
    width: 44,
    height: 7,
    backgroundColor: P.verde,
    transform: [{ skewX: '-25deg' }],
  },
  marcaLimao: {
    width: 16,
    height: 7,
    marginLeft: 6,
    backgroundColor: P.limao,
    transform: [{ skewX: '-25deg' }],
  },
  numeroGrande: {
    fontFamily: FONTE.extra,
    fontSize: 110,
    lineHeight: 110,
    color: P.cartao,
    marginBottom: -20,
  },
  titulo: {
    fontFamily: FONTE.extra,
    fontSize: 46,
    lineHeight: 48,
    letterSpacing: 0.5,
    color: P.texto,
    marginBottom: 14,
  },
  texto: {
    fontFamily: FONTE.media,
    fontSize: 21,
    lineHeight: 28,
    color: P.textoSecundario,
  },
  pontos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  ponto: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  linhaBotoes: { flexDirection: 'row' },
  botao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.limao,
    borderRadius: 999,
    paddingVertical: 16,
  },
  botaoEspaco: { marginRight: 10 },
  textoBotao: {
    fontFamily: FONTE.extra,
    fontSize: 22,
    letterSpacing: 1.5,
    color: P.verde,
    marginRight: 8,
  },
  botaoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cartao,
    borderRadius: 999,
    paddingVertical: 16,
  },
  textoSecundario: {
    fontFamily: FONTE.extra,
    fontSize: 20,
    letterSpacing: 1,
    color: P.texto,
    marginLeft: 8,
  },
});