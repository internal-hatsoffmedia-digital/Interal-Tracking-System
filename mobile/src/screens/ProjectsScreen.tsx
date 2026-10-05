import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getProjects, createProject } from '../services/projects.service';
import { getClients } from '../services/clients.service';
import { ProjectWithRelations, Client } from '../types';
import { Badge } from '../components/Badge';
import { useWorkspaceProfile } from '../services/WorkspaceContext';
import { canManageWork } from '../services/access';

export const ProjectsScreen: React.FC = () => {
  const profile = useWorkspaceProfile();
  const canManage = canManageWork(profile);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [totalAssets, setTotalAssets] = useState('10');
  const [status, setStatus] = useState('planning');
  const [health, setHealth] = useState('on_track');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pData, cData] = await Promise.all([getProjects(), getClients()]);
      setProjects(pData);
      setClients(cData);
      if (cData.length > 0 && !clientId) {
        setClientId(cData[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Unable to load projects. Pull to refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Project name is required.');
      return;
    }
    if (!clientId) {
      Alert.alert('Error', 'Please select a client.');
      return;
    }

    setSubmitting(true);
    try {
      await createProject({
        name: name.trim(),
        series_title: seriesTitle.trim() || null,
        client_id: clientId,
        total_assets_required: parseInt(totalAssets, 10) || 1,
        completed_assets: 0,
        status: status,
        health: health,
        invoice_status: 'pending_billing',
      });
      Alert.alert('Success', 'Project created successfully!');
      setModalVisible(false);
      setName('');
      setSeriesTitle('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Projects</Text>
        {canManage && <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Project</Text>
        </TouchableOpacity>}
      </View>
      {error ? <Text accessibilityRole="alert" style={{color:'#ffcc00',marginBottom:12}}>{error}</Text> : null}
      {canManage && profile?.role!=='admin' && !profile?.team_id ? <Text style={{color:'#ffcc00',marginBottom:12}}>Your coordinator team is missing. Ask your administrator to link your account before creating projects.</Text> : null}

      <TextInput
        style={styles.searchInput}
        placeholder="Search projects..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {['all', 'planning', 'in_progress', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
              {f.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {filteredProjects.map((p) => (
          <View key={p.id} style={styles.projectCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{p.name}</Text>
                {p.client && <Text style={styles.clientName}>{p.client.name}</Text>}
              </View>
              <Badge
                label={p.status}
                variant={p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'info' : 'warning'}
              />
            </View>

            {p.series_title ? <Text style={styles.seriesText}>Series: {p.series_title}</Text> : null}

            <View style={styles.assetsRow}>
              <Text style={styles.assetsText}>
                Assets: {p.completed_assets} / {p.total_assets_required}
              </Text>

              <Badge
                label={p.health || 'on_track'}
                variant={p.health === 'critical' ? 'danger' : p.health === 'at_risk' ? 'warning' : 'success'}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>New Project</Text>

            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Brand Video Campaign"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Select Client *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.selectChip, clientId === c.id && styles.selectChipActive]}
                  onPress={() => setClientId(c.id)}
                >
                  <Text style={[styles.selectChipText, clientId === c.id && styles.selectChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Series / Campaign Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Summer Release"
              placeholderTextColor="#64748b"
              value={seriesTitle}
              onChangeText={setSeriesTitle}
            />

            <Text style={styles.label}>Total Assets Required</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={totalAssets}
              onChangeText={setTotalAssets}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#111111" /> : <Text style={styles.submitBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: '#ffcc00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 10,
    color: '#111111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  activeFilterTab: {
    backgroundColor: '#fff7d6',
    borderWidth: 1,
    borderColor: '#ffcc00',
  },
  filterText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#ffcc00',
  },
  scrollList: {
    flex: 1,
  },
  projectCard: {
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
    alignItems: 'flex-start',
  },
  projectName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  clientName: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  seriesText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  assetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  assetsText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff7d6',
    borderRadius: 10,
    color: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  selectChip: {
    backgroundColor: '#fff7d6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  selectChipActive: {
    backgroundColor: '#ffcc00',
  },
  selectChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: '#111111',
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff7d6',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffcc00',
  },
  submitBtnText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },
});
