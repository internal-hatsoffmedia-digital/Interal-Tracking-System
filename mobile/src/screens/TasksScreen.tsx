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
import { getTasks, createTask, updateTask } from '../services/tasks.service';
import { getProjects } from '../services/projects.service';
import { getClients } from '../services/clients.service';
import { TaskWithRelations, ProjectWithRelations, Client } from '../types';
import { Badge } from '../components/Badge';
import { useWorkspaceProfile } from '../services/WorkspaceContext';
import { canManageWork } from '../services/access';

export const TasksScreen: React.FC = () => {
  const canManage = canManageWork(useWorkspaceProfile());
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState('shorts_reels');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('not_started');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tData, pData, cData] = await Promise.all([getTasks(), getProjects(), getClients()]);
      setTasks(tData);
      setProjects(pData.filter(p => p.is_active));
      setClients(cData);
      const selected = pData.find(p => p.id === projectId && p.is_active) || pData.find(p => p.is_active);
      setProjectId(selected?.id || '');
      setClientId(selected?.client_id || '');
    } catch (e: any) {
      setError(e.message || 'Unable to load tasks. Pull to refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required.');
      return;
    }
    if (!projectId || !clientId) {
      Alert.alert('Error', 'Project and Client selections are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        project_id: projectId,
        client_id: clientId,
        category: category,
        priority: priority,
        status: status,
        revision_status: 'new_file',
      });
      Alert.alert('Success', 'Task created successfully!');
      setModalVisible(false);
      setTitle('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: TaskWithRelations) => {
    if (!canManage) return;
    const nextStatus = task.status === 'approved_delivered' ? 'editing_in_progress' : 'approved_delivered';
    try {
      await updateTask(task.id, { status: nextStatus });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update task status');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Tasks & Work</Text>
        {canManage && <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Task</Text>
        </TouchableOpacity>}
      </View>
      {error ? <Text accessibilityRole="alert" style={{color:'#ffcc00',marginBottom:12}}>{error}</Text> : null}

      <TextInput
        style={styles.searchInput}
        placeholder="Search tasks..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {['all', 'not_started', 'editing_in_progress', 'approved_delivered'].map((f) => (
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
        {filteredTasks.map((t) => (
          <View key={t.id} style={styles.taskCard}>
            <View style={styles.cardHeader}>
              <TouchableOpacity disabled={!canManage} style={styles.checkboxBtn} onPress={() => handleToggleStatus(t)}>
                <View style={[styles.checkbox, t.status === 'approved_delivered' && styles.checkboxChecked]}>
                  {t.status === 'approved_delivered' && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, t.status === 'approved_delivered' && styles.completedTitle]}>{t.title}</Text>
                <Text style={styles.subInfo}>
                  {t.project?.name || 'Project'} • {t.client?.name || 'Client'}
                </Text>
              </View>
              <Badge
                label={t.priority}
                variant={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'default'}
              />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.categoryText}>Tag: {t.category || 'General'}</Text>
              <Badge
                label={t.status}
                variant={t.status === 'approved_delivered' ? 'success' : t.status === 'editing_in_progress' ? 'info' : 'default'}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Task</Text>

            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Edit Teaser Video"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Select Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.selectChip, projectId === p.id && styles.selectChipActive]}
                  onPress={() => { setProjectId(p.id); setClientId(p.client_id); }}
                >
                  <Text style={[styles.selectChipText, projectId === p.id && styles.selectChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Select Client *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.selectChip, clientId === c.id && styles.selectChipActive]}
                  disabled
                >
                  <Text style={[styles.selectChipText, clientId === c.id && styles.selectChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="shorts_reels, graphic_design, etc."
              placeholderTextColor="#64748b"
              value={category}
              onChangeText={setCategory}
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
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxBtn: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffcc00',
  },
  checkmark: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },
  taskTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  subInfo: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 11,
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
