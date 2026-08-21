import React, { useMemo } from 'react';
import { Trophy, Medal, Users } from 'lucide-react';
import { storageService } from '../../services/storageService';

export const RankingView: React.FC = () => {
  const ranking = useMemo(() => {
    const players = storageService.getPlayers();
    const matches = storageService.getMatches().filter(m => m.status !== 'cancelled');
    return players
      .map(player => ({
        ...player,
        matches: matches.filter(m => m.player1Id === player.id || m.player2Id === player.id).length,
      }))
      .sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name));
  }, []);

  return (
    <div className="space-y-4 pb-8">
      <section className="pt-1">
        <h2 className="text-2xl font-black tracking-tight text-[#0b1742]">Ranking</h2>
        <p className="text-xs text-slate-500 mt-1">Participação no grupo, sem pontuação automática por vitória.</p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {ranking.slice(0, 3).map((player, index) => (
          <div key={player.id} className={`qp-card rounded-[24px] p-3 text-center ${index === 0 ? 'ring-2 ring-violet-200' : ''}`}>
            <div className={`w-12 h-12 mx-auto rounded-full grid place-items-center font-black ${index === 0 ? 'bg-violet-600 text-white' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
              {index === 0 ? <Trophy className="w-5 h-5" /> : <Medal className="w-5 h-5" />}
            </div>
            <p className="text-[10px] text-slate-400 font-black mt-2">#{index + 1}</p>
            <p className="text-xs font-black text-[#0b1742] truncate mt-0.5">{player.name}</p>
            <p className="text-[10px] text-violet-600 font-bold">Classe {player.tennisClass}</p>
            <p className="text-[10px] text-slate-500 mt-1">{player.matches} jogos</p>
          </div>
        ))}
      </div>

      <section className="qp-card rounded-[26px] p-3">
        <div className="flex items-center gap-2 px-1 pb-3">
          <Users className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-black text-[#0b1742]">Todos os jogadores</h3>
        </div>
        <div className="space-y-2">
          {ranking.map((player, index) => (
            <div key={player.id} className="qp-soft rounded-[18px] px-3 py-3 flex items-center gap-3">
              <span className="w-7 text-center text-xs font-black text-slate-400">{index + 1}</span>
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 grid place-items-center font-black">{player.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0b1742] truncate">{player.name}</p>
                <p className="text-[10px] text-slate-500">Classe {player.tennisClass}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-violet-700">{player.matches}</p>
                <p className="text-[9px] text-slate-400">jogos</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
