import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getTeams } from '../services/teams.service';
import { Team } from '../types';
import { Badge } from '../components/Badge';

export const TeamsScreen: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTeams();
      setTeams(data);
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
      <Text style={styles.title}>Teams & Divisions</Text>
      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {teams.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.teamName}>{t.name}</Text>
              <Badge label={t.team_type || 'Core'} variant="info" />
            </View>
            {t.description ? <Text style={styles.desc}>{t.description}</Text> : null}
            <View style={styles.footer}>
              <Text style={styles.membersText}>Status: Active</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', padding: 16 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  scrollList: { flex: 1 },
  card: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  desc: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  footer: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  membersText: { color: '#64748b', fontSize: 11 },
});
