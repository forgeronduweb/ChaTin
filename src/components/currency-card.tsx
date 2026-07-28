import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { Brand, Fonts, Spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';
import type { CurrencySpec } from '@/lib/message-content';

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    const start = Date.now();

    function tick() {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const cardEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 12 }, { scale: 0.94 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(420);

// Trims to at most 2 decimals without padding whole numbers ("92" not "92.00").
function formatAmount(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CurrencyCard({ currency }: { currency: CurrencySpec }) {
  const styles = useMemo(() => createStyles(), []);
  const result = useCountUp(currency.result);

  return (
    <Animated.View entering={cardEntrance} style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.pair} numberOfLines={1}>
            {currency.from} → {currency.to}
          </Text>
          <Text style={styles.label}>{t('currencyLabel')}</Text>
        </View>
        <SymbolView
          tintColor={Brand.white}
          name={{ ios: 'arrow.left.arrow.right', android: 'currency_exchange', web: 'currency_exchange' }}
          size={28}
        />
      </View>

      <Text style={styles.result} numberOfLines={1}>
        {formatAmount(result)} <Text style={styles.resultCode}>{currency.to}</Text>
      </Text>

      <Text style={styles.detail}>
        {formatAmount(currency.amount)} {currency.from} · {t('currencyRate', { from: currency.from, rate: formatAmount(currency.rate), to: currency.to })}
      </Text>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: Brand.green,
      borderRadius: Spacing.four,
      padding: Spacing.four,
      gap: Spacing.one,
      marginVertical: Spacing.one,
      maxWidth: 280,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    pair: {
      color: Brand.white,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    label: {
      color: Brand.white,
      fontSize: 13,
      fontFamily: Fonts.medium,
      opacity: 0.85,
    },
    result: {
      color: Brand.white,
      fontSize: 40,
      lineHeight: 46,
      fontFamily: Fonts.extraBold,
    },
    resultCode: {
      fontSize: 18,
      fontFamily: Fonts.bold,
    },
    detail: {
      color: Brand.white,
      fontSize: 12,
      fontFamily: Fonts.medium,
      opacity: 0.9,
      marginTop: Spacing.one,
    },
  });
}
