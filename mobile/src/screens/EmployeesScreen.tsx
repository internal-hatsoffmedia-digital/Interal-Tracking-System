import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getEmployees } from '../services/employees.service';
import { Employee } from '../types';
import { Badge } from '../components/Badge';

export const EmployeesScreen: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState('');

  const fetchData = async () => {
    setLoading(true);setError('');
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e: any) {
      setError(e.message || 'Unable to load workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {error?<Text accessibilityRole="alert" style={{color:'#ffcc00',marginBottom:12}}>{error}</Text>:null}<Text style={styles.title}>Employee Roster</Text>
      <ScrollView
        style={styles.scrollList}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ffcc00" />}
      >
        {employees.map((emp) => (
          <View key={emp.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{emp.full_name}</Text>
                <Text style={styles.code}>ID: {emp.employee_code}</Text>
              </View>
              <Badge label={emp.job_title || 'Team Member'} variant="info" />
            </View>
            <View style={styles.contactBox}>
              <Text style={styles.contactText}>✉️ {emp.email}</Text>
              {emp.phone ? <Text style={styles.contactText}>📞 {emp.phone}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  title: { color: '#111111', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  scrollList: { flex: 1 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#333333', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { color: '#111111', fontSize: 16, fontWeight: '700' },
  code: { color: '#ffcc00', fontSize: 11, fontWeight: '600', marginTop: 2 },
  contactBox: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333333', gap: 4 },
  contactText: { color: '#94a3b8', fontSize: 12 },
});
