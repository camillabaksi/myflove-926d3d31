import fs from "node:fs/promises";
import assert from "node:assert/strict";
// Install @electric-sql/pglite@0.3.14 in an isolated test directory; set PGLITE_MODULE to its dist/index.js.
const { PGlite } = await import(process.env.PGLITE_MODULE ?? "@electric-sql/pglite");
const db = new PGlite();
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.user_roles(user_id uuid, role text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
INSERT INTO auth.users VALUES
('00000000-0000-4000-8000-000000000001','a@example.test','{}'),
('00000000-0000-4000-8000-000000000002','b@example.test','{}'),
('00000000-0000-4000-8000-000000000003','admin@example.test','{}'),
('00000000-0000-4000-8000-000000000004','demo@example.test','{"demo_account":true}'),
('00000000-0000-4000-8000-000000000005','skip@example.test','{}');
INSERT INTO public.user_roles VALUES('00000000-0000-4000-8000-000000000003','admin');
`);
await db.exec(
  await fs.readFile(
    new URL("../drizzle/migrations/0022_pilot_weekly_pulse.sql", import.meta.url),
    "utf8",
  ),
);
const week = (
  await db.query(
    `SELECT date_trunc('week', timezone('Europe/Stockholm', statement_timestamp()))::date::text AS week`,
  )
).rows[0].week;
const ids = (n) => `00000000-0000-4000-8000-00000000000${n}`;
async function who(n) {
  await db.exec("RESET ROLE");
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [n ? ids(n) : ""]);
  await db.exec("SET ROLE authenticated");
}
async function action(
  type,
  revision = null,
  answers = [null, null, null],
  consent = false,
  whichWeek = week,
) {
  return db.query("SELECT public.update_my_weekly_pulse($1::date,$2,$3,$4,$5,$6,$7)", [
    whichWeek,
    type,
    revision,
    consent,
    ...answers,
  ]);
}
const own = async () => (await db.query("SELECT * FROM public.pilot_weekly_pulses")).rows;
const stats = async () => (await db.query("SELECT * FROM public.get_weekly_pulse_stats()")).rows;
const denies = async (fn, code) => {
  await assert.rejects(fn, (error) => error.code === code);
};
await db.exec("SET ROLE anon");
await denies(() => own(), "42501");
await denies(() => action("open"), "42501");
await denies(() => stats(), "42501");
await who(1);
await denies(
  () =>
    db.query("INSERT INTO public.pilot_weekly_pulses(user_id,week_start) VALUES($1,$2)", [
      ids(1),
      week,
    ]),
  "42501",
);
await action("open");
await action("open");
assert.equal((await own()).length, 1);
await denies(() => action("submit", 0, [6, 4, 1], true), "22023");
await denies(() => action("submit", 0, [5, null, 1], true), "22023");
await denies(() => action("submit", 0, [5, 4, 1], false), "22023");
await denies(() => action("submit", 0, [5, 4, 1], true, "2000-01-03"), "22023");
await action("submit", 0, [5, 4, 1], true);
await action("submit", 0, [5, 4, 1], true);
assert.equal((await own())[0].revision, 1);
await denies(() => stats(), "42501");
await who(2);
assert.equal((await own()).length, 0);
await action("open");
await action("submit", 0, [1, 2, 5], true);
await who(1);
assert.equal((await own())[0].overview, 5);
await action("submit", 1, [4, 4, 2], true);
await denies(() => action("submit", 1, [1, 1, 1], true), "40001");
for (const n of [3, 4]) {
  await who(n);
  await action("open");
  await action("submit", 0, [3, 3, 3], true);
}
await who(5);
await action("dismiss");
assert.equal((await own())[0].opened_at, null);
await who(3);
let data = await stats();
assert.equal(data.length, 8);
assert.equal(data[0].opened, 2);
assert.equal(data[0].answered, 2);
assert.deepEqual(data[0].overview_counts, [1, 0, 0, 1, 0]);
assert.ok(!Object.keys(data[0]).includes("user_id"));
assert.equal((await own()).length, 1);
await who(2);
await action("withdraw", 1);
await action("withdraw", 1);
assert.equal((await own())[0].submitted_at, null);
assert.equal((await own())[0].overview, null);
await denies(() => action("submit", 1, [2, 2, 2], true), "40001");
await who(3);
data = await stats();
assert.equal(data[0].answered, 1);
assert.equal(data[0].opened, 2);
assert.deepEqual(data[0].burden_counts, [0, 1, 0, 0, 0]);
await who(null);
await denies(() => action("open"), "42501");
await denies(() => stats(), "42501");
await db.exec("RESET ROLE");
await db.query("DELETE FROM auth.users WHERE id=$1", [ids(1)]);
assert.equal(
  (await db.query("SELECT * FROM public.pilot_weekly_pulses WHERE user_id=$1", [ids(1)])).rows
    .length,
  0,
);
console.log(
  "PASS: migration, RLS, anonymous access, account isolation, consent/range validation, one row per week, idempotent retry, stale edits, withdrawal, aggregate-only admin data, admin/demo exclusions, start denominator, account deletion cascade.",
);
await db.close();
