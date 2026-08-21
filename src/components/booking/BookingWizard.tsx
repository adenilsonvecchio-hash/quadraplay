import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, MapPin, ShieldAlert, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Court, CourtSlot, Player } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { addDays, formatFriendlyDate, getBrasiliaToday, isBeforeDate } from '../../utils/dateUtils';

interface BookingWizardProps {
  preselectedOpponentId?: string;
  preselectedDate?: string;
  preselectedStartTime?: string;
  preselectedCourtId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const BookingWizard: React.FC<BookingWizardProps> = ({
  preselectedOpponentId,
  preselectedDate,
  preselectedStartTime,
  preselectedCourtId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const today = getBrasiliaToday();
  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState(preselectedDate && !isBeforeDate(preselectedDate, today) ? preselectedDate : today);
  const [courts, setCourts] = useState<Court[]>(() => storageService.getCourts());
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(() => storageService.getCourts().find(c => c.id === preselectedCourtId) || storageService.getCourts()[0] || null);
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [opponents, setOpponents] = useState<Player[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const loadPlayersAndCourts = async () => {
      try {
        const [list, nextCourts] = usingSupabase && groupId
          ? await Promise.all([
              supabaseAgendaService.getPlayersByClass(groupId, currentUser.tennisClass, currentUser.id),
              supabaseAgendaService.getCourts(groupId),
            ])
          : [storageService.getPlayersByClass(currentUser.tennisClass).filter(p => p.id !== currentUser.id), storageService.getCourts()];
        const activeCourts = nextCourts.filter((court) => court.active);
        setOpponents(list);
        setCourts(activeCourts);
        setSelectedCourt((current) => activeCourts.find((court) => court.id === preselectedCourtId) || activeCourts.find((court) => court.id === current?.id) || activeCourts[0] || null);
        if (preselectedOpponentId) {
          const found = list.find(p => p.id === preselectedOpponentId);
          if (found) setSelectedOpponent(found);
        }
      } catch {
        setErrorMsg('Não foi possível carregar jogadores e quadras do banco.');
      }
    };
    void loadPlayersAndCourts();
  }, [currentUser, preselectedOpponentId, preselectedCourtId, usingSupabase, groupId]);

  useEffect(() => {
    if (!selectedCourt) return;
    const loadSlots = async () => {
      try {
        const nextSlots = usingSupabase && groupId
          ? await supabaseAgendaService.getSchedule(groupId, selectedDate, selectedCourt.id)
          : storageService.getCourtScheduleForDate(selectedDate, selectedCourt.id);
        setSlots(nextSlots);
        const preset = preselectedStartTime ? nextSlots.find(s => s.startTime === preselectedStartTime && s.available) : undefined;
        setSelectedSlot(preset || null);
        if (preselectedDate && preselectedCourtId && preset) setStep(3);
      } catch {
        setErrorMsg('Não foi possível carregar os horários disponíveis.');
      }
    };
    void loadSlots();
  }, [selectedDate, selectedCourt?.id, preselectedDate, preselectedCourtId, preselectedStartTime, usingSupabase, groupId]);

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  if (!currentUser) return null;

  const goBack = () => step === 1 ? onCancel() : setStep((step - 1) as Step);
  const chooseDate = (date: string) => {
    if (isBeforeDate(date, today)) return;
    setSelectedDate(date); setSelectedSlot(null); setErrorMsg(null); setStep(2);
  };
  const chooseSlot = (slot: CourtSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot); setErrorMsg(null); setStep(3);
  };
  const chooseOpponent = (player: Player) => {
    setSelectedOpponent(player); setErrorMsg(null); setStep(4);
  };
  const confirm = async () => {
    if (!selectedSlot || !selectedOpponent || !selectedCourt) return setErrorMsg('Complete todas as etapas do agendamento.');
    setSaving(true); setErrorMsg(null);
    try {
      if (usingSupabase && groupId) {
        await supabaseAgendaService.createMatch({
          groupId, courtId: selectedCourt.id, player1Id: currentUser.id,
          player2Id: selectedOpponent.id, tennisClass: currentUser.tennisClass,
          date: selectedDate, startTime: selectedSlot.startTime, endTime: selectedSlot.endTime,
        });
      } else {
        const result = storageService.createMatch({
          player1Id: currentUser.id, player2Id: selectedOpponent.id, date: selectedDate,
          startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, courtId: selectedCourt.id,
        });
        if (!result.success) throw new Error(result.error || 'Não foi possível criar a reserva.');
      }
      setSuccess(true);
      window.setTimeout(onSuccess, 1200);
    } catch (error: any) {
      const message = String(error?.message || '');
      if (message.includes('duplicate') || message.includes('partidas_quadra_horario')) setErrorMsg('Este horário acabou de ser reservado por outro jogador. Escolha outro período.');
      else if (message.includes('bloqueado')) setErrorMsg('Este horário está bloqueado pela administração.');
      else if (message.includes('já possui jogo')) setErrorMsg('Um dos jogadores já possui jogo neste horário.');
      else setErrorMsg(message || 'Não foi possível criar a reserva.');
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = ['Data', 'Quadra e horário', 'Adversário', 'Confirmar'];

  if (success) {
    return <div className="qp-glass rounded-[30px] p-8 text-center mt-3">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-9 h-9" /></div>
      <h2 className="mt-4 text-xl font-black text-[#101b3d]">Reserva enviada!</h2>
      <p className="text-sm text-slate-500 mt-1">{selectedOpponent?.name} receberá o convite para confirmar a partida.</p>
    </div>;
  }

  return <div className="space-y-3 pb-4">
    <section className="qp-glass rounded-[26px] p-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-[15px] qp-button flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">Nova partida</p><h2 className="font-black text-[#101b3d]">{stepTitles[step-1]}</h2></div>
        <span className="text-[11px] font-black text-violet-700 bg-violet-50 px-2.5 py-1.5 rounded-full">{step}/4</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mt-4">
        {stepTitles.map((title, i) => <div key={title} className="min-w-0"><div className={`h-1.5 rounded-full ${i+1 <= step ? 'bg-violet-600' : 'bg-slate-200'}`} /><p className={`mt-1 text-[8px] text-center truncate ${i+1===step?'text-violet-700 font-black':'text-slate-400'}`}>{title}</p></div>)}
      </div>
    </section>

    {errorMsg && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 flex gap-2 text-xs font-semibold text-rose-700"><ShieldAlert className="w-4 h-4 shrink-0" />{errorMsg}</div>}

    {step === 1 && <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} className="qp-glass rounded-[26px] p-4">
      <div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div><div><h3 className="font-black text-[#101b3d]">Selecione a data</h3><p className="text-xs text-slate-500">Somente hoje e datas futuras.</p></div></div>
      <div className="grid grid-cols-3 gap-2">
        {dates.map((date, i) => <button key={date} onClick={() => chooseDate(date)} className={`rounded-[18px] border p-3 text-center ${date===selectedDate?'bg-gradient-to-br from-[#725cff] to-[#5038eb] text-white border-white shadow-lg':'bg-white/65 border-white text-[#101b3d]'}`}><p className="text-[10px] font-bold opacity-70">{i===0?'HOJE':i===1?'AMANHÃ':formatFriendlyDate(date).split(',')[0].toUpperCase()}</p><p className="text-lg font-black mt-1">{date.slice(8,10)}</p><p className="text-[10px] opacity-70">{new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'})}</p></button>)}
      </div>
    </motion.section>}

    {step === 2 && <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} className="space-y-3">
      <div className="qp-glass rounded-[26px] p-4"><div className="flex items-center justify-between mb-3"><div><h3 className="font-black text-[#101b3d]">Escolha a quadra</h3><p className="text-xs text-slate-500">{formatFriendlyDate(selectedDate)}</p></div><MapPin className="w-5 h-5 text-violet-500" /></div><div className="grid grid-cols-3 gap-2">{courts.map(c => <button key={c.id} onClick={() => {setSelectedCourt(c);setSelectedSlot(null)}} className={`rounded-[18px] py-3 px-1 text-[10px] font-black ${selectedCourt?.id===c.id?'bg-gradient-to-br from-[#725cff] to-[#5038eb] text-white shadow-lg':'qp-button text-slate-600'}`}><div className="w-7 h-7 rounded-lg border-2 border-current mx-auto mb-1.5 flex items-center justify-center"><span className="w-4 h-px bg-current" /></div>{c.name}</button>)}</div></div>
      <div className="qp-glass rounded-[26px] p-3"><div className="flex items-center gap-2 px-1 pb-2"><Clock3 className="w-4 h-4 text-violet-600" /><h3 className="text-sm font-black text-[#101b3d]">Horários de {selectedCourt?.name || 'quadra'}</h3></div><div className="grid grid-cols-2 gap-2">{slots.map(slot => <button key={slot.startTime} disabled={!slot.available} onClick={() => chooseSlot(slot)} className={`rounded-[18px] p-3 text-left border ${slot.available?'bg-emerald-50/80 border-white text-emerald-800':'bg-slate-100/75 border-white text-slate-400'} disabled:cursor-not-allowed`}><div className="flex items-center justify-between"><span className="text-sm font-black">{slot.startTime}</span>{slot.available?<Check className="w-4 h-4"/>:<span className="text-[9px] font-bold">OCUPADO</span>}</div><p className="text-[10px] mt-1">até {slot.endTime}</p></button>)}</div></div>
    </motion.section>}

    {step === 3 && <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} className="qp-glass rounded-[26px] p-4">
      <div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center"><UserRound className="w-5 h-5" /></div><div><h3 className="font-black text-[#101b3d]">Escolha o adversário</h3><p className="text-xs text-slate-500">Jogadores da Classe {currentUser.tennisClass}</p></div></div>
      <div className="space-y-2">{opponents.map(player => <button key={player.id} onClick={() => chooseOpponent(player)} className={`w-full rounded-[18px] p-3 flex items-center gap-3 text-left border ${selectedOpponent?.id===player.id?'bg-violet-50 border-violet-200':'bg-white/60 border-white'}`}><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-violet-600">{player.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="text-sm font-black text-[#101b3d] truncate">{player.name}</p><p className="text-[10px] text-slate-500">Classe {player.tennisClass}</p></div><ChevronRight className="w-4 h-4 text-violet-500" /></button>)}</div>
    </motion.section>}

    {step === 4 && <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} className="space-y-3">
      <div className="qp-glass rounded-[26px] p-4"><h3 className="font-black text-[#101b3d] mb-3">Resumo da reserva</h3><div className="space-y-2 text-sm"><Summary label="Data" value={formatFriendlyDate(selectedDate, false)} /><Summary label="Horário" value={`${selectedSlot?.startTime} - ${selectedSlot?.endTime}`} /><Summary label="Quadra" value={`${selectedCourt?.name || ''} · ${selectedCourt?.surface || ''}`} /><Summary label="Adversário" value={`${selectedOpponent?.name} · Classe ${selectedOpponent?.tennisClass}`} /></div></div>
      <div className="rounded-[22px] bg-orange-50 border border-orange-100 p-3 text-xs text-orange-800"><strong>Após confirmar:</strong> o horário ficará como “Aguardando confirmação” até o adversário aceitar.</div>
      <button disabled={saving} onClick={confirm} className="w-full h-14 rounded-[20px] bg-gradient-to-r from-[#765cff] to-[#543beb] text-white font-black shadow-[0_12px_28px_rgba(91,70,238,0.28)] disabled:opacity-60">{saving?'Confirmando...':'Confirmar reserva'}</button>
    </motion.section>}
  </div>;
};

const Summary: React.FC<{label:string;value:string}> = ({label,value}) => <div className="rounded-[17px] bg-white/65 border border-white p-3 flex items-center justify-between gap-4"><span className="text-xs text-slate-500">{label}</span><span className="text-xs font-black text-[#101b3d] text-right">{value}</span></div>;
