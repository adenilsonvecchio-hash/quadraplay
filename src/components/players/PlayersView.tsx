import React, { useState } from 'react';
import { Lock, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TennisClass } from '../../types';
import { getActiveSportId } from '../../data/sports';
import { PlayerAvatar } from '../common/PlayerAvatar';

interface PlayersViewProps { onChallengePlayer: (opponentId: string) => void; }

export const PlayersView: React.FC<PlayersViewProps> = ({ onChallengePlayer }) => {
  const { currentUser, allPlayers } = useAuth();
  const [selectedClass, setSelectedClass] = useState<TennisClass>(currentUser?.tennisClass || 'B');
  const [search, setSearch] = useState('');
  const isTennis = getActiveSportId() === 'tenis';
  const players = allPlayers.filter((player) =>
    (!isTennis || player.tennisClass === selectedClass)
    && player.name.toLowerCase().includes(search.toLowerCase()),
  );
  const isUserClass = !isTennis || currentUser?.tennisClass === selectedClass;

  return <div className="space-y-4 pb-8">
    <section className="pt-1"><h2 className="text-2xl font-black tracking-tight">Participantes</h2><p className="text-xs text-slate-500 mt-1">Encontre uma pessoa e agende um horário.</p></section>
    {isTennis && <div className="qp-card rounded-[24px] p-2 grid grid-cols-5 gap-1.5">{(['A','B','C','D','E'] as TennisClass[]).map((cls) => <button key={cls} onClick={() => setSelectedClass(cls)} className={`rounded-[16px] py-2.5 text-xs font-black ${selectedClass === cls ? 'qp-primary' : 'text-slate-500'}`}>Classe {cls}</button>)}</div>}
    <div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar participante" className="w-full qp-soft rounded-[18px] pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"/></div>
    {isTennis && !isUserClass && <div className="rounded-[18px] bg-amber-50 border border-amber-100 p-3 flex items-center gap-2 text-xs text-amber-800 font-bold"><Lock className="w-4 h-4"/>Você pode visualizar esta classe, mas só agendar com jogadores da sua própria classe.</div>}
    <section className="qp-card rounded-[28px] p-3">
      <div className="flex items-center justify-between px-1 pb-3"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-violet-600"/><h3 className="text-sm font-black">{isTennis ? `Classe ${selectedClass}` : 'Participantes'}</h3></div><span className="text-[10px] text-slate-400 font-bold">{players.length} participantes</span></div>
      <div className="space-y-2">{players.map((player) => {
        const self = currentUser?.id === player.id;
        const canChallenge = isUserClass && !self;
        return <div key={player.id} className={`qp-soft rounded-[19px] p-3 flex items-center gap-3 ${self ? 'ring-2 ring-violet-100' : ''}`}>
          <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} className="w-11 h-11 text-xs ring-2 ring-white shadow-sm" />
          <div className="min-w-0 flex-1"><p className="text-sm font-black truncate">{player.name}{self ? ' (Você)' : ''}</p>{isTennis && <p className="text-[10px] text-slate-500">Classe {player.tennisClass}</p>}</div>
          {canChallenge ? <button onClick={() => onChallengePlayer(player.id)} className="qp-primary rounded-[14px] px-3 py-2 text-xs font-black flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>Agendar</button> : self ? <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">Seu perfil</span> : null}
        </div>;
      })}</div>
    </section>
  </div>;
};
