import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
}

export function StatCard({ title, value, subtitle, accentColor = '#ffcc00' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.borderIndicator, { backgroundColor: accentColor }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
    minWidth: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  borderIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  title: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
});
