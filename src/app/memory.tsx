import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppDialog } from '@/components/app-dialog';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { deleteAllMemories, deleteMemory, getMemories, type Memory } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function MemoryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getMemories()
        .then((result) => {
          if (!cancelled) setMemories(result);
        })
        .catch((error) => console.error('Failed to load memories:', error))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function handleDeleteOne(id: string) {
    const previous = memories;
    setMemories((current) => current.filter((memory) => memory.id !== id));
    try {
      await deleteMemory(id);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      setMemories(previous);
    }
  }

  async function handleDeleteAll() {
    setShowDeleteAllConfirm(false);
    const previous = memories;
    setMemories([]);
    try {
      await deleteAllMemories();
    } catch (error) {
      console.error('Failed to delete all memories:', error);
      setMemories(previous);
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

        <Text style={styles.title}>{t('memoryTitle')}</Text>
        <Text style={styles.intro}>{t('memoryIntro')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!loading && memories.length === 0 && <Text style={styles.empty}>{t('memoryEmpty')}</Text>}

        {memories.map((memory) => (
          <View key={memory.id} style={styles.card}>
            <Text style={styles.cardText}>{memory.content}</Text>
            <Pressable
              onPress={() => handleDeleteOne(memory.id)}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}>
              <SymbolView tintColor={Brand.textMuted} name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} />
            </Pressable>
          </View>
        ))}

        {memories.length > 0 && (
          <Pressable
            onPress={() => setShowDeleteAllConfirm(true)}
            style={({ pressed }) => [styles.deleteAllButton, pressed && styles.pressed]}>
            <SymbolView tintColor={Brand.red} name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={16} />
            <Text style={styles.deleteAllText}>{t('memoryDeleteAll')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <AppDialog
        visible={showDeleteAllConfirm}
        title={t('memoryDeleteAllConfirmTitle')}
        message={t('memoryDeleteAllConfirmMessage')}
        primaryAction={{ label: t('memoryDeleteAllConfirmButton'), destructive: true, onPress: handleDeleteAll }}
        secondaryAction={{ label: t('settingsCancel'), onPress: () => setShowDeleteAllConfirm(false) }}
        onRequestClose={() => setShowDeleteAllConfirm(false)}
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
      fontSize: 28,
      lineHeight: 34,
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
    empty: {
      color: Brand.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.regular,
      textAlign: 'center',
      marginTop: Spacing.six,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.three,
      backgroundColor: colors.surface,
      borderRadius: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    cardText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.regular,
    },
    deleteAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.one,
      marginTop: Spacing.three,
      paddingVertical: Spacing.three,
    },
    deleteAllText: {
      color: Brand.red,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
