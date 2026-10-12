import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import {
  getCurrentProfile,
  signOut as authSignOut,
} from "../services/auth/auth.service";

import type { Profile } from "../types/auth";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  const [sessionReady, setSessionReady] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const profileRequest = useRef(0);
  const [loadedProfileFor, setLoadedProfileFor] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authEvents = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Auth callbacks must return immediately: Supabase still holds its session lock.
        if (!mounted) return;
        authEvents++;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setSessionReady(true);
      },
    );
    const initialRevision = authEvents;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || authEvents !== initialRevision) return;
      if (error) console.error("Failed to initialize authentication:", error);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setSessionReady(true);
    }).catch(error => {
      if (mounted && authEvents === initialRevision) {
        console.error("Failed to initialize authentication:", error);
        setSessionReady(true);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const request = ++profileRequest.current;
    if (!sessionReady) return;
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    setProfile(null);
    getCurrentProfile().then(currentProfile => {
      if (profileRequest.current === request) setProfile(currentProfile);
    }).catch(error => {
      if (profileRequest.current === request) {
        console.error("Failed to load profile:", error);
        setProfile(null);
      }
    }).finally(() => {
      if (profileRequest.current === request) { setLoadedProfileFor(user.id); setLoading(false); }
    });
    return () => { profileRequest.current++; };
  }, [user?.id, sessionReady, profileRevision]);

  const signOut = async () => {
    await authSignOut();

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    setProfileRevision(revision => revision + 1);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile: profile?.id === user?.id ? profile : null,
        loading: !sessionReady || loading || (!!user && loadedProfileFor !== user.id),
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}