import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { type AuthUser, clearSession, getSession } from '@/lib/auth';
import { locale, t } from '@/lib/i18n';

const LANGUAGE_LABELS: Record<typeof locale, string> = {
  fr: 'Français',
  en: 'English',
};

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSession().then((session) => setUser(session?.user ?? null));
    }, []),
  );

  function handleSignOut() {
    Alert.alert(t('settingsSignOutConfirmTitle'), t('settingsSignOutConfirmMessage'), [
      { text: t('settingsCancel'), style: 'cancel' },
      {
        text: t('settingsSignOut'),
        style: 'destructive',
        onPress: () => {
          void clearSession().then(() => setUser(null));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerSection}>
        <GraphPaperBackground />

        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView
                tintColor={Brand.white}
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={18}
              />
            </View>
          </Pressable>
        </View>

        <Text style={styles.title}>{t('settingsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.sectionTitle}>{t('settingsAccount')}</Text>

          {user ? (
            <View style={styles.accountCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initialsFor(user.name)}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>{t('settingsSignedInAs')}</Text>
                <Text style={styles.accountName}>{user.name}</Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.accountCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🙂</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{t('settingsNotSignedIn')}</Text>
                <Text style={styles.accountSubtitle}>{t('settingsNotSignedInSubtitle')}</Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => (user ? handleSignOut() : router.push('/login'))}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.actionButtonText}>
              {user ? t('settingsSignOut') : t('settingsSignIn')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.generalSection}>
          <Text style={styles.sectionTitle}>{t('settingsGeneral')}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsLanguage')}</Text>
            <Text style={styles.rowValue}>{LANGUAGE_LABELS[locale]}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsVersion')}</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '—'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
  },
  headerSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Brand.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.bold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.three,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.paper,
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarInitials: {
    color: Brand.ink,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  accountName: {
    color: Brand.ink,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  accountEmail: {
    color: Brand.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  accountSubtitle: {
    color: Brand.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: Spacing.three,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: Brand.ink,
  },
  actionButtonText: {
    color: Brand.white,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  generalSection: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.paper,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.two,
  },
  rowLabel: {
    color: Brand.ink,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  rowValue: {
    color: Brand.textMuted,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  pressed: {
    opacity: 0.8,
  },
});
