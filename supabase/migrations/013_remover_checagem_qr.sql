-- Versão 114: o fluxo de QR Code (dupla leitura entre celulares) foi
-- substituído pelo check-in de um toque ("JOGAMOS") com localização visível
-- apenas ao administrador. A função antiga não é mais usada pelo app.
drop function if exists public.checar_partida_qr(uuid, uuid, bigint);
