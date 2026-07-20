import type { Element, Root, Text as HastText } from 'hast';
import { useMemo, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { refractor } from 'refractor/core';
import java from 'refractor/java';
import javascript from 'refractor/javascript';
import json from 'refractor/json';
import kotlin from 'refractor/kotlin';
import python from 'refractor/python';
import sql from 'refractor/sql';
import typescript from 'refractor/typescript';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { t } from '@/lib/i18n';

let grammarsRegistered = false;
function ensureGrammars() {
  if (grammarsRegistered) return;
  refractor.register(javascript);
  refractor.register(typescript);
  refractor.register(python);
  refractor.register(kotlin);
  refractor.register(java);
  refractor.register(sql);
  refractor.register(json);
  grammarsRegistered = true;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  kt: 'kotlin',
  kts: 'kotlin',
  kotlin: 'kotlin',
  java: 'java',
  sql: 'sql',
  json: 'json',
};

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  kotlin: 'Kotlin',
  java: 'Java',
  sql: 'SQL',
  json: 'JSON',
};

// Prism token class -> a small fixed role palette, one per theme mode.
// These are calibrated against `surfaceElevated`, not the theme's accent
// tokens - a code editor's syntax colors stay their own thing regardless of
// the app's accent theme.
const TOKEN_ROLE: Record<string, string> = {
  keyword: 'keyword',
  atrule: 'keyword',
  string: 'string',
  char: 'string',
  'attr-value': 'string',
  regex: 'string',
  comment: 'comment',
  prolog: 'comment',
  doctype: 'comment',
  cdata: 'comment',
  number: 'number',
  boolean: 'number',
  constant: 'number',
  function: 'function',
  'class-name': 'className',
  'maybe-class-name': 'className',
  builtin: 'builtin',
  property: 'builtin',
  'property-access': 'builtin',
  tag: 'builtin',
  symbol: 'builtin',
  operator: 'punctuation',
  punctuation: 'punctuation',
};

const ROLE_COLORS_LIGHT: Record<string, string> = {
  keyword: '#a626a4',
  string: '#50a14f',
  comment: '#a0a1a7',
  number: '#986801',
  function: '#4078f2',
  className: '#c18401',
  builtin: '#0184bc',
  punctuation: '#3A382F',
};

const ROLE_COLORS_DARK: Record<string, string> = {
  keyword: '#c678dd',
  string: '#98c379',
  comment: '#5c6370',
  number: '#d19a66',
  function: '#61afef',
  className: '#e5c07b',
  builtin: '#56b6c2',
  punctuation: '#abb2bf',
};

type FlatToken = { text: string; role: string | null };

function flattenHast(node: Root | Element | HastText, role: string | null): FlatToken[] {
  if (node.type === 'text') {
    return [{ text: node.value, role }];
  }
  if (node.type === 'root' || node.type === 'element') {
    let nextRole = role;
    if (node.type === 'element') {
      const raw = node.properties?.className;
      const classes = Array.isArray(raw) ? raw.map(String) : [];
      const specific = classes.find((cls) => cls !== 'token' && TOKEN_ROLE[cls]);
      if (specific) nextRole = TOKEN_ROLE[specific];
    }
    return node.children.flatMap((child) => flattenHast(child as Element | HastText, nextRole));
  }
  return [];
}

function tokensToLines(tokens: FlatToken[]): FlatToken[][] {
  const lines: FlatToken[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, role: token.role });
    });
  }
  return lines;
}

function highlightLines(code: string, language: string): FlatToken[][] {
  const resolved = LANGUAGE_ALIASES[language];
  if (!resolved) return tokensToLines([{ text: code, role: null }]);
  ensureGrammars();
  try {
    const tree = refractor.highlight(code, resolved);
    return tokensToLines(flattenHast(tree, null));
  } catch {
    return tokensToLines([{ text: code, role: null }]);
  }
}

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const { resolvedScheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const roleColors = resolvedScheme === 'dark' ? ROLE_COLORS_DARK : ROLE_COLORS_LIGHT;
  const [copied, setCopied] = useState(false);

  const resolvedLanguage = LANGUAGE_ALIASES[language] ?? null;
  const label = resolvedLanguage ? LANGUAGE_LABELS[resolvedLanguage] : language === 'text' ? t('chatCodeLanguageText') : language;
  const lines = useMemo(() => highlightLines(code, language), [code, language]);

  function handleCopy() {
    void Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.languageLabel}>{label}</Text>
        <AnimatedPressable onPress={handleCopy} style={styles.copyButton}>
          <SymbolView
            tintColor={colors.textSecondary}
            name={copied ? { ios: 'checkmark', android: 'check', web: 'check' } : { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
            size={13}
          />
          <Text style={styles.copyButtonText}>{copied ? t('chatActionCopied') : t('chatCopyMessage')}</Text>
        </AnimatedPressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.body}>
        <View style={styles.gutter}>
          {lines.map((_, index) => (
            <Text key={index} style={styles.lineNumber}>
              {index + 1}
            </Text>
          ))}
        </View>
        <View>
          {lines.map((line, index) => (
            <View key={index} style={styles.codeLine}>
              {line.length === 0 ? (
                <Text style={styles.codeText}> </Text>
              ) : (
                line.map((token, tokenIndex) => (
                  <Text
                    key={tokenIndex}
                    style={[styles.codeText, token.role ? { color: roleColors[token.role] } : null]}>
                    {token.text}
                  </Text>
                ))
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.three,
      overflow: 'hidden',
      marginVertical: Spacing.one,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    languageLabel: {
      color: colors.textSecondary,
      fontSize: 11.5,
      fontFamily: Fonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.04,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.half,
    },
    copyButtonText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.medium,
    },
    body: {
      flexDirection: 'row',
      paddingVertical: Spacing.two,
    },
    gutter: {
      paddingLeft: Spacing.three,
      paddingRight: Spacing.two,
    },
    lineNumber: {
      color: colors.textSecondary,
      opacity: 0.55,
      fontSize: 12.5,
      lineHeight: 19,
      fontFamily: Fonts.mono,
      textAlign: 'right',
    },
    codeLine: {
      flexDirection: 'row',
      paddingRight: Spacing.three,
    },
    codeText: {
      color: colors.text,
      fontSize: 12.5,
      lineHeight: 19,
      fontFamily: Fonts.mono,
    },
  });
}
