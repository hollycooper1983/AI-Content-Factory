\set ON_ERROR_STOP 0
insert into auth.users values ('00000000-0000-0000-0000-00000000000a','a@x.com'),('00000000-0000-0000-0000-00000000000b','b@x.com');

-- Owner A
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
\echo [1] create business with plan=pro (expect RLS violation)
insert into businesses (owner_id,name,slug,plan,timezone) values (auth.uid(),'A','studio-a','pro','America/New_York');
\echo [2] create business normally
insert into businesses (owner_id,name,slug,timezone,buffer_minutes,min_notice_minutes) values (auth.uid(),'A','studio-a','America/New_York',15,0);
select count(*) as weekly_rows from weekly_hours;
\echo [3] try to self-upgrade plan (expect permission denied)
update businesses set plan='pro';
\echo [4] owner updates allowed column
update businesses set about='hello' returning about;
insert into services (business_id,name,duration_minutes,price_cents) select id,'Cut',60,6500 from businesses;
insert into clients (business_id,name,email) select id,'Jo','jo@x.com' from businesses;
\echo [5] book Tue 2026-11-03 10:00 NY (15:00Z)
insert into appointments (business_id,service_id,client_id,starts_at,ends_at,blocked_until)
 select b.id,s.id,c.id,'2026-11-03T15:00Z','2026-11-03T15:00Z','2026-11-03T15:00Z' from businesses b, services s, clients c returning ends_at, blocked_until;
\echo [6] overlapping 10:30 (expect exclusion violation)
insert into appointments (business_id,service_id,client_id,starts_at,ends_at,blocked_until)
 select b.id,s.id,c.id,'2026-11-03T15:30Z','2026-11-03T15:30Z','2026-11-03T15:30Z' from businesses b, services s, clients c;
\echo [7] inside buffer 11:05 (expect exclusion violation)
insert into appointments (business_id,service_id,client_id,starts_at,ends_at,blocked_until)
 select b.id,s.id,c.id,'2026-11-03T16:05Z','2026-11-03T16:05Z','2026-11-03T16:05Z' from businesses b, services s, clients c;
\echo [8] after buffer 11:15 (ok)
insert into appointments (business_id,service_id,client_id,starts_at,ends_at,blocked_until)
 select b.id,s.id,c.id,'2026-11-03T16:15Z','2026-11-03T16:15Z','2026-11-03T16:15Z' from businesses b, services s, clients c returning starts_at;

-- Owner B isolation
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
\echo [9] owner B sees business A data? (expect 0 0 0)
select (select count(*) from clients) clients, (select count(*) from appointments) appts, (select count(*) from businesses) biz;
\echo [10] owner B inserts client into business A (expect RLS violation)
insert into clients (business_id,name) select id,'Hack' from businesses;
insert into clients (business_id,name) values ((select id from public.businesses limit 1), 'Hack');

-- Anonymous customer
reset role; set role anon; reset request.jwt.claim.sub;
\echo [11] anon reads clients table (expect permission/RLS -> 0 rows or denied)
select count(*) from clients;
\echo [12] public business json
select get_public_business('studio-a')->'business'->>'name' as name, jsonb_array_length(get_public_business('studio-a')->'services') services;
\echo [13] busy intervals (times only)
select * from get_busy_intervals('studio-a','2026-11-01','2026-11-10');
\echo [14] public booking in taken slot (expect SLOT_TAKEN)
select create_public_booking('studio-a',(select (get_public_business('studio-a')->'services'->0->>'id')::uuid),'2026-11-03T15:30Z','Pat','','pat@x.com','');
\echo [15] public booking at 1pm (lunch break, expect OUTSIDE_HOURS)
select create_public_booking('studio-a',(select (get_public_business('studio-a')->'services'->0->>'id')::uuid),'2026-11-03T17:00Z','Pat','','pat@x.com','');
\echo [16] public booking Sunday (expect OUTSIDE_HOURS)
select create_public_booking('studio-a',(select (get_public_business('studio-a')->'services'->0->>'id')::uuid),'2026-11-08T15:00Z','Pat','','pat@x.com','');
\echo [17] valid public booking 2pm (ok)
select create_public_booking('studio-a',(select (get_public_business('studio-a')->'services'->0->>'id')::uuid),'2026-11-03T19:00Z','Pat','','pat@x.com','') ->> 'endsAt' as ends;
\echo [18] manage: reschedule into taken slot then cancel
reset role;
select manage_token as tok from appointments where source='booking_page' \gset
set role anon;
select get_managed_booking(:'tok')->>'serviceName' as svc;
select reschedule_managed_booking(:'tok','2026-11-03T15:00Z');
select reschedule_managed_booking(:'tok','2026-11-04T19:00Z');
select cancel_managed_booking(:'tok');
select get_managed_booking(:'tok')->'appointment'->>'status' as status_after_cancel;
\echo [19] bad token
select get_managed_booking('short');
\echo [20] deletion request insert ok, read denied
insert into deletion_requests (email) values ('x@y.com');
select count(*) from deletion_requests;

\echo [21] free plan cap at 30 upcoming
reset role;
do $$ declare i int; b uuid; s uuid; c uuid; begin
 select id into b from businesses; select id into s from services; select id into c from clients;
 for i in 1..40 loop
  begin
   insert into appointments (business_id,service_id,client_id,starts_at,ends_at,blocked_until)
   values (b,s,c, now() + make_interval(days => 10, hours => i*2), now(), now());
  exception when others then raise notice 'stopped at % : %', i, sqlerrm; exit; end;
 end loop; end $$;
select count(*) filter (where status in ('pending','confirmed') and starts_at >= now()) as upcoming from appointments;
\echo [22] account deletion cascades
delete from auth.users where id='00000000-0000-0000-0000-00000000000a';
select (select count(*) from businesses) biz, (select count(*) from appointments) appts, (select count(*) from clients) clients;
