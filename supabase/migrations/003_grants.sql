-- 003_grants.sql — table privileges matching the RLS policies in 001/002.
-- RLS still decides which rows each user can touch.

grant select, update          on public.profiles         to authenticated;
grant select, insert, update, delete
                              on public.cases            to authenticated;
grant select, insert, delete  on public.case_transcripts to authenticated;
grant select, insert, update  on public.consents         to authenticated;

-- case_messages and appointments were already granted in 002.