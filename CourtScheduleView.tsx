import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Court, CourtSlot } from '../../types';
import { storageService } from '../../services/storageService';
import { supabaseAgendaService } from '../../services/supabaseAgendaService';
import { addDays, getBrasiliaToday } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Clock3, LockKeyhole, Users } from 'lucide-react';

interface CourtScheduleViewProps { onScheduleSlot?: (date: string, startTime: string, courtId: string) => void; }
type DaySchedule = { date: string; slots: CourtSlot[] };

const mondayOf = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return addDays(dateString, weekday === 0 ? -6 : 1 - weekday);
};

const dayLabel = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return { weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(), day: String(day).padStart(2, '0') };
};

const monthTitle = (weekStart: string) => {
  const toDate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); };
  const firstDate = toDate(weekStart);
  const lastDate = toDate(addDays(weekStart, 6));
  const first = firstDate.toLocaleDateString('pt-BR', { month: 'long' });
  const last = lastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return firstDate.getMonth() === lastDate.getMonth() ? `${first.charAt(0).toUpperCase() + first.slice(1)}, ${lastDate.getFullYear()}` : `${first.charAt(0).toUpperCase() + first.slice(1)} – ${last}`;
};

export const CourtScheduleView: React.FC<CourtScheduleViewProps> = ({ onScheduleSlot }) => {
  const { currentUser, usingSupabase, groupId } = useAuth();
  const today = getBrasiliaToday();
  const currentWeek = mondayOf(today);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [selectedCourtId, setSelectedCourtId] = useState('court-1');
  const [courts, setCourts] = useState<Court[]>([]);
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const loadWeek = async () => {
    setLoading(true); setLoadError('');
    try {
      const nextCourts = usingSupabase && groupId ? await supabaseAgendaService.getCourts(groupId) : storageService.getCourts(false);
      setCourts(Array.isArray(nextCourts) ? nextCourts : []);
      const court = nextCourts.find((item) => item.id === selectedCourtId && item.active) || nextCourts.find((item) => item.active);
      if (!court) { setDays([]); return; }
      if (court.id !== selectedCourtId) { setSelectedCourtId(court.id); return; }
      setDays(await Promise.all(weekDates.map(async (date) => ({
        date,
        slots: usingSupabase && groupId ? await supabaseAgendaService.getSchedule(groupId, date, court.id) : storageService.getCourtScheduleForDate(date, court.id),
      }))));
    } catch { setLoadError('Não foi possível carregar a agenda da semana.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void loadWeek();
    if (usingSupabase && groupId) return supabaseAgendaService.subscribeToMatches(groupId, () => void loadWeek());
    return storageService.subscribe(() => void loadWeek());
  }, [weekStart, selectedCourtId, usingSupabase, groupId]);

  const timeRows = useMemo(() => (days.find((day) => day.slots.length)?.slots || []).map(({ startTime, endTime }) => ({ startTime, endTime })), [days]);

  return <div className="qp-weekly-agenda pb-4">
    <section className="qp-weekly-toolbar">
      <div><p>AGENDA DE QUADRAS</p><h2>{monthTitle(weekStart)}</h2></div>
      <div className="qp-weekly-actions">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={weekStart <= currentWeek} aria-label="Semana anterior"><ChevronLeft /></button>
        <button className="qp-today-button" onClick={() => setWeekStart(currentWeek)}>Hoje</button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Próxima semana"><ChevronRight /></button>
      </div>
    </section>

    <section className="qp-weekly-courts"><span>Espaço</span><div>{courts.map((court) => <button key={court.id} disabled={!court.active} onClick={() => setSelectedCourtId(court.id)} className={court.id === selectedCourtId ? 'is-active' : ''}>{court.name}{!court.active && ' · indisponível'}</button>)}</div></section>
    <div className="qp-weekly-legend"><span><i className="is-free" />Disponível</span><span><i className="is-booked" />Reservado</span><span><i className="is-pending" />Aguardando</span><span><i className="is-blocked" />Bloqueado</span></div>
    {loadError && <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">{loadError}</div>}

    <section className="qp-weekly-frame">
      {loading && <div className="qp-weekly-loading">Carregando semana...</div>}
      <div className="qp-weekly-grid">
        <div className="qp-weekly-corner"><Clock3 size={15} /></div>
        {weekDates.map((date) => { const label = dayLabel(date); return <div key={date} className={`qp-weekly-day ${date === today ? 'is-today' : ''}`}><strong>{label.weekday}</strong><span>{label.day}</span></div>; })}
        {timeRows.map((time) => <React.Fragment key={time.startTime}>
          <div className="qp-weekly-time"><strong>{time.startTime}</strong><span>{time.endTime}</span></div>
          {weekDates.map((date) => { const slot = days.find((day) => day.date === date)?.slots.find((item) => item.startTime === time.startTime); return <SlotCell key={`${date}-${time.startTime}`} slot={slot} isPast={date < today} currentUserId={currentUser?.id} onSelect={() => slot?.available && !slot.match && !slot.isBlocked && onScheduleSlot?.(date, slot.startTime, selectedCourtId)} />; })}
        </React.Fragment>)}
      </div>
      {!loading && !timeRows.length && <div className="qp-weekly-empty">Nenhum horário configurado para esta semana.</div>}
    </section>
    <p className="qp-weekly-hint">Toque em um horário disponível para reservar.</p>
  </div>;
};

const SlotCell: React.FC<{ slot?: CourtSlot; isPast: boolean; currentUserId?: string; onSelect: () => void }> = ({ slot, isPast, currentUserId, onSelect }) => {
  if (!slot || slot.isBlocked) return <div className="qp-slot is-blocked"><LockKeyhole size={14} /><strong>Bloqueado</strong><small>{slot?.blockReason || 'Indisponível'}</small></div>;
  if (slot.match) {
    const pending = slot.match.status === 'pending';
    const mine = !!currentUserId && [slot.match.player1Id, slot.match.player2Id].includes(currentUserId);
    return <div className={`qp-slot ${pending ? 'is-pending' : 'is-booked'}`}><Users size={14} /><strong>{pending ? 'Aguardando' : 'Reservado'}</strong><small>{mine ? 'Meu jogo' : `${slot.match.player1Name} × ${slot.match.player2Name}`}</small></div>;
  }
  if (!slot.available || isPast) return <div className="qp-slot is-closed"><Clock3 size={14} /><strong>Encerrado</strong></div>;
  return <button className="qp-slot is-free" onClick={onSelect}><strong>Disponível</strong><small>Reservar</small></button>;
};
