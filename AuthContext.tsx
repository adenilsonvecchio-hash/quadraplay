import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { storageService } from '../services/storageService';
import { supabaseAgendaService } from '../services/supabaseAgendaService';
import {
  initialPasswordSetupMode,
  isSupabaseConfigured,
  PasswordSetupMode,
  savePasswordSetupMode,
  supabase,
} from '../lib/supabase';

interface AuthContextType {
  currentUser: Player | null;
  isAdmin: boolean;
  authLoading: boolean;
  usingSupabase: boolean;
  groupId: string | null;
  passwordSetupMode: PasswordSetupMode;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  finishPasswordRecovery: () => Promise<void>;
  switchUser: (playerId: string) => void;
  logout: () => Promise<void>;
  allPlayers: Player[];
  refreshAuth: () => void;
  updateAvatar: (file: File | null) => Promise<{ success: boolean; error?: string }>;
  completeFirstAccess: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [passwordSetupMode, setPasswordSetupMode] = useState<PasswordSetupMode>(initialPasswordSetupMode);
  const passwordSetupModeRef = useRef<PasswordSetupMode>(initialPasswordSetupMode);

  const activatePasswordSetup = (mode: Exclude<PasswordSetupMode, null>) => {
    passwordSetupModeRef.current = mode;
    savePasswordSetupMode(mode);
    setPasswordSetupMode(mode);
  };

  const clearPasswordSetup = () => {
    passwordSetupModeRef.current = null;
    savePasswordSetupMode(null);
    setPasswordSetupMode(null);
  };

  const loadSupabaseUser = async (userId: string) => {
    if (!supabase) {
      setCurrentUser(null);
      return false;
    }
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from('perfis').select('id, nome, email, telefone, avatar_url, precisa_trocar_senha, criado_em').eq('id', userId).maybeSingle(),
      supabase.from('membros_grupo').select('grupo_id, classe, perfil, aprovado').eq('usuario_id', userId).eq('aprovado', true).maybeSingle(),
    ]);
    if (!profile || !membership) {
      setCurrentUser(null);
      setGroupId(null);
      return false;
    }
    const safeName = typeof profile.nome === 'string' && profile.nome.trim()
      ? profile.nome.trim()
      : (typeof profile.email === 'string' && profile.email.includes('@') ? profile.email.split('@')[0] : 'Jogador');
    const safeEmail = typeof profile.email === 'string' ? profile.email : '';
    const safeClass = ['A', 'B', 'C', 'D', 'E'].includes(membership.classe) ? membership.classe : 'A';

    setGroupId(membership.grupo_id);
    setCurrentUser({
      id: profile.id,
      name: safeName,
      email: safeEmail,
      phone: profile.telefone || undefined,
      avatarUrl: profile.avatar_url || undefined,
      mustChangePassword: profile.precisa_trocar_senha === true,
      tennisClass: safeClass,
      isAdmin: membership.perfil === 'ADMINISTRADOR' || membership.perfil === 'PROPRIETARIO',
      createdAt: profile.criado_em || new Date().toISOString(),
    });
    try {
      setAllPlayers(await supabaseAgendaService.getGroupPlayers(membership.grupo_id));
    } catch (error) {
      console.warn('Não foi possível carregar os jogadores do grupo.', error);
      setAllPlayers([]);
    }
    return true;
  };

  const refreshAuth = () => {
    const players = storageService.getPlayers();
    setGroupId('local-group');
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
    const defaultUser = players.find((p) => p.email === 'carlos.mendes@nossotenis.com.br') || players[0];
    if (defaultUser) {
      setCurrentUser(defaultUser);
      localStorage.setItem('quadraplay_current_user_id_v1', defaultUser.id);
    }
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.user && !passwordSetupModeRef.current) await loadSupabaseUser(data.session.user.id);
        setAuthLoading(false);
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') activatePasswordSetup('recovery');
        if (session?.user && !passwordSetupModeRef.current) void loadSupabaseUser(session.user.id);
        else {
          setCurrentUser(null);
          setGroupId(null);
        }
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

  const requestPasswordReset = async (email: string) => {
    if (!supabase) return { success: false, error: 'Recuperação de senha indisponível.' };
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { success: false, error: 'Não foi possível enviar o link. Aguarde e tente novamente.' };
    return { success: true };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return { success: false, error: 'Recuperação de senha indisponível.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: 'Não foi possível atualizar a senha. Solicite um novo link.' };
    await supabase.auth.signOut();
    setCurrentUser(null);
    setGroupId(null);
    return { success: true };
  };

  const finishPasswordRecovery = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setGroupId(null);
    clearPasswordSetup();
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
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
    setGroupId(null);
    localStorage.removeItem('quadraplay_current_user_id_v1');
  };

  const updateAvatar = async (file: File | null) => {
    if (!currentUser) return { success: false, error: 'Jogador não identificado.' };
    if (file && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      return { success: false, error: 'Escolha uma imagem JPG, PNG ou WEBP de até 5 MB.' };
    }

    if (supabase) {
      try {
        let avatarUrl: string | null = null;
        const folder = currentUser.id;
        if (file) {
          const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
          const path = `${folder}/avatar.${extension}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
          if (uploadError) throw uploadError;
          avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
        } else {
          const { data: files } = await supabase.storage.from('avatars').list(folder);
          if (files?.length) await supabase.storage.from('avatars').remove(files.map((item) => `${folder}/${item.name}`));
        }
        const { error: profileError } = await supabase.from('perfis').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
        if (profileError) throw profileError;
        await loadSupabaseUser(currentUser.id);
        if (groupId) setAllPlayers(await supabaseAgendaService.getGroupPlayers(groupId));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error?.message || 'Não foi possível atualizar a foto.' };
      }
    }

    if (file) {
      const avatarUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });
      storageService.savePlayer({ ...currentUser, avatarUrl });
    } else storageService.savePlayer({ ...currentUser, avatarUrl: undefined });
    refreshAuth();
    return { success: true };
  };

  const completeFirstAccess = async (password: string) => {
    if (!supabase || !currentUser) return { success: false, error: 'Sessão não encontrada.' };
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) return { success: false, error: 'Não foi possível criar a nova senha.' };
    const { error: profileError } = await supabase.from('perfis').update({ precisa_trocar_senha: false }).eq('id', currentUser.id);
    if (profileError) return { success: false, error: 'A senha mudou, mas não foi possível concluir o primeiro acesso.' };
    await loadSupabaseUser(currentUser.id);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: !!currentUser?.isAdmin,
        authLoading,
        usingSupabase: isSupabaseConfigured,
        groupId,
        passwordSetupMode,
        loginWithEmail,
        requestPasswordReset,
        updatePassword,
        finishPasswordRecovery,
        switchUser,
        logout,
        allPlayers,
        refreshAuth,
        updateAvatar,
        completeFirstAccess,
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
