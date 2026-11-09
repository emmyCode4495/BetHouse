import { ComponentRef, createContext, ReactNode, RefObject, useContext } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

/** Android blurs only what sits inside a BlurTargetView, so App shares its ref here. */
export const BlurTargetContext = createContext<RefObject<ComponentRef<typeof View> | null> | null>(null);

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  /** Real blur is costly. Use it on a few large panels; rows and cards use fill only. */
  blur?: boolean;
};

export function Glass({ children, style, radius = 24, intensity = 40, blur = true }: Props) {
  const target = useContext(BlurTargetContext);
  return (
    <View
      style={[
        {
          borderRadius: radius, overflow: 'hidden', borderWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.38)', borderLeftColor: 'rgba(255,255,255,0.30)',
          borderRightColor: 'rgba(255,255,255,0.12)', borderBottomColor: 'rgba(255,255,255,0.10)',
        },
        style,
      ]}
    >
      {blur && (
        <BlurView
          intensity={intensity}
          tint="dark"
          blurTarget={target ?? undefined}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill} pointerEvents="none"
      />
      {children}
    </View>
  );
}
