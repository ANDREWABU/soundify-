import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const GUEST_USER = { id: 'guest', email: 'demo@soundify.app' };
export const GUEST_PROFILE = { name: 'Demo User', username: 'soundify_demo', email: 'demo@soundify.app' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
    return data;
  };

  useEffect(() => {
    // Timeout so Supabase outages don't hang the app forever
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const signup = async (email, password, name, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const profileData = { id: data.user.id, name, username: username.toLowerCase(), email };
    const { error: profileError } = await supabase.from('profiles').insert(profileData);
    if (profileError) throw profileError;
    setProfile(profileData);
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await loadProfile(data.user.id);
  };

  const loginAsGuest = () => {
    setUser(GUEST_USER);
    setProfile(GUEST_PROFILE);
  };

  const logout = async () => {
    if (user?.id === 'guest') {
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
