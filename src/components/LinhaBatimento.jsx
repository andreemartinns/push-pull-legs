import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CORES } from '../utils/tema';

const NATIVO = Platform.OS !== 'web';

export default function LinhaBatimento({ style, altura = 64 }) {
  const [largura, setLargura] = useState(0);
  const deslocamento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (largura === 0) return;
    deslocamento.setValue(0);
    const anim = Animated.loop(
      Animated.timing(deslocamento, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: NATIVO,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [deslocamento, largura]);

  const translateX = deslocamento.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -largura],
  });

  return (
    <View
      style={[{ height: altura }, styles.janela, style]}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
    >
      {largura > 0 && (
        <Animated.View
          style={{ width: largura * 2, height: altura, transform: [{ translateX }] }}
        >
          <Svg width={largura * 2} height={altura} viewBox="0 0 480 60" preserveAspectRatio="none">
            <Path
              d="M0 30 H60 L70 30 L78 6 L90 54 L100 14 L106 30 H150 L158 30 L166 6 L178 54 L188 14 L194 30 H300 L310 30 L318 6 L330 54 L340 14 L346 30 H390 L398 30 L406 6 L418 54 L428 14 L434 30 H480"
              stroke={CORES.destaque}
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  janela: {
    overflow: 'hidden',
  },
});