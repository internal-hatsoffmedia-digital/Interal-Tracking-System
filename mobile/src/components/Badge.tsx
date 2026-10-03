import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#065f46', text: '#34d399' };
      case 'warning':
        return { bg: '#78350f', text: '#fbbf24' };
      case 'danger':
        return { bg: '#7f1d1d', text: '#f87171' };
      case 'info':
        return { bg: '#1e3a8a', text: '#60a5fa' };
      default:
        return { bg: '#334155', text: '#cbd5e1' };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
