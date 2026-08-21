import { Player, Match, BlockedSlot, CourtConfig, TennisClass, Court } from '../types';
import { getBrasiliaToday, addDays } from '../utils/dateUtils';

export const DEFAULT_COURT_CONFIG: CourtConfig = {
  courtName: "Quadra 1",
  clubName: "Tangará Country Clube",
  groupName: "Nosso Tênis",
  slotDurationMinutes: 90,
  openTime: "07:00",
  closeTime: "19:00",
  activeDays: [0, 1, 2, 3, 4, 5, 6], // Sunday to Saturday
  maxAdvanceBookingDays: 14,
};

export const COURTS: Court[] = [
  { id: 'court-1', name: 'Quadra 1', surface: 'Saibro', active: true },
  { id: 'court-2', name: 'Quadra 2', surface: 'Saibro', active: true },
  { id: 'court-3', name: 'Quadra 3', surface: 'Rápida', active: true },
  { id: 'court-4', name: 'Quadra 4', surface: 'Rápida', active: true },
];

// 10 players for each of the 5 classes (50 players total)
const initialPlayersData: { name: string; tennisClass: TennisClass; email: string; phone: string; isAdmin?: boolean }[] = [
  // CLASSE A (10 Jogadores)
  { name: "Rodrigo Silveira", tennisClass: "A", email: "rodrigo.silveira@tangara.com", phone: "(11) 98123-4501", isAdmin: true },
  { name: "Lucas Faria", tennisClass: "A", email: "lucas.faria@tangara.com", phone: "(11) 98123-4502" },
  { name: "Guilherme Santos", tennisClass: "A", email: "guilherme.santos@tangara.com", phone: "(11) 98123-4503" },
  { name: "Felipe Miranda", tennisClass: "A", email: "felipe.miranda@tangara.com", phone: "(11) 98123-4504" },
  { name: "Marcelo Costa", tennisClass: "A", email: "marcelo.costa@tangara.com", phone: "(11) 98123-4505" },
  { name: "Eduardo Paiva", tennisClass: "A", email: "eduardo.paiva@tangara.com", phone: "(11) 98123-4506" },
  { name: "Bruno Nogueira", tennisClass: "A", email: "bruno.nogueira@tangara.com", phone: "(11) 98123-4507" },
  { name: "Thiago Vasconcelos", tennisClass: "A", email: "thiago.vasconcelos@tangara.com", phone: "(11) 98123-4508" },
  { name: "Alexandre Pires", tennisClass: "A", email: "alexandre.pires@tangara.com", phone: "(11) 98123-4509" },
  { name: "Renato Alencar", tennisClass: "A", email: "renato.alencar@tangara.com", phone: "(11) 98123-4510" },

  // CLASSE B (10 Jogadores)
  { name: "Carlos Eduardo Mendes", tennisClass: "B", email: "carlos.mendes@tangara.com", phone: "(11) 98223-4511" },
  { name: "André Luiz Castro", tennisClass: "B", email: "andre.castro@tangara.com", phone: "(11) 98223-4512" },
  { name: "Gustavo Henrique", tennisClass: "B", email: "gustavo.henrique@tangara.com", phone: "(11) 98223-4513" },
  { name: "Fernando Duarte", tennisClass: "B", email: "fernando.duarte@tangara.com", phone: "(11) 98223-4514" },
  { name: "Leandro Martins", tennisClass: "B", email: "leandro.martins@tangara.com", phone: "(11) 98223-4515" },
  { name: "Rafael Bittencourt", tennisClass: "B", email: "rafael.bittencourt@tangara.com", phone: "(11) 98223-4516" },
  { name: "Diego Camargo", tennisClass: "B", email: "diego.camargo@tangara.com", phone: "(11) 98223-4517" },
  { name: "Vinicius Borges", tennisClass: "B", email: "vinicius.borges@tangara.com", phone: "(11) 98223-4518" },
  { name: "Caio Prado", tennisClass: "B", email: "caio.prado@tangara.com", phone: "(11) 98223-4519" },
  { name: "Daniel Fontes", tennisClass: "B", email: "daniel.fontes@tangara.com", phone: "(11) 98223-4520" },

  // CLASSE C (10 Jogadores)
  { name: "Marcos Vinicius", tennisClass: "C", email: "marcos.vinicius@tangara.com", phone: "(11) 98323-4521" },
  { name: "Leonardo Rocha", tennisClass: "C", email: "leonardo.rocha@tangara.com", phone: "(11) 98323-4522" },
  { name: "Danilo Ferraz", tennisClass: "C", email: "danilo.ferraz@tangara.com", phone: "(11) 98323-4523" },
  { name: "Fabio Azevedo", tennisClass: "C", email: "fabio.azevedo@tangara.com", phone: "(11) 98323-4524" },
  { name: "Otavio Guimarães", tennisClass: "C", email: "otavio.guimaraes@tangara.com", phone: "(11) 98323-4525" },
  { name: "Sergio Brandão", tennisClass: "C", email: "sergio.brandao@tangara.com", phone: "(11) 98323-4526" },
  { name: "Luciano Ramos", tennisClass: "C", email: "luciano.ramos@tangara.com", phone: "(11) 98323-4527" },
  { name: "Helio Albuquerque", tennisClass: "C", email: "helio.albuquerque@tangara.com", phone: "(11) 98323-4528" },
  { name: "Vitor Valente", tennisClass: "C", email: "vitor.valente@tangara.com", phone: "(11) 98323-4529" },
  { name: "Wagner Lins", tennisClass: "C", email: "wagner.lins@tangara.com", phone: "(11) 98323-4530" },

  // CLASSE D (10 Jogadores)
  { name: "Paulo Henrique", tennisClass: "D", email: "paulo.henrique@tangara.com", phone: "(11) 98423-4531" },
  { name: "Cristiano Barreto", tennisClass: "D", email: "cristiano.barreto@tangara.com", phone: "(11) 98423-4532" },
  { name: "Roberto Maia", tennisClass: "D", email: "roberto.maia@tangara.com", phone: "(11) 98423-4533" },
  { name: "Adriano Gomes", tennisClass: "D", email: "adriano.gomes@tangara.com", phone: "(11) 98423-4534" },
  { name: "Julio Cesar", tennisClass: "D", email: "julio.cesar@tangara.com", phone: "(11) 98423-4535" },
  { name: "Cesar Menotti", tennisClass: "D", email: "cesar.menotti@tangara.com", phone: "(11) 98423-4536" },
  { name: "Flavio Rezende", tennisClass: "D", email: "flavio.rezende@tangara.com", phone: "(11) 98423-4537" },
  { name: "Claudio Siqueira", tennisClass: "D", email: "claudio.siqueira@tangara.com", phone: "(11) 98423-4538" },
  { name: "Gilberto Teles", tennisClass: "D", email: "gilberto.teles@tangara.com", phone: "(11) 98423-4539" },
  { name: "Emerson Toledo", tennisClass: "D", email: "emerson.toledo@tangara.com", phone: "(11) 98423-4540" },

  // CLASSE E (10 Jogadores)
  { name: "Mauricio Neves", tennisClass: "E", email: "mauricio.neves@tangara.com", phone: "(11) 98523-4541" },
  { name: "Henrique Prado", tennisClass: "E", email: "henrique.prado@tangara.com", phone: "(11) 98523-4542" },
  { name: "Wellington Prado", tennisClass: "E", email: "wellington.prado@tangara.com", phone: "(11) 98523-4543" },
  { name: "Nelson Antunes", tennisClass: "E", email: "nelson.antunes@tangara.com", phone: "(11) 98523-4544" },
  { name: "Joaquim Bezerra", tennisClass: "E", email: "joaquim.bezerra@tangara.com", phone: "(11) 98523-4545" },
  { name: "Everton Santana", tennisClass: "E", email: "everton.santana@tangara.com", phone: "(11) 98523-4546" },
  { name: "Rogerio Vianna", tennisClass: "E", email: "rogerio.vianna@tangara.com", phone: "(11) 98523-4547" },
  { name: "Beto Pacheco", tennisClass: "E", email: "beto.pacheco@tangara.com", phone: "(11) 98523-4548" },
  { name: "Rubens Barrichello", tennisClass: "E", email: "rubens.barrichello@tangara.com", phone: "(11) 98523-4549" },
  { name: "Denis Carvalho", tennisClass: "E", email: "denis.carvalho@tangara.com", phone: "(11) 98523-4550" },
];

export const INITIAL_PLAYERS: Player[] = initialPlayersData.map((p, idx) => ({
  id: `player-${idx + 1}`,
  name: p.name,
  email: p.email,
  phone: p.phone,
  tennisClass: p.tennisClass,
  isAdmin: !!p.isAdmin,
  createdAt: '2026-08-01T00:00:00Z',
}));

export function generateInitialMatches(): Match[] {
  const today = getBrasiliaToday();
  const dayPlus1 = addDays(today, 1);
  const dayPlus2 = addDays(today, 2);
  const dayPlus3 = addDays(today, 3);
  const dayMinus2 = addDays(today, -2);
  const dayMinus5 = addDays(today, -5);

  return [
    // Upcoming matches
    {
      id: 'match-1',
      player1Id: 'player-1', // Rodrigo Silveira (A)
      player1Name: 'Rodrigo Silveira',
      player2Id: 'player-2', // Lucas Faria (A)
      player2Name: 'Lucas Faria',
      tennisClass: 'A',
      courtId: 'court-1',
      courtName: DEFAULT_COURT_CONFIG.courtName,
      date: dayPlus1,
      startTime: '18:00',
      endTime: '19:00',
      status: 'scheduled',
      createdAt: '2026-08-18T10:00:00Z'
    },
    {
      id: 'match-2',
      player1Id: 'player-11', // Carlos Eduardo Mendes (B)
      player1Name: 'Carlos Eduardo Mendes',
      player2Id: 'player-12', // André Luiz Castro (B)
      player2Name: 'André Luiz Castro',
      tennisClass: 'B',
      courtId: 'court-1',
      courtName: DEFAULT_COURT_CONFIG.courtName,
      date: dayPlus2,
      startTime: '19:00',
      endTime: '20:00',
      status: 'scheduled',
      createdAt: '2026-08-19T14:30:00Z'
    },
    {
      id: 'match-3',
      player1Id: 'player-21', // Marcos Vinicius (C)
      player1Name: 'Marcos Vinicius',
      player2Id: 'player-22', // Leonardo Rocha (C)
      player2Name: 'Leonardo Rocha',
      tennisClass: 'C',
      courtId: 'court-1',
      courtName: DEFAULT_COURT_CONFIG.courtName,
      date: dayPlus3,
      startTime: '08:00',
      endTime: '09:00',
      status: 'scheduled',
      createdAt: '2026-08-19T16:00:00Z'
    },
    // Past completed matches
    {
      id: 'match-past-1',
      player1Id: 'player-11', // Carlos Eduardo Mendes (B)
      player1Name: 'Carlos Eduardo Mendes',
      player2Id: 'player-13', // Gustavo Henrique (B)
      player2Name: 'Gustavo Henrique',
      tennisClass: 'B',
      courtId: 'court-1',
      courtName: DEFAULT_COURT_CONFIG.courtName,
      date: dayMinus2,
      startTime: '18:00',
      endTime: '19:00',
      status: 'completed',
      createdAt: '2026-08-15T09:00:00Z'
    },
    // Cancelled match
    {
      id: 'match-cancelled-1',
      player1Id: 'player-11',
      player1Name: 'Carlos Eduardo Mendes',
      player2Id: 'player-14',
      player2Name: 'Fernando Duarte',
      tennisClass: 'B',
      courtId: 'court-1',
      courtName: DEFAULT_COURT_CONFIG.courtName,
      date: dayMinus5,
      startTime: '20:00',
      endTime: '21:00',
      status: 'cancelled',
      createdAt: '2026-08-12T11:00:00Z',
      cancelledAt: '2026-08-14T15:00:00Z',
      cancelledBy: 'Carlos Eduardo Mendes',
      cancelReason: 'Imprevisto de trabalho'
    }
  ];
}

export function generateInitialBlockedSlots(): BlockedSlot[] {
  const today = getBrasiliaToday();
  const maintenanceDate = addDays(today, 5);

  return [
    {
      id: 'block-1',
      date: maintenanceDate,
      startTime: '06:00',
      endTime: '12:00',
      allDay: false,
      reason: 'Manutenção periódica do Saibro / Rolagem',
      createdAt: '2026-08-15T08:00:00Z'
    }
  ];
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- QuadraPlay - Esquema do PostgreSQL / Supabase
-- Clube: Tangará Country Clube
-- Grupo: Nosso Tênis
-- ==========================================

-- 1. Tabela de Jogadores (Profiles / Players)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    tennis_class VARCHAR(1) NOT NULL CHECK (tennis_class IN ('A', 'B', 'C', 'D', 'E')),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Jogos / Agendamentos (Matches)
-- Restrição estrita de unicidade: 1 jogo por data e horário na quadra
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    player2_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    tennis_class VARCHAR(1) NOT NULL CHECK (tennis_class IN ('A', 'B', 'C', 'D', 'E')),
    court_name VARCHAR(100) NOT NULL DEFAULT 'Quadra Central (Saibro)',
    match_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by VARCHAR(255),
    cancel_reason TEXT,
    
    -- Restrições de Integridade:
    CONSTRAINT check_different_players CHECK (player1_id <> player2_id),
    CONSTRAINT unique_court_slot_when_scheduled UNIQUE (court_name, match_date, start_time)
);

-- 3. Tabela de Bloqueios de Quadra (Blocked Slots)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN NOT NULL DEFAULT false,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir leitura de jogadores para todos autenticados"
ON public.players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir leitura de jogos para todos autenticados"
ON public.matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir criação de agendamento se for participante"
ON public.matches FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM public.players WHERE id = player1_id)
);

CREATE POLICY "Permitir cancelamento aos participantes ou administradores"
ON public.matches FOR UPDATE TO authenticated
USING (
    auth.uid() = (SELECT auth_user_id FROM public.players WHERE id = player1_id) OR
    auth.uid() = (SELECT auth_user_id FROM public.players WHERE id = player2_id) OR
    EXISTS (SELECT 1 FROM public.players WHERE auth_user_id = auth.uid() AND is_admin = true)
);

-- Habilitar Supabase Realtime para notificações de agendamentos
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
`;
