import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player } from '../types';
import { storageService } from '../services/storageService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Player | null;
  isAdmin: boolean;
  authLoading: boolean;
  usingSupabase: boolean;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (playerId: string) => void;
  logout: () => Promise<void>;
  allPlayers: Player[];
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  const loadSupabaseUser = async (userId: string) => {
    if (!supabase) {
      setCurrentUser(null);
      return false;
    }
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from('perfis').select('id, nome, email, telefone, avatar_url, criado_em').eq('id', userId).maybeSingle(),
      supabase.from('membros_grupo').select('classe, perfil, aprovado').eq('usuario_id', userId).eq('aprovado', true).maybeSingle(),
    ]);
    if (!profile || !membership) {
      setCurrentUser(null);
      return false;
    }
    setCurrentUser({
      id: profile.id,
      name: profile.nome,
      email: profile.email,
      phone: profile.telefone || undefined,
      avatarUrl: profile.avatar_url || undefined,
      tennisClass: membership.classe || 'A',
      isAdmin: membership.perfil === 'ADMINISTRADOR' || membership.perfil === 'PROPRIETARIO',
      createdAt: profile.criado_em,
    });
    return true;
  };

  const refreshAuth = () => {
    const players = storageService.getPlayers();
    setAllPlayers(players);

    const savedId = localStorage.getItem('quadraplay_current_user_id_v1');
    if (savedId) {
      const found = players.find((p) => p.id === savedId);
      if (found) {
        setCurrentUser(found);
        return;
      }
    }

    // Default to Carlos Mendes (Class B) or first player
    const defaultUser = players.find((p) => p.email === 'carlos.mendes@tangara.com') || players[0];
    if (defaultUser) {
      setCurrentUser(defaultUser);
      localStorage.setItem('quadraplay_current_user_id_v1', defaultUser.id);
    }
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) await loadSupabaseUser(data.session.user.id);
        setAuthLoading(false);
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) void loadSupabaseUser(session.user.id);
        else setCurrentUser(null);
      });
      return () => authListener.subscription.unsubscribe();
    }
    refreshAuth();
    setAuthLoading(false);
    const unsubscribe = storageService.subscribe(() => {
      refreshAuth();
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password = '') => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { success: false, error: 'E-mail ou senha inválidos.' };
      if (data.user && !(await loadSupabaseUser(data.user.id))) {
        await supabase.auth.signOut();
        return { success: false, error: 'Seu cadastro ainda não foi aprovado no grupo.' };
      }
      return { success: true };
    }
    const player = storageService.getPlayerByEmail(email);
    if (!player) {
      return { success: false, error: 'Jogador não encontrado com este e-mail.' };
    }
    setCurrentUser(player);
    localStorage.setItem('quadraplay_current_user_id_v1', player.id);
    return { success: true };
  };

  const switchUser = (playerId: string) => {
    const player = storageService.getPlayerById(playerId);
    if (player) {
      setCurrentUser(player);
      localStorage.setItem('quadraplay_current_user_id_v1', player.id);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('quadraplay_current_user_id_v1');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: !!currentUser?.isAdmin,
        authLoading,
        usingSupabase: isSupabaseConfigured,
        loginWithEmail,
        switchUser,
        logout,
        allPlayers,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
