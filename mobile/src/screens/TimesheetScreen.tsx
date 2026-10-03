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
import { getTimesheets, createTimesheet } from '../services/timesheet.service';
import { getTasks } from '../services/tasks.service';
import { TimesheetWithRelations, TaskWithRelations } from '../types';
import { Badge } from '../components/Badge';

export const TimesheetScreen: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('2.5');
  const [startTime, setStartTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tsData, tData] = await Promise.all([getTimesheets(), getTasks()]);
      setTimesheets(tsData);
      setTasks(tData);
      if (tData.length > 0 && !taskId) setTaskId(tData[0].id);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!taskId) {
      Alert.alert('Error', 'Please select a task.');
      return;
    }

    setSubmitting(true);
    try {
      await createTimesheet({
        task_id: taskId,
        work_date: (() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; })(),
        start_time: startTime,
        total_hours: Number(hours),
        performance: 'green',
        notes: notes.trim() || null,
      });
      Alert.alert('Success', 'Hours logged successfully!');
      setModalVisible(false);
      setNotes('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to log hours.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Timesheet Logs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Log Hours</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {timesheets.map((ts) => (
          <View key={ts.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.date}>{ts.work_date}</Text>
                <Text style={styles.taskTitle}>{ts.task?.title || 'Task'}</Text>
              </View>
              <Badge label={`${ts.total_hours} hrs`} variant="info" />
            </View>
            {ts.notes ? <Text style={styles.notes}>Notes: {ts.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Work Hours</Text>

            <Text style={styles.label}>Hours Spent</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.5"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={hours}
              onChangeText={setHours}
            />

            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00 AM"
              placeholderTextColor="#64748b"
              value={startTime}
              onChangeText={setStartTime}
            />

            <Text style={styles.label}>Work Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Summary of work performed..."
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', padding: 16 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  addBtn: { backgroundColor: '#ffcc00', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  scrollList: { flex: 1 },
  card: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: '#ffcc00', fontSize: 11, fontWeight: '700' },
  taskTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  notes: { color: '#94a3b8', fontSize: 12, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, color: '#ffffff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b' },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ffcc00' },
  submitBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
});
