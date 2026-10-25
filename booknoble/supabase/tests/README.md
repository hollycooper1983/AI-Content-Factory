# Database tests

`rls_and_booking.sql` exercises the security and booking guarantees against a
plain PostgreSQL 15+/16 database, using `supabase_stub.sql` to imitate
Supabase's `auth` schema and roles:

```bash
createdb bn_test
psql -d bn_test -f supabase/tests/supabase_stub.sql
psql -d bn_test -f supabase/migrations/20261025000000_init.sql
psql -d bn_test -f supabase/tests/rls_and_booking.sql
```

Each numbered step prints what it expects. Errors such as `SLOT_TAKEN`,
`OUTSIDE_HOURS`, `permission denied` and `row-level security` are the
expected outcomes for those steps. With the Supabase CLI you can instead run
the migration with `supabase db reset` and paste the test into the SQL editor.

Note: the test books fixed dates in early November 2026. If those dates are in
the past when you run it, shift them forward (the online rules reject past times).
