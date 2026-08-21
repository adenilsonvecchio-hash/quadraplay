import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  currentUser: Player | null;
  isAdmin: boolean;
  loginWithEmail: (email: string, password?: string) => { success: boolean; error?: string };
  switchUser: (playerId: string) => void;
  logout: () => void;
  allPlayers: Player[];
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

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
    refreshAuth();
    const unsubscribe = storageService.subscribe(() => {
      refreshAuth();
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = (email: string, _password?: string) => {
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('quadraplay_current_user_id_v1');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: !!currentUser?.isAdmin,
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
