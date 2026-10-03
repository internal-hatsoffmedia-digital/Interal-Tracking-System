import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getSalesLeads } from '../services/sales.service';
import { SalesLead } from '../types';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';

export const SalesScreen: React.FC = () => {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getSalesLeads();
      setLeads(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = leads.reduce((sum, l) => sum + (l.revenue || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Workspace</Text>
      <View style={styles.statsRow}>
        <StatCard title="Pipeline Leads" value={leads.length} accentColor="#3b82f6" subtitle="Active pipeline" />
        <StatCard title="Value" value={`$${totalRevenue}`} accentColor="#10b981" subtitle="Total opportunity" />
      </View>
      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {leads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sales Tracker Ready</Text>
            <Text style={styles.emptyText}>Leads, proposals, and won deals will populate here from Supabase.</Text>
          </View>
        ) : (
          leads.map((l) => (
            <View key={l.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadName}>{l.name}</Text>
                  <Text style={styles.company}>{l.company}</Text>
                </View>
                <Badge
                  label={l.stage}
                  variant={l.stage === 'won' ? 'success' : l.stage === 'proposal' ? 'warning' : 'info'}
                />
              </View>
              <View style={styles.footer}>
                <Text style={styles.source}>Source: {l.source}</Text>
                <Text style={styles.revenue}>${l.revenue}</Text>
              </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leadName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  company: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  source: { color: '#64748b', fontSize: 11 },
  revenue: { color: '#ffcc00', fontSize: 14, fontWeight: '700' },
});
