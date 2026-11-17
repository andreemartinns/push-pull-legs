import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const NATIVO = Platform.OS !== 'web';

export default function TituloAnimado({ texto, style }) {
  const letras = texto.split('');
  const valores = useRef(letras.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anim = Animated.stagger(
      70,
      valores.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: NATIVO,
        })
      )
    );
    anim.start();
    return () => anim.stop();
  }, [valores]);

  return (
    <View style={styles.linha}>
      {letras.map((letra, i) => (
        <Animated.Text
          key={i}
          style={[
            style,
            {
              opacity: valores[i],
              transform: [
                {
                  translateY: valores[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {letra === ' ' ? '\u00A0' : letra}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});