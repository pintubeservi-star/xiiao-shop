-- Remove a redundant tracking endpoint; Cotuí Go uses the token-scoped cg_get_public_trip RPC
-- and the existing trip:<token> Realtime broadcast triggers from migration 0014.
drop function if exists public.cg_public_track_service(text);
drop policy if exists "cg live tracking channel read" on realtime.messages;
drop policy if exists "cg assigned driver broadcast location" on realtime.messages;