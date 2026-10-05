import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { useWorkspaceProfile } from '../services/WorkspaceContext';
import { CoordinatorOverview } from '../components/CoordinatorOverview';

interface DashboardScreenProps {
  onNavigate?: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const profile = useWorkspaceProfile();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    tasks: 0,
    employees: 0,
    leads: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, cRes, tRes, eRes, lRes, pData] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active',true),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('sales_leads').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('id, name, status, completed_assets, total_assets_required').eq('is_active',true).order('created_at',{ascending:false}).limit(5),
      ]);
      const failure = [pRes,cRes,tRes,eRes,lRes,pData].find(result => result.error)?.error;
      if (failure) throw new Error(failure.message);

      setStats({
        projects: pRes.count ?? 0,
        clients: cRes.count ?? 0,
        tasks: tRes.count ?? 0,
        employees: eRes.count ?? 0,
        leads: lRes.count ?? 0,
      });

      setRecentProjects(pData.data ?? []);
    } catch (e: any) {
      setError(e.message || 'Unable to load workspace metrics. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboardData} tintColor="#ffcc00" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Workspace Overview</Text>
        <Text style={styles.subtitle}>Production metrics & real-time operation</Text>
        <Text style={styles.subtitle}>{profile?.full_name} · {profile?.role.replace(/_/g,' ')}</Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={{color:'#ffcc00',marginBottom:12}}>{error}</Text> : null}
      <CoordinatorOverview />

      <View style={styles.statsGrid}>
        <StatCard title="Projects" value={stats.projects} accentColor="#ffcc00" subtitle="Accessible active projects" />
        <StatCard title="Tasks" value={stats.tasks} accentColor="#ffcc00" subtitle="Work items" />
      </View>
      <View style={[styles.statsGrid, { marginTop: 10 }]}>
        <StatCard title="Clients" value={stats.clients} accentColor="#ffcc00" subtitle="Active accounts" />
        <StatCard title="Team" value={stats.employees} accentColor="#a855f7" subtitle="Employees" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        {onNavigate && (
          <TouchableOpacity onPress={() => onNavigate('projects')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentProjects.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.projectName}>{p.name}</Text>
            <Badge label={p.status || 'Active'} variant={p.status === 'completed' ? 'success' : 'info'} />
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Assets: {p.completed_assets || 0} / {p.total_assets_required || 0}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      p.total_assets_required > 0
                        ? ((p.completed_assets || 0) / p.total_assets_required) * 100
                        : 0
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ))}

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
        <View style={styles.shortcutRow}>
          <TouchableOpacity style={styles.shortcutBtn} onPress={() => onNavigate?.('tasks')}>
            <Text style={styles.shortcutText}>📋 My Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutBtn} onPress={() => onNavigate?.('timesheet')}>
            <Text style={styles.shortcutText}>⏱️ Log Hours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutBtn} onPress={() => onNavigate?.('sales')}>
            <Text style={styles.shortcutText}>💼 Sales</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#ffcc00',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectName: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#fff7d6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffcc00',
    borderRadius: 3,
  },
  quickActionsContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#fff7d6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  shortcutText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600',
  },
});
