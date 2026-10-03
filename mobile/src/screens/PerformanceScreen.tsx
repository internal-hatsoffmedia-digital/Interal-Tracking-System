import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getPerformanceRecords } from '../services/performance.service';
import { PerformanceRecordWithRelations } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const PerformanceScreen: React.FC = () => {
  const [records, setRecords] = useState<PerformanceRecordWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPerformanceRecords();
      setRecords(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Performance</Text>
      <View style={styles.statsRow}>
        <StatCard title="KPI Score" value="94%" accentColor="#10b981" subtitle="Optimal output" />
        <StatCard title="On-Time" value="98%" accentColor="#ffcc00" subtitle="Deadline compliance" />
      </View>
      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Performance Metrics Active</Text>
            <Text style={styles.emptyText}>Team productivity logs & weekly evaluations are synced automatically.</Text>
          </View>
        ) : (
          records.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.empName}>{r.employee?.full_name || 'Employee'}</Text>
                <Badge label={r.performance || 'Green'} variant="success" />
              </View>
              <Text style={styles.meta}>Tasks Completed: {r.tasks_completed}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', padding: 16 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scrollList: { flex: 1 },
  emptyCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  card: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
