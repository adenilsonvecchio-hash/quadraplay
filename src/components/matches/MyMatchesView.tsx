import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Plus, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Match } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface MyMatchesViewProps { onStartBooking: () => void; }
type SubTab = 'upcoming' | 'past' | 'cancelled';

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({ onStartBooking }) => {
  const { currentUser } = useAuth();
  const [active, setActive] = useState<SubTab>('upcoming');
  const [data, setData] = useState<{upcoming: Match[]; past: Match[]; cancelled: Match[]}>({upcoming:[],past:[],cancelled:[]});
  const [cancelling, setCancelling] = useState<Match | null>(null);

  const load = () => currentUser && setData(storageService.getPlayerMatches(currentUser.id));
  useEffect(() => { load(); return storageService.subscribe(load); }, [currentUser]);
  if (!currentUser) return null;

  const list = data[active];
  const respond = (match: Match, accept: boolean) => { storageService.respondToMatch(match.id, currentUser.id, accept); load(); };

  return <div className="space-y-4 pb-8">
    <div className="flex items-end justify-between gap-3 pt-1">
      <div><h2 className="text-2xl font-black tracking-tight">Meus Jogos</h2><p className="text-xs text-slate-500 mt-1">Convites, partidas confirmadas e histórico.</p></div>
      <button onClick={onStartBooking} className="qp-primary rounded-[16px] px-3 py-2.5 text-xs font-black flex items-center gap-1"><Plus className="w-4 h-4"/>Novo</button>
    </div>

    <div className="qp-card rounded-[22px] p-1.5 grid grid-cols-3 gap-1">
      {([['upcoming','Próximos'],['past','Histórico'],['cancelled','Cancelados']] as [SubTab,string][]).map(([key,label]) => <button key={key} onClick={()=>setActive(key)} className={`rounded-[16px] py-2.5 text-xs font-black transition ${active===key?'qp-primary':'text-slate-500'}`}>{label}</button>)}
    </div>

    <div className="space-y-3">
      {list.length === 0 && <div className="qp-card rounded-[28px] p-8 text-center"><CalendarDays className="w-8 h-8 text-violet-400 mx-auto"/><h3 className="font-black mt-3">Nenhum jogo nesta seção</h3><p className="text-xs text-slate-500 mt-1">Quando houver movimentações, elas aparecerão aqui.</p></div>}

      {list.map(match => {
        const opponent = match.player1Id === currentUser.id ? match.player2Name : match.player1Name;
        const incoming = match.status === 'pending' && match.player2Id === currentUser.id;
        const tone = match.status === 'pending' ? 'orange' : match.status === 'cancelled' ? 'rose' : 'emerald';
        return <article key={match.id} className="qp-card rounded-[26px] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tone==='orange'?'bg-orange-50 text-orange-700':tone==='rose'?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'}`}>{match.status==='pending'?'Aguardando confirmação':match.status==='cancelled'?'Cancelado':active==='past'?'Realizado':'Confirmado'}</span>
            <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-full">Classe {match.tennisClass}</span>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="w-14 h-14 rounded-[18px] bg-violet-50 text-violet-700 grid place-items-center shrink-0"><CalendarDays className="w-5 h-5"/></div>
            <div className="min-w-0 flex-1"><p className="text-xs text-slate-500 font-bold">{formatFriendlyDate(match.date)}</p><h3 className="text-base font-black mt-1 truncate">vs {opponent}</h3><div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>{match.startTime} - {match.endTime}</span><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{match.courtName}</span></div></div>
          </div>

          {active==='upcoming' && <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            {incoming ? <><button onClick={()=>respond(match,false)} className="flex-1 qp-soft rounded-[15px] py-2.5 text-xs font-black text-rose-600">Recusar</button><button onClick={()=>respond(match,true)} className="flex-1 rounded-[15px] py-2.5 text-xs font-black bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/>Aceitar</button></> : <button onClick={()=>setCancelling(match)} className="w-full qp-soft rounded-[15px] py-2.5 text-xs font-black text-rose-600 flex items-center justify-center gap-1"><XCircle className="w-4 h-4"/>Cancelar partida</button>}
          </div>}
        </article>;
      })}
    </div>

    <ConfirmModal isOpen={!!cancelling} title="Cancelar agendamento?" description={cancelling ? `Cancelar o jogo com ${cancelling.player1Id===currentUser.id?cancelling.player2Name:cancelling.player1Name} em ${formatFriendlyDate(cancelling.date)}?` : ''} confirmLabel="Cancelar jogo" cancelLabel="Manter jogo" isDestructive showReasonInput onConfirm={(reason)=>{if(cancelling) storageService.cancelMatch(cancelling.id,currentUser.name,reason); setCancelling(null);}} onClose={()=>setCancelling(null)} />
  </div>;
};
