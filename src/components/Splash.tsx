import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Backdrop } from './Backdrop';
import { colors, font } from '../theme';

/**
 * Must equal `imageWidth` for expo-splash-screen in app.json so the native splash hands off seamlessly.
 * The Lottie file (assets/bethouse-mark.json) is a 1024x1024 comp whose first and last frames are the
 * static mark, so it can be swapped for any Lottie with the same framing.
 */
const SIZE = 280;
const K = SIZE / 1024;
const MARK_BOTTOM = 826 * K; // bottom edge of the chip inside the mark box
const markSource = require('../../assets/bethouse-mark.json');

/**
 * betHouse launch: the native splash holds the static mark. The pitch fades in while the Lottie mark
 * plays (chip toss, coin flip, landing, ripple), then the wordmark slides up out of a mask and the
 * scene zooms through into the app.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const pitch = useSharedValue(0);
  const word = useSharedValue(0);
  const lift = useSharedValue(0);
  const tag = useSharedValue(0);
  const exit = useSharedValue(0);
  const nativeHidden = useRef(false);

  const hideNative = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const safety = setTimeout(hideNative, 600); // never leave the native splash up if Lottie is slow to load
    if (reduce) {
      pitch.value = 1; word.value = 1; lift.value = 1; tag.value = 1;
      const id = setTimeout(onDone, 700);
      return () => { clearTimeout(safety); clearTimeout(id); };
    }
    pitch.value = withDelay(100, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    lift.value = withDelay(1400, withSpring(1, { damping: 20, stiffness: 140 }));
    word.value = withDelay(1450, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    tag.value = withDelay(1900, withTiming(1, { duration: 450 }));
    exit.value = withDelay(2800, withTiming(1, { duration: 450, easing: Easing.in(Easing.cubic) }, (fin) => {
      if (fin) scheduleOnRN(onDone);
    }));
    return () => clearTimeout(safety);
  }, [reduce, onDone, hideNative, pitch, word, lift, tag, exit]);

  const root = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const group = useAnimatedStyle(() => ({
    transform: [{ translateY: -46 * lift.value }, { scale: 1 + 0.12 * exit.value }],
  }));
  const pitchStyle = useAnimatedStyle(() => ({ opacity: pitch.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 60 }] }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value, transform: [{ translateY: (1 - tag.value) * 8 }] }));

  const markTop = height / 2 - SIZE / 2;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.night }, root]}>
      <Animated.View style={[StyleSheet.absoluteFill, pitchStyle]} pointerEvents="none"><Backdrop /></Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, group]} pointerEvents="none">
        <LottieView
          source={markSource}
          autoPlay={!reduce}
          loop={false}
          onAnimationLoaded={hideNative}
          style={{ position: 'absolute', left: width / 2 - SIZE / 2, top: markTop, width: SIZE, height: SIZE }}
        />
        <View style={{ position: 'absolute', left: 0, right: 0, top: markTop + MARK_BOTTOM + 14, alignItems: 'center' }}>
          <View style={styles.mask}>
            <Animated.Text style={[styles.word, wordStyle]}>
              <Text style={{ fontFamily: font.regular }}>bet</Text>
              <Text style={{ fontFamily: font.bold }}>House</Text>
            </Animated.Text>
          </View>
          <Animated.Text style={[styles.tag, tagStyle]}>Bet smart. Stay in control.</Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mask: { height: 64, overflow: 'hidden', justifyContent: 'center' },
  word: { fontSize: 46, color: colors.text, letterSpacing: -0.8, lineHeight: 58 },
  tag: { fontFamily: font.regular, fontSize: 15, color: colors.textSoft, letterSpacing: 0.3, marginTop: 4 },
});
