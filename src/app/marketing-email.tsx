import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppDialog } from '@/components/app-dialog';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import {
  addMarketingContact,
  deleteMarketingContact,
  type EmailDesign,
  getMarketingCampaigns,
  getMarketingContacts,
  importMarketingContacts,
  type MarketingCampaign,
  type MarketingContact,
  sendMarketingCampaign,
} from '@/lib/api';
import { t } from '@/lib/i18n';

const DESIGNS: EmailDesign[] = ['announcement', 'promo', 'newsletter', 'welcome'];
const DESIGN_LABEL_KEYS: Record<EmailDesign, 'marketingDesignAnnouncement' | 'marketingDesignPromo' | 'marketingDesignNewsletter' | 'marketingDesignWelcome'> = {
  announcement: 'marketingDesignAnnouncement',
  promo: 'marketingDesignPromo',
  newsletter: 'marketingDesignNewsletter',
  welcome: 'marketingDesignWelcome',
};

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// "Name, email@example.com" or just "email@example.com" per line - forgiving
// of whichever format someone pastes from a spreadsheet export.
function parseImportText(raw: string): { name: string; email: string }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex === -1) return { name: '', email: line.trim() };
      return { name: line.slice(0, commaIndex).trim(), email: line.slice(commaIndex + 1).trim() };
    })
    .filter((entry) => entry.email.includes('@'));
}

export default function MarketingEmailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [design, setDesign] = useState<EmailDesign>('announcement');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [resultDialog, setResultDialog] = useState<{ title: string; message: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getMarketingContacts(), getMarketingCampaigns()])
        .then(([contactsResult, campaignsResult]) => {
          if (cancelled) return;
          setContacts(contactsResult);
          setCampaigns(campaignsResult);
        })
        .catch((error) => console.error('Failed to load marketing data:', error))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function handleAddContact() {
    const email = contactEmail.trim();
    if (!email) return;
    const name = contactName.trim();
    setContactName('');
    setContactEmail('');
    try {
      const created = await addMarketingContact(name, email);
      setContacts((current) => [created, ...current]);
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  }

  async function handleImport() {
    const parsed = parseImportText(importText);
    if (parsed.length === 0) return;
    try {
      const result = await importMarketingContacts(parsed);
      const refreshed = await getMarketingContacts();
      setContacts(refreshed);
      setImportText('');
      setShowImport(false);
      setResultDialog({
        title: t('marketingImportContacts'),
        message: t('marketingImportResult', { added: String(result.added), skipped: String(result.skipped) }),
      });
    } catch (error) {
      console.error('Failed to import contacts:', error);
    }
  }

  async function handleDeleteContact(id: string) {
    const previous = contacts;
    setContacts((current) => current.filter((contact) => contact.id !== id));
    try {
      await deleteMarketingContact(id);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setContacts(previous);
    }
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendMarketingCampaign({
        subject: subject.trim(),
        body: body.trim(),
        design,
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
      });
      setSubject('');
      setBody('');
      setCtaLabel('');
      setCtaUrl('');
      setCampaigns(await getMarketingCampaigns());
      setResultDialog({
        title: t('marketingComposeSection'),
        message: t('marketingSendSuccess', {
          sent: String(result.recipientCount - result.failureCount),
          failed: String(result.failureCount),
        }),
      });
    } catch (error) {
      console.error('Failed to send marketing campaign:', error);
      setResultDialog({ title: t('marketingSendError'), message: '' });
    } finally {
      setSending(false);
    }
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

        <Text style={styles.title}>{t('marketingEmailTitle')}</Text>
        <Text style={styles.intro}>{t('marketingEmailIntro')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.warningBanner}>
          <SymbolView tintColor={Brand.ink} name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }} size={14} />
          <Text style={styles.warningText}>{t('marketingSandboxWarning')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('marketingContactsSection')}</Text>

        <View style={styles.addContactRow}>
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            placeholder={t('marketingContactNamePlaceholder')}
            placeholderTextColor={Brand.textMuted}
            style={[styles.input, styles.addContactNameInput]}
          />
          <TextInput
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder={t('marketingContactEmailPlaceholder')}
            placeholderTextColor={Brand.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, styles.addContactEmailInput]}
          />
          <Pressable onPress={handleAddContact} style={({ pressed }) => [styles.smallActionButton, pressed && styles.pressed]}>
            <Text style={styles.smallActionButtonText}>{t('marketingAddContact')}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setShowImport((current) => !current)} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.linkText}>{t('marketingImportContacts')}</Text>
        </Pressable>

        {showImport && (
          <View style={styles.importBlock}>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder={t('marketingImportPlaceholder')}
              placeholderTextColor={Brand.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.importInput]}
            />
            <Pressable onPress={handleImport} style={({ pressed }) => [styles.smallActionButton, pressed && styles.pressed]}>
              <Text style={styles.smallActionButtonText}>{t('marketingImportSubmit')}</Text>
            </Pressable>
          </View>
        )}

        {!loading && contacts.length === 0 && <Text style={styles.empty}>{t('marketingContactsEmpty')}</Text>}

        <View style={styles.contactChipsWrap}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactChip}>
              <Text style={styles.contactChipText} numberOfLines={1}>
                {contact.name ? `${contact.name} · ${contact.email}` : contact.email}
              </Text>
              <Pressable onPress={() => handleDeleteContact(contact.id)} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
                <SymbolView tintColor={Brand.textMuted} name={{ ios: 'xmark', android: 'close', web: 'close' }} size={12} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('marketingComposeSection')}</Text>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t('marketingSubjectPlaceholder')}
          placeholderTextColor={Brand.textMuted}
          style={styles.input}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('marketingBodyPlaceholder')}
          placeholderTextColor={Brand.textMuted}
          multiline
          numberOfLines={6}
          style={[styles.input, styles.bodyInput]}
        />

        <Text style={styles.fieldLabel}>{t('marketingDesignLabel')}</Text>
        <View style={styles.designRow}>
          {DESIGNS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setDesign(option)}
              style={({ pressed }) => [styles.designChip, design === option && styles.designChipActive, pressed && styles.pressed]}>
              <Text style={[styles.designChipText, design === option && styles.designChipTextActive]}>
                {t(DESIGN_LABEL_KEYS[option])}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <TextInput
            value={ctaLabel}
            onChangeText={setCtaLabel}
            placeholder={t('marketingCtaLabelPlaceholder')}
            placeholderTextColor={Brand.textMuted}
            style={[styles.input, styles.ctaInput]}
          />
          <TextInput
            value={ctaUrl}
            onChangeText={setCtaUrl}
            placeholder={t('marketingCtaUrlPlaceholder')}
            placeholderTextColor={Brand.textMuted}
            autoCapitalize="none"
            style={[styles.input, styles.ctaInput]}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (sending || !subject.trim() || !body.trim()) && styles.sendButtonDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.sendButtonText}>{t('marketingSendButton', { count: String(contacts.length) })}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('marketingHistorySection')}</Text>

        {!loading && campaigns.length === 0 && <Text style={styles.empty}>{t('marketingHistoryEmpty')}</Text>}

        {campaigns.map((campaign) => (
          <View key={campaign.id} style={styles.historyRow}>
            <View style={styles.historyRowMain}>
              <Text style={styles.historySubject} numberOfLines={1}>
                {campaign.subject}
              </Text>
              <Text style={styles.historyMeta}>
                {t(DESIGN_LABEL_KEYS[campaign.design])} · {formatDate(campaign.createdAt)}
              </Text>
            </View>
            <Text style={styles.historyCount}>
              {campaign.recipientCount - campaign.failureCount}/{campaign.recipientCount}
            </Text>
          </View>
        ))}
      </ScrollView>

      <AppDialog
        visible={resultDialog !== null}
        title={resultDialog?.title ?? ''}
        message={resultDialog?.message}
        primaryAction={{ label: t('settingsOk'), onPress: () => setResultDialog(null) }}
        onRequestClose={() => setResultDialog(null)}
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
      gap: Spacing.two,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
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
      fontSize: 26,
      lineHeight: 32,
      fontFamily: Fonts.bold,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 19,
      fontFamily: Fonts.regular,
    },
    scrollContent: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six,
      gap: Spacing.two,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.two,
      backgroundColor: Brand.yellow,
      borderRadius: Spacing.three,
      padding: Spacing.three,
      marginBottom: Spacing.two,
    },
    warningText: {
      flex: 1,
      color: Brand.ink,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: Fonts.medium,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontFamily: Fonts.bold,
      marginTop: Spacing.four,
      marginBottom: Spacing.one,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.semiBold,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.regular,
      marginTop: Spacing.two,
    },
    bodyInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    addContactRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      alignItems: 'center',
    },
    addContactNameInput: {
      flex: 1,
    },
    addContactEmailInput: {
      flex: 1.4,
    },
    smallActionButton: {
      backgroundColor: Brand.ink,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      marginTop: Spacing.two,
    },
    smallActionButtonText: {
      color: Brand.white,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
      textDecorationLine: 'underline',
      marginTop: Spacing.two,
    },
    importBlock: {
      gap: Spacing.two,
    },
    importInput: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    empty: {
      color: Brand.textMuted,
      fontSize: 13,
      fontFamily: Fonts.regular,
      marginTop: Spacing.two,
    },
    contactChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.one,
      marginTop: Spacing.two,
    },
    contactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one,
      maxWidth: '100%',
    },
    contactChipText: {
      color: colors.text,
      fontSize: 12.5,
      fontFamily: Fonts.medium,
      maxWidth: 200,
    },
    designRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.one,
    },
    designChip: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    designChipActive: {
      backgroundColor: Brand.ink,
    },
    designChipText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },
    designChipTextActive: {
      color: Brand.white,
    },
    ctaRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    ctaInput: {
      flex: 1,
    },
    sendButton: {
      backgroundColor: Brand.green,
      borderRadius: 999,
      alignItems: 'center',
      paddingVertical: Spacing.three,
      marginTop: Spacing.three,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: Brand.ink,
      fontSize: 15,
      fontFamily: Fonts.bold,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.two,
      backgroundColor: colors.surface,
      borderRadius: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      marginTop: Spacing.two,
    },
    historyRowMain: {
      flex: 1,
      gap: 2,
    },
    historySubject: {
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    historyMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.regular,
    },
    historyCount: {
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.bold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
