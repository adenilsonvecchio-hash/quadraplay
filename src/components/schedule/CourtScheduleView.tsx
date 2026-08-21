import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CourtSlot } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { addDays, formatFriendlyDate, getBrasiliaToday } from '../../utils/dateUtils';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Plus,
  Users,
} from 'lucide-react';

interface CourtScheduleViewProps {
  onScheduleSlot?: (date: string, startTime: string, courtId: string) => void;
}


export const CourtScheduleView: React.FC<CourtScheduleViewProps> = ({ onScheduleSlot }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const today = getBrasiliaToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCourtId, setSelectedCourtId] = useState('court-1');
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [courts, setCourts] = useState(() => storageService.getCourts(false));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadSlots = async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (usingSupabase && groupId) {
        const nextCourts = await supabaseAgendaService.getCourts(groupId);
        setCourts(nextCourts);
        const availableCourt = nextCourts.find((court) => court.id === selectedCourtId && court.active) || nextCourts.find((court) => court.active);
        if (!availableCourt) {
          setSlots([]);
          return;
        }
        if (availableCourt.id !== selectedCourtId) {
          setSelectedCourtId(availableCourt.id);
          return;
        }
        setSlots(await supabaseAgendaService.getSchedule(groupId, selectedDate, availableCourt.id));
      } else {
        const nextCourts = storageService.getCourts(false);
        setCourts(nextCourts);
        setSlots(storageService.getCourtScheduleForDate(selectedDate, selectedCourtId));
      }
    } catch {
      setLoadError('Não foi possível carregar a agenda do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSlots();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void loadSlots());
    return storageService.subscribe(() => void loadSlots());
  }, [selectedDate, selectedCourtId, usingSupabase, groupId]);

  const dateTitle = useMemo(() => formatFriendlyDate(selectedDate, false), [selectedDate]);
  const weekday = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const value = new Date(year, month - 1, day).toLocaleDateString('pt-BR', { weekday: 'long' });
    return value.charAt(0).toUpperCase() + value.slice(1);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const previous = addDays(selectedDate, -1);
    if (previous >= today) setSelectedDate(previous);
  };

  return (
    <div className="space-y-3 pb-4">
      <section className="qp-glass rounded-[26px] p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-[18px] bg-violet-100 text-violet-600 flex items-center justify-center shadow-[0_8px_22px_rgba(105,76,255,0.16)]">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-400">Agenda</p>
          <h2 className="text-[20px] leading-tight font-black tracking-tight text-[#101b3d] truncate">{dateTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{weekday}</p>
        </div>
        <button
          onClick={() => setSelectedDate(today)}
          className="w-11 h-11 rounded-[16px] qp-button text-slate-700 flex items-center justify-center active:scale-95 transition"
          aria-label="Ir para hoje"
        >
          <CalendarDays className="w-5 h-5" />
        </button>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePrevDay}
          disabled={selectedDate <= today}
          className="h-12 qp-button rounded-[18px] flex items-center justify-center disabled:opacity-35"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSelectedDate(today)}
          className="h-12 rounded-[18px] text-sm font-black text-violet-600 bg-violet-50/80 border border-white shadow-[0_8px_22px_rgba(105,76,255,0.13)]"
        >
          Hoje
        </button>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="h-12 qp-button rounded-[18px] flex items-center justify-center"
          aria-label="Próximo dia"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <section className="qp-glass rounded-[26px] p-3.5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm text-[#101b3d]">Quadras</h3>
          <span className="text-[10px] font-bold text-slate-400">Selecione uma quadra</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {courts.map((court) => {
            const active = selectedCourtId === court.id;
            return (
              <button
                key={court.id}
                disabled={!court.active}
                onClick={() => setSelectedCourtId(court.id)}
                className={`rounded-[19px] px-1 py-3.5 flex flex-col items-center justify-center gap-2 transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#725cff] to-[#5038eb] text-white shadow-[0_9px_24px_rgba(91,70,238,0.34)] ring-1 ring-white/80'
                    : court.active ? 'qp-button text-slate-500' : 'bg-slate-100 text-slate-400 opacity-65 cursor-not-allowed'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${active ? 'border-white/90' : 'border-slate-300'}`}>
                  <span className="w-4 h-px bg-current opacity-70" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{court.name}</span>
                {!court.active && <span className="text-[8px] font-bold">Indisponível</span>}
              </button>
            );
          })}
        </div>
      </section>

      <>
          {loadError && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">{loadError}</div>}
          <div className="qp-glass rounded-[20px] px-3 py-2.5 grid grid-cols-4 gap-2 text-[10px] font-semibold text-slate-700">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Disponível</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Reservado</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Aguardando</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Bloqueado</div>
          </div>

          <section className="qp-glass rounded-[26px] p-2 space-y-1.5">
            {loading && <div className="p-6 text-center text-xs font-bold text-slate-500">Carregando agenda...</div>}
            {slots.map((slot) => {
              const isMyMatch = !!currentUser && !!slot.match && (slot.match.player1Id === currentUser.id || slot.match.player2Id === currentUser.id);
              const isPending = slot.match?.status === 'pending';

              if (slot.isBlocked) {
                return (
                  <div key={slot.startTime} className="grid grid-cols-[86px_1fr] gap-2 items-stretch">
                    <TimeBlock start={slot.startTime} end={slot.endTime} />
                    <div className="rounded-[20px] px-3 py-3 bg-slate-100/85 border border-white flex items-center gap-3 min-h-[72px]">
                      <StatusIcon tone="gray"><LockKeyhole className="w-4 h-4" /></StatusIcon>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-700">Bloqueado</p>
                        <p className="text-[11px] text-slate-500 truncate">{slot.blockReason || 'Manutenção'}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (slot.match) {
                return (
                  <div key={slot.startTime} className="grid grid-cols-[86px_1fr] gap-2 items-stretch">
                    <TimeBlock start={slot.startTime} end={slot.endTime} />
                    <div className={`rounded-[20px] px-3 py-3 border border-white flex items-center gap-3 min-h-[72px] ${isPending ? 'bg-orange-50/90' : 'bg-blue-50/90'}`}>
                      <StatusIcon tone={isPending ? 'orange' : 'blue'}>{isPending ? <Clock3 className="w-4 h-4" /> : <Users className="w-4 h-4" />}</StatusIcon>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-black ${isPending ? 'text-orange-700' : 'text-blue-800'}`}>{isPending ? 'Aguardando confirmação' : 'Reservado'}</p>
                        <p className="text-[11px] text-[#101b3d] truncate">{slot.match.player1Name} & {slot.match.player2Name}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isPending ? 'text-orange-500' : 'text-blue-600'}`} />
                    </div>
                  </div>
                );
              }

              if (!slot.available) {
                return (
                  <div key={slot.startTime} className="grid grid-cols-[86px_1fr] gap-2 items-stretch opacity-55">
                    <TimeBlock start={slot.startTime} end={slot.endTime} />
                    <div className="rounded-[20px] px-3 py-3 bg-slate-100 border border-white flex items-center gap-3 min-h-[72px]">
                      <StatusIcon tone="gray"><Clock3 className="w-4 h-4" /></StatusIcon>
                      <div>
                        <p className="text-sm font-black text-slate-600">Horário encerrado</p>
                        <p className="text-[11px] text-slate-400">Não disponível para reserva</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={slot.startTime}
                  onClick={() => onScheduleSlot?.(selectedDate, slot.startTime, selectedCourtId)}
                  className="w-full grid grid-cols-[86px_1fr] gap-2 items-stretch text-left"
                >
                  <TimeBlock start={slot.startTime} end={slot.endTime} />
                  <div className="rounded-[20px] px-3 py-3 bg-emerald-50/90 border border-white flex items-center gap-3 min-h-[72px] active:scale-[0.99] transition">
                    <StatusIcon tone="green"><Check className="w-4 h-4 stroke-[3]" /></StatusIcon>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-emerald-800">Disponível</p>
                      <p className="text-[11px] text-emerald-950/70">Clique para reservar</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-700" />
                  </div>
                </button>
              );
            })}
          </section>

          <button
            onClick={() => onScheduleSlot?.(selectedDate, '', selectedCourtId)}
            className="w-full qp-glass rounded-[24px] px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition"
          >
            <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-[#7c63ff] to-[#5c43ed] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(92,67,237,0.3)]">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-violet-700">Nova partida / reserva</p>
              <p className="text-[11px] text-slate-500">Agendar uma nova partida</p>
            </div>
            <ChevronRight className="w-5 h-5 text-violet-600" />
          </button>
        </>

    </div>
  );
};

const TimeBlock: React.FC<{ start: string; end: string }> = ({ start, end }) => (
  <div className="rounded-[18px] bg-white/55 border border-white px-2 py-2.5 flex flex-col justify-center">
    <span className="text-sm font-black leading-none text-[#101b3d]">{start}</span>
    <span className="text-sm font-black leading-none text-[#101b3d] mt-1">{end}</span>
    <span className="text-[10px] text-slate-400 mt-1">1h30</span>
  </div>
);

const StatusIcon: React.FC<{ tone: 'green' | 'blue' | 'orange' | 'gray'; children: React.ReactNode }> = ({ tone, children }) => {
  const tones = {
    green: 'bg-emerald-500 text-white',
    blue: 'bg-blue-600 text-white',
    orange: 'bg-orange-500 text-white',
    gray: 'bg-slate-400 text-white',
  };
  return <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${tones[tone]}`}>{children}</div>;
};
