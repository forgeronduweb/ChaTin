import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppDialog, type AppDialogAction } from '@/components/app-dialog';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { UpdatePrompt } from '@/components/update-prompt';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { getLatestRelease } from '@/lib/api';
import { type AuthUser, clearSession, getSession } from '@/lib/auth';
import { clearStoredConversations } from '@/lib/conversations-store';
import { locale, t } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme-store';
import type { PendingUpdate } from '@/lib/update-check';

const THEME_ICONS: Record<ThemeMode, { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }> = {
  light: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  dark: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  auto: { ios: 'circle.lefthalf.filled', android: 'brightness_auto', web: 'brightness_auto' },
};

const THEME_LABEL_KEYS: Record<ThemeMode, 'settingsThemeLight' | 'settingsThemeDark' | 'settingsThemeAuto'> = {
  light: 'settingsThemeLight',
  dark: 'settingsThemeDark',
  auto: 'settingsThemeAuto',
};

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'auto', auto: 'light' };

const LANGUAGE_LABELS: Record<typeof locale, string> = {
  fr: 'Français',
  en: 'English',
};

const WEBSITE_URL = 'https://forgeronduweb.github.io/ChaTin/';

type DialogState =
  | { type: 'signOutConfirm' }
  | { type: 'clearHistoryConfirm' }
  | { type: 'clearHistoryDone' }
  | { type: 'updateUpToDate' }
  | { type: 'updateError' }
  | null;

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function SettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [manualUpdate, setManualUpdate] = useState<PendingUpdate | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  useFocusEffect(
    useCallback(() => {
      getSession().then((session) => setUser(session?.user ?? null));
    }, []),
  );

  function closeDialog() {
    setDialog(null);
  }

  function handleShareApp() {
    void Share.share({ message: t('settingsShareMessage', { url: WEBSITE_URL }) });
  }

  async function handleCheckUpdate() {
    setCheckingUpdate(true);
    try {
      const release = await getLatestRelease();
      const installedCode = Number(Application.nativeBuildVersion ?? '0');
      if (release.versionCode > installedCode) {
        setManualUpdate(release);
      } else {
        setDialog({ type: 'updateUpToDate' });
      }
    } catch (error) {
      // No release has ever been published from the admin dashboard yet -
      // that's not a failure, there's just nothing to compare against.
      if (error instanceof Error && error.message.includes('404')) {
        setDialog({ type: 'updateUpToDate' });
        return;
      }
      console.error('Failed to check for updates:', error);
      setDialog({ type: 'updateError' });
    } finally {
      setCheckingUpdate(false);
    }
  }

  let dialogTitle = '';
  let dialogMessage: string | undefined;
  let dialogPrimary: AppDialogAction = { label: t('settingsOk'), onPress: closeDialog };
  let dialogSecondary: AppDialogAction | undefined;

  switch (dialog?.type) {
    case 'signOutConfirm':
      dialogTitle = t('settingsSignOutConfirmTitle');
      dialogMessage = t('settingsSignOutConfirmMessage');
      dialogPrimary = {
        label: t('settingsSignOut'),
        destructive: true,
        onPress: () => {
          void clearSession().then(() => setUser(null));
          closeDialog();
        },
      };
      dialogSecondary = { label: t('settingsCancel'), onPress: closeDialog };
      break;
    case 'clearHistoryConfirm':
      dialogTitle = t('settingsClearHistoryConfirmTitle');
      dialogMessage = t('settingsClearHistoryConfirmMessage');
      dialogPrimary = {
        label: t('settingsClearHistoryConfirmButton'),
        destructive: true,
        onPress: () => {
          clearStoredConversations();
          setDialog({ type: 'clearHistoryDone' });
        },
      };
      dialogSecondary = { label: t('settingsCancel'), onPress: closeDialog };
      break;
    case 'clearHistoryDone':
      dialogTitle = t('settingsClearHistoryDone');
      dialogPrimary = { label: t('settingsOk'), onPress: closeDialog };
      break;
    case 'updateUpToDate':
      dialogTitle = t('settingsCheckUpdateUpToDateTitle');
      dialogMessage = t('settingsCheckUpdateUpToDateMessage');
      dialogPrimary = { label: t('settingsOk'), onPress: closeDialog };
      break;
    case 'updateError':
      dialogTitle = t('settingsCheckUpdateErrorTitle');
      dialogMessage = t('settingsCheckUpdateErrorMessage');
      dialogPrimary = { label: t('settingsOk'), onPress: closeDialog };
      break;
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

          <Pressable
            onPress={() => setMode(THEME_CYCLE[mode])}
            accessibilityLabel={t(THEME_LABEL_KEYS[mode])}
            style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView tintColor={Brand.white} name={THEME_ICONS[mode]} size={18} />
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
            onPress={() => (user ? setDialog({ type: 'signOutConfirm' }) : router.push('/login'))}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.actionButtonText}>{user ? t('settingsSignOut') : t('settingsSignIn')}</Text>
          </Pressable>
        </View>

        <View style={styles.generalSection}>
          <Text style={styles.sectionTitle}>{t('settingsGeneral')}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsLanguage')}</Text>
            <Text style={styles.rowValue}>{LANGUAGE_LABELS[locale]}</Text>
          </View>
        </View>

        <View style={styles.generalSection}>
          <Text style={styles.sectionTitle}>{t('settingsOther')}</Text>

          <Pressable onPress={() => router.push('/feedback')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowLabel}>{t('settingsFeedback')}</Text>
            <SymbolView
              tintColor={Brand.textMuted}
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
            />
          </Pressable>

          <Pressable onPress={handleShareApp} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowLabel}>{t('settingsShareApp')}</Text>
            <SymbolView
              tintColor={Brand.textMuted}
              name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              size={16}
            />
          </Pressable>

          <Pressable
            onPress={handleCheckUpdate}
            disabled={checkingUpdate}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowLabel}>{t('settingsCheckUpdate')}</Text>
            <SymbolView
              tintColor={Brand.textMuted}
              name={{ ios: 'arrow.triangle.2.circlepath', android: 'refresh', web: 'refresh' }}
              size={16}
            />
          </Pressable>

          <Pressable
            onPress={() => setDialog({ type: 'clearHistoryConfirm' })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={[styles.rowLabel, styles.destructiveLabel]}>{t('settingsClearHistory')}</Text>
            <SymbolView tintColor={Brand.red} name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={16} />
          </Pressable>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t('settingsAbout')}</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutAppName}>ChaTin</Text>
            <Text style={styles.aboutTagline}>{t('settingsAboutTagline')}</Text>
            <Text style={styles.aboutCredit}>{t('settingsAboutCredit')}</Text>
            <Pressable
              onPress={() => Linking.openURL(WEBSITE_URL)}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.aboutLink}>{t('settingsAboutWebsite')}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionFooter}>
          {t('settingsVersion')} {Constants.expoConfig?.version ?? '—'}
        </Text>
      </ScrollView>

      {manualUpdate && <UpdatePrompt update={manualUpdate} onDismiss={() => setManualUpdate(null)} />}

      <AppDialog
        visible={dialog !== null}
        title={dialogTitle}
        message={dialogMessage}
        primaryAction={dialogPrimary}
        secondaryAction={dialogSecondary}
        onRequestClose={closeDialog}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      justifyContent: 'space-between',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.iconChipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
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
      color: colors.text,
      fontSize: 16,
      fontFamily: Fonts.bold,
      marginBottom: Spacing.three,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      backgroundColor: colors.surface,
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
      color: colors.text,
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
      color: colors.text,
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
      backgroundColor: colors.iconChipBackground,
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
      backgroundColor: colors.surface,
      borderRadius: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      marginBottom: Spacing.two,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    rowValue: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.regular,
    },
    destructiveLabel: {
      color: Brand.red,
    },
    aboutCard: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.four,
      padding: Spacing.four,
      gap: Spacing.one,
    },
    aboutAppName: {
      color: colors.text,
      fontSize: 20,
      fontFamily: Fonts.bold,
    },
    aboutTagline: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: Fonts.regular,
      lineHeight: 19,
      marginBottom: Spacing.two,
    },
    aboutCredit: {
      color: Brand.textMuted,
      fontSize: 12,
      fontFamily: Fonts.medium,
    },
    aboutLink: {
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.bold,
      textDecorationLine: 'underline',
      marginTop: Spacing.one,
    },
    versionFooter: {
      color: Brand.textMuted,
      fontSize: 12,
      fontFamily: Fonts.medium,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
