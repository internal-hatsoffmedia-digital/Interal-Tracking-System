import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  label: string;
  type?: 'success' | 'warning' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'info' }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'success':
        return { bg: '#fff7d6', text: '#111111', border: '#ffcc00' };
      case 'warning':
        return { bg: '#fff7d6', text: '#111111', border: '#ffcc00' };
      case 'neutral':
        return { bg: '#fff7d6', text: '#111111', border: '#ffcc00' };
      default:
        return { bg: '#fff7d6', text: '#111111', border: '#ffcc00' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
