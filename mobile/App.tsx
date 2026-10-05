import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, AppState, Platform, BackHandler } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { getWorkspaceProfile } from './src/services/profile.service';
import { WorkspaceProfile } from './src/services/access';
import { WorkspaceContext } from './src/services/WorkspaceContext';
import { supabase } from './src/services/supabase';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { TeamsScreen } from './src/screens/TeamsScreen';
import { EmployeesScreen } from './src/screens/EmployeesScreen';
import { TimesheetScreen } from './src/screens/TimesheetScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { SalesScreen } from './src/screens/SalesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WorkScreen } from './src/screens/WorkScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { PlannerScreen } from './src/screens/PlannerScreen';
import { TeamDirectoryScreen } from './src/screens/TeamDirectoryScreen';
import { UpdatesScreen } from './src/screens/UpdatesScreen';

type Tab =
  | 'updates'
  | 'reports'
  | 'planner'
  | 'my-team'
  | 'team-members'
  | 'dashboard'
  | 'my-work'
  | 'team-work'
  | 'projects'
  | 'tasks'
  | 'clients'
  | 'teams'
  | 'employees'
  | 'timesheet'
  | 'performance'
  | 'sales'
  | 'settings';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [accessError, setAccessError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showMoreMenu) { setShowMoreMenu(false); return true; }
      if (activeTab !== 'dashboard') { setActiveTab('dashboard'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [activeTab, showMoreMenu]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return;
      if (error) setAccessError(error.message);
      setSession(s);
      setLoading(false);
    }).catch((error: Error) => {
      if (mounted) { setAccessError(error.message); setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setAccessError('');
    setProfileLoading(true);
    if (!session?.user.id) { setProfileLoading(false); return; }
    getWorkspaceProfile(session.user.id).then((value) => {
      if (!cancelled) setProfile(value);
    }).catch((error: Error) => {
      if (!cancelled) setAccessError(error.message);
    }).finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [session?.user.id, retry]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const refresh = (state: string) => {
      if (state === 'active') { supabase.auth.startAutoRefresh(); setRetry(value => value + 1); }
      else supabase.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', refresh);
    return () => { subscription.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { setAccessError(error.message); return; }
    setActiveTab('dashboard');
    setShowMoreMenu(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading Hatsoff Internal Force...</Text>
      </View>
    );
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  if (profileLoading || profile?.id !== session.user.id) {
    return <View style={styles.center}>
      <Text style={styles.loadingText}>{accessError || 'Checking workspace access…'}</Text>
      {accessError ? <>
        <TouchableOpacity onPress={() => setRetry(value => value + 1)}><Text style={styles.loadingText}>Retry access check</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut}><Text style={styles.loadingText}>Sign Out</Text></TouchableOpacity>
      </> : null}
    </View>;
  }

  const navigateTo = (tab: string) => {
    setActiveTab(tab as Tab);
    setShowMoreMenu(false);
  };

  return (
    <WorkspaceContext.Provider value={profile}>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* TOP BRAND BAR */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Image source={require('./assets/hatsoff-logo.png')} accessibilityLabel="Hatsoff Media" style={{width:44,height:36,resizeMode:'contain'}} />
          <View style={styles.dot} />
          <Text style={styles.brandSub}>INTERNAL FORCE</Text>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

            {/* Compact mobile navigation; the full directory is under More. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topNavStrip}>
        {([['dashboard','Dashboard'],['my-work','My Work'],['team-work','Team Work'],['planner','Planner']] as const).map(([key,label])=><TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{selected:activeTab===key}} style={[styles.chip,activeTab===key&&styles.activeChip]} onPress={()=>navigateTo(key)}><Text style={[styles.chipText,activeTab===key&&styles.activeChipText]}>{label}</Text></TouchableOpacity>)}
      </ScrollView>

      {/* SCREEN BODY */}
      <View style={styles.screenBody} key={session.user.id}>
        {activeTab === 'updates' && <UpdatesScreen onNavigate={navigateTo} />}
        {activeTab === 'reports' && <ReportsScreen />}
        {activeTab === 'planner' && <PlannerScreen />}
        {activeTab === 'my-team' && <TeamDirectoryScreen ownTeam />}
        {activeTab === 'team-members' && <TeamDirectoryScreen />}
        {activeTab === 'my-work' && <WorkScreen ownOnly />}
        {activeTab === 'team-work' && <WorkScreen ownOnly={false} />}
        {activeTab === 'dashboard' && <DashboardScreen onNavigate={navigateTo} />}
        {activeTab === 'projects' && <ProjectsScreen />}
        {activeTab === 'tasks' && <TasksScreen />}
        {activeTab === 'clients' && <ClientsScreen />}
        {activeTab === 'teams' && <TeamsScreen />}
        {activeTab === 'employees' && <EmployeesScreen />}
        {activeTab === 'timesheet' && <TimesheetScreen />}
        {activeTab === 'performance' && <PerformanceScreen />}
        {activeTab === 'sales' && <SalesScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.activeTabItem]}
          onPress={() => navigateTo('dashboard')}
        >
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'projects' && styles.activeTabItem]}
          onPress={() => navigateTo('projects')}
        >
          <Text style={[styles.tabLabel, activeTab === 'projects' && styles.activeTabLabel]}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tasks' && styles.activeTabItem]}
          onPress={() => navigateTo('tasks')}
        >
          <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.activeTabLabel]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'clients' && styles.activeTabItem]}
          onPress={() => navigateTo('clients')}
        >
          <Text style={[styles.tabLabel, activeTab === 'clients' && styles.activeTabLabel]}>Clients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, (activeTab === 'settings' || activeTab === 'sales' || activeTab === 'timesheet') && styles.activeTabItem]}
          onPress={() => setShowMoreMenu(!showMoreMenu)}
        >
          <Text style={[styles.tabLabel, (activeTab === 'settings' || activeTab === 'sales' || activeTab === 'timesheet') && styles.activeTabLabel]}>
            More ☰
          </Text>
        </TouchableOpacity>
      </View>

      {/* MORE MODULES POPUP MENU */}
      {showMoreMenu && (
        <View style={styles.moreMenuOverlay}>
          <TouchableOpacity style={styles.moreMenuBackdrop} onPress={() => setShowMoreMenu(false)} />
          <ScrollView style={[styles.moreMenuContent,{maxHeight:'80%'}]}>
            <Text style={styles.moreMenuTitle}>All Workspaces & Modules</Text>
            {([['updates','Updates'],['my-work','My Work'],['team-work','Team Work'],['clients','Clients'],['reports','Reports'],['planner','Planner'],['my-team','My Team'],['team-members','Team Members']] as const).map(([key,label]) => <TouchableOpacity key={key} accessibilityRole="button" style={styles.menuItem} onPress={()=>navigateTo(key)}><Text style={styles.menuItemText}>{label}</Text></TouchableOpacity>)}

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('timesheet')}>
              <Text style={styles.menuItemText}>⏱️ Timesheet Logs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('teams')}>
              <Text style={styles.menuItemText}>👥 Teams & Divisions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('employees')}>
              <Text style={styles.menuItemText}>🆔 Employee Directory</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('performance')}>
              <Text style={styles.menuItemText}>📈 Team Performance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('sales')}>
              <Text style={styles.menuItemText}>💼 Sales Workspace</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('settings')}>
              <Text style={styles.menuItemText}>⚙️ Account Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
    </WorkspaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  center: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#111111',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffcc00',
  },
  brandSub: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  signOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  signOutText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  topNavStrip: {
    maxHeight: 44,
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#333333',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: '#ffcc00',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#111111',
    fontWeight: '800',
  },
  screenBody: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#333333',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#ffcc00',
    fontWeight: '700',
  },
  moreMenuOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 50,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  moreMenuBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  moreMenuContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  moreMenuTitle: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
