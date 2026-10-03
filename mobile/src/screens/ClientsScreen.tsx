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
import { getClients, createClient } from '../services/clients.service';
import { Client } from '../types';
import { Badge } from '../components/Badge';

export const ClientsScreen: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data);
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
    if (!name.trim()) {
      Alert.alert('Error', 'Client name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createClient({
        name: name.trim(),
        short_name: shortName.trim() || null,
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      Alert.alert('Success', 'Client added successfully!');
      setModalVisible(false);
      setName('');
      setShortName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add client.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Clients Directory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Client</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search clients..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {filteredClients.map((c) => (
          <View key={c.id} style={styles.clientCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.clientName}>{c.name}</Text>
                {c.short_name ? <Text style={styles.shortName}>Code: {c.short_name}</Text> : null}
              </View>
              <Badge label={c.is_active ? 'Active' : 'Inactive'} variant={c.is_active ? 'success' : 'default'} />
            </View>

            <View style={styles.detailsBox}>
              {c.contact_person ? <Text style={styles.detailText}>👤 {c.contact_person}</Text> : null}
              {c.email ? <Text style={styles.detailText}>✉️ {c.email}</Text> : null}
              {c.phone ? <Text style={styles.detailText}>📞 {c.phone}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Client</Text>

            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Corp"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Short Name / Abbr</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ACME"
              placeholderTextColor="#64748b"
              value={shortName}
              onChangeText={setShortName}
            />

            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#64748b"
              value={contactPerson}
              onChangeText={setContactPerson}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="contact@acme.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.submitBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    padding: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
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
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  scrollList: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  shortName: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  detailsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 4,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    color: '#ffffff',
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
    backgroundColor: '#1e293b',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    backgroundColor: '#1e293b',
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
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
});
