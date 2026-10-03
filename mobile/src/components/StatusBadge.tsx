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
        return { bg: '#064e3b', text: '#34d399', border: '#047857' };
      case 'warning':
        return { bg: '#451a03', text: '#fbbf24', border: '#78350f' };
      case 'neutral':
        return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
      default:
        return { bg: '#172554', text: '#60a5fa', border: '#1d4ed8' };
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
