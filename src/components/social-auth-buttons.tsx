import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo } from '@/components/google-logo';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { signInWithGoogleIdToken } from '@/lib/auth';
import { t } from '@/lib/i18n';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IS_CONFIGURED = Boolean(GOOGLE_WEB_CLIENT_ID);

if (GOOGLE_IS_CONFIGURED) {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

type SocialAuthButtonsProps = {
  onSignedIn: () => void;
};

export function SocialAuthButtons({ onSignedIn }: SocialAuthButtonsProps) {
  const [submitting, setSubmitting] = useState(false);

  function handleApplePress() {
    Alert.alert(t('loginComingSoonTitle'), t('loginAppleOnlyIOS'));
  }

  async function handleGooglePress() {
    if (!GOOGLE_IS_CONFIGURED) {
      Alert.alert(t('loginNotConfiguredTitle'), t('loginGoogleNotConfigured'));
      return;
    }

    setSubmitting(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) throw new Error('No idToken returned by Google Sign-In');

      await signInWithGoogleIdToken(idToken);
      onSignedIn();
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      console.error('Google sign-in failed:', error);
      Alert.alert(t('loginSignInFailedTitle'), t('loginSignInFailedMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.buttons}>
      <Pressable
        disabled={submitting}
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
