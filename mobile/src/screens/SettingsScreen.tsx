import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { Badge } from '../components/Badge';
import { useWorkspaceProfile } from '../services/WorkspaceContext';

export const SettingsScreen: React.FC = () => {
  const profile = useWorkspaceProfile();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Settings</Text>

      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email ? user.email[0].toUpperCase() : 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{user?.email || 'User Account'}</Text>
            <Text style={styles.role}>Role: {profile?.role.replace(/_/g,' ') || 'Unavailable'}</Text>
          </View>
          <Badge label="Active" variant="success" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>System Environment</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Platform</Text>
          <Text style={styles.value}>Expo React Native</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Database</Text>
          <Text style={styles.value}>Supabase Cloud</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>v1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out of Workspace</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', padding: 16 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 14 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  email: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  role: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  label: { color: '#94a3b8', fontSize: 13 },
  value: { color: '#ffcc00', fontSize: 13, fontWeight: '600' },
  signOutBtn: { backgroundColor: '#7f1d1d', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  signOutText: { color: '#f87171', fontSize: 14, fontWeight: '700' },
});
