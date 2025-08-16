// components/EmojiPulse.jsx
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export default function EmojiPulse({
  emoji = '❤️',
  size = 80,
  duration = 1200,
  glow = true,
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.18, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [duration, scale]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, rStyle]}>
      {glow && (
        <View
          style={{
            position: 'absolute',
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: 'rgba(255, 0, 72, 0.15)',
            shadowColor: '#ff2d55',
            shadowOpacity: 0.45,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
          }}
        />
      )}
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}
