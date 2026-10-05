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
        return { bg: '#fff7d6', text: '#111111' };
      case 'warning':
        return { bg: '#fff7d6', text: '#111111' };
      case 'danger':
        return { bg: '#fff7d6', text: '#111111' };
      case 'info':
        return { bg: '#fff7d6', text: '#111111' };
      default:
        return { bg: '#fff7d6', text: '#111111' };
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
