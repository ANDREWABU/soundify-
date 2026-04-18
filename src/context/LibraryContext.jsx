import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);
const LS_KEY = 'soundify_guest_library';

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const isGuest = user?.id === 'guest';

  useEffect(() => {
    if (!user) { setSongs([]); return; }

    if (isGuest) {
      try { setSongs(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch { setSongs([]); }
      return;
    }

    supabase
      .from('library')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
      .then(({ data }) => setSongs(data || []));
  }, [user]);

  const addSong = async (song) => {
    if (!user) return;
    const isDup = songs.some((s) => s.title === song.title && s.artist === song.artist);
    if (isDup) return;

    if (isGuest) {
      const entry = { id: Date.now(), title: song.title, artist: song.artist, album: song.album || null, spotify_data: song.spotify || null, saved_at: Date.now() };
      const updated = [entry, ...songs];
      setSongs(updated);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return;
    }

    const row = {
      user_id: user.id,
      title: song.title,
      artist: song.artist,
      album: song.album || null,
      spotify_data: song.spotify || null,
      saved_at: Date.now(),
    };

    const { data, error } = await supabase.from('library').insert(row).select().single();
    if (!error && data) setSongs((prev) => [data, ...prev]);
  };

  const removeSong = async (id) => {
    if (isGuest) {
      const updated = songs.filter((s) => s.id !== id);
      setSongs(updated);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return;
    }
    await supabase.from('library').delete().eq('id', id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const clearLibrary = async () => {
    if (!user) return;
    if (isGuest) {
      setSongs([]);
      localStorage.removeItem(LS_KEY);
      return;
    }
    await supabase.from('library').delete().eq('user_id', user.id);
    setSongs([]);
  };

  const normalisedSongs = songs.map((s) => ({
    ...s,
    spotify: s.spotify_data,
    savedAt: s.saved_at,
  }));

  return (
    <LibraryContext.Provider value={{ songs: normalisedSongs, addSong, removeSong, clearLibrary }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);
