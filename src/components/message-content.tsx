import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChatChart } from '@/components/chat-chart';
import { CodeBlock } from '@/components/code-block';
import { DataTable } from '@/components/data-table';
import { Fonts, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { parseMessageContent, type InlineSpan } from '@/lib/message-content';

export const MessageContent = memo(function MessageContent({ text }: { text: string }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const segments = useMemo(() => parseMessageContent(text), [text]);

  return (
    <View style={styles.wrap}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'paragraph':
            return (
              <Text key={index} style={styles.paragraph}>
                {segment.inlines.map((span, spanIndex) => (
                  <InlineText key={spanIndex} span={span} styles={styles} />
                ))}
              </Text>
            );
          case 'code':
            return <CodeBlock key={index} language={segment.language} code={segment.code} />;
          case 'table':
            return <DataTable key={index} headers={segment.headers} alignments={segment.alignments} rows={segment.rows} />;
          case 'chart':
            return <ChatChart key={index} chart={segment.chart} />;
          default:
            return null;
        }
      })}
    </View>
  );
});

function InlineText({ span, styles }: { span: InlineSpan; styles: ReturnType<typeof createStyles> }) {
  if (span.code) return <Text style={styles.inlineCode}>{span.text}</Text>;
  if (span.bold) return <Text style={styles.bold}>{span.text}</Text>;
  if (span.italic) return <Text style={styles.italic}>{span.text}</Text>;
  return <Text>{span.text}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
    },
    paragraph: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.regular,
    },
    bold: {
      fontFamily: Fonts.bold,
    },
    italic: {
      fontStyle: 'italic',
    },
    inlineCode: {
      fontFamily: Fonts.mono,
      fontSize: 13,
      backgroundColor: colors.surfaceElevated,
    },
  });
}
