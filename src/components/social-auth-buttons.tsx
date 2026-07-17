import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo } from '@/components/google-logo';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { signInWithGoogleIdToken } from '@/lib/auth';
import { t } from '@/lib/i18n';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IS_CONFIGURED = Boolean(GOOGLE_ANDROID_CLIENT_ID);

type SocialAuthButtonsProps = {
  onSignedIn: () => void;
};

export function SocialAuthButtons({ onSignedIn }: SocialAuthButtonsProps) {
  const [submitting, setSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Fall back to a placeholder so the hook never throws before the user
    // even sees the screen. Real sign-in is blocked by handleGooglePress
    // until GOOGLE_IS_CONFIGURED, which checks the actual env var.
    androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? 'unconfigured',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? 'unconfigured',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'unconfigured',
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) return;

    async function completeSignIn(token: string) {
      setSubmitting(true);
      try {
        await signInWithGoogleIdToken(token);
        onSignedIn();
      } catch (error) {
        console.error('Google sign-in failed:', error);
        Alert.alert(t('loginSignInFailedTitle'), t('loginSignInFailedMessage'));
      } finally {
        setSubmitting(false);
      }
    }

    void completeSignIn(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  function handleApplePress() {
    Alert.alert(t('loginComingSoonTitle'), t('loginAppleOnlyIOS'));
  }

  function handleGooglePress() {
    if (!GOOGLE_IS_CONFIGURED) {
      Alert.alert(t('loginNotConfiguredTitle'), t('loginGoogleNotConfigured'));
      return;
    }
    void promptAsync();
  }

  return (
    <View style={styles.buttons}>
      <Pressable
        disabled={!request || submitting}
        onPress={handleGooglePress}
        style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}>
        <GoogleLogo size={18} />
        <Text style={styles.googleButtonText}>
          {submitting ? t('loginSigningIn') : t('loginContinueGoogle')}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleApplePress}
        style={({ pressed }) => [styles.button, styles.appleButton, pressed && styles.pressed]}>
        <FontAwesome name="apple" size={20} color={Brand.white} />
        <Text style={styles.appleButtonText}>{t('loginContinueApple')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: Spacing.three,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: 999,
    paddingVertical: Spacing.three,
  },
  googleButton: {
    backgroundColor: Brand.white,
    borderWidth: 2,
    borderColor: Brand.ink,
  },
  googleButtonText: {
    color: Brand.ink,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  appleButton: {
    backgroundColor: Brand.ink,
  },
  appleButtonText: {
    color: Brand.white,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  pressed: {
    opacity: 0.8,
  },
});
