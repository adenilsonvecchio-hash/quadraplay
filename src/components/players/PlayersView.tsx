import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TennisClass, Player } from '../../types';
import { storageService } from '../../services/storageService';
import { Users, Phone, Mail, Plus, Check, Lock, ChevronRight } from 'lucide-react';

interface PlayersViewProps {
  onChallengePlayer: (opponentId: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({ onChallengePlayer }) => {
  const { currentUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState<TennisClass>(
    currentUser?.tennisClass || 'B'
  );

  const players = storageService.getPlayersByClass(selectedClass);
  const isUserClass = currentUser?.tennisClass === selectedClass;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Jogadores do Clube</h2>
        <p className="text-xs text-slate-500">
          50 atletas divididos em 5 categorias de 10 jogadores
        </p>
      </div>

      {/* Class Switcher Tabs (A, B, C, D, E) */}
      <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl">
        {(['A', 'B', 'C', 'D', 'E'] as TennisClass[]).map((cls) => {
          const isSelected = selectedClass === cls;
          const isMyClass = currentUser?.tennisClass === cls;

          return (
            <button
              key={cls}
              id={`tab-class-${cls}`}
              onClick={() => setSelectedClass(cls)}
              className={`py-2 px-1 rounded-xl text-center transition-all ${
                isSelected
                  ? 'bg-[#0F1E36] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span className="block text-xs font-black">Classe {cls}</span>
              {isMyClass && (
                <span
                  className={`text-[9px] font-bold block ${
                    isSelected ? 'text-[#D4F63D]' : 'text-slate-500'
                  }`}
                >
                  Sua
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Class Summary Banner */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-[#0F1E36] font-black text-sm flex items-center justify-center border border-slate-200">
            {selectedClass}
          </span>
          <div>
            <p className="font-black text-slate-900">
              Classe {selectedClass} • {players.length} Atletas
            </p>
            <p className="text-[11px] text-slate-500">
              45 combinações possíveis de jogos nesta classe
            </p>
          </div>
        </div>

        {!isUserClass && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Outra classe</span>
          </span>
        )}
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {players.map((player, index) => {
          const isSelf = currentUser?.id === player.id;
          const canChallenge = isUserClass && !isSelf;

          return (
            <div
              key={player.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isSelf
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-900 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center border ${
                      isSelf
                        ? 'bg-[#D4F63D] text-slate-950 border-lime-300'
                        : 'bg-slate-100 text-[#0F1E36] border-slate-200'
                    }`}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold">
                        {player.name} {isSelf && '(Você)'}
                      </p>
                      {player.isAdmin && (
                        <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 text-[11px] mt-0.5 ${
                        isSelf ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span>{player.phone || player.email}</span>
                      <span>•</span>
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {canChallenge && (
                  <button
                    id={`btn-challenge-${player.id}`}
                    onClick={() => onChallengePlayer(player.id)}
                    className="px-3 py-2 bg-[#D4F63D] hover:bg-[#c6ea2f] text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Jogar</span>
                  </button>
                )}

                {isSelf && (
                  <span className="text-[11px] font-black text-[#D4F63D] bg-slate-800 px-2 py-1 rounded-lg">
                    Seu Perfil
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
