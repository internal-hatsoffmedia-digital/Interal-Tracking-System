import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your work email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.session) {
        onLoginSuccess();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandHeader}>
        <Image source={require('../../assets/hatsoff-logo.png')} accessibilityLabel="Hatsoff Media" style={{width:92,height:72,resizeMode:'contain',alignSelf:'center',marginBottom:12}} />
        <Text style={styles.brandSubtitle}>INTERNAL FORCE MOBILE</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Enter your work credentials to access workspace.</Text>

        <Text style={styles.label}>Work Email</Text>
        <TextInput
          accessibilityLabel="Work Email"
          autoCorrect={false}
          editable={!loading}
          style={styles.input}
          placeholder="you@hatsoffmedia.in"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          editable={!loading}
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {errorMessage ? <Text accessibilityRole="alert" style={{color:'#ffcc00',marginBottom:12}}>{errorMessage}</Text> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sign In" style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandTitle: {
    color: '#111111',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#ffcc00',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 24,
  },
  label: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    color: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ffcc00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
});
