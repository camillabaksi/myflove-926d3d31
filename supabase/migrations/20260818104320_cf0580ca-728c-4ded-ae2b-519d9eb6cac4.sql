update public.user_kv
set value = (
  select coalesce(jsonb_agg(e), '[]'::jsonb)
  from jsonb_array_elements(value::jsonb) e
  where e->>'id' not in ('eq3nok3ai','nsagw1cu5','3c4r3lsxa','zuj1g8m0r')
)
where user_id = 'f4a99e03-2ca6-4229-8403-b8f855ed5560'
  and key = 'myflow-reminders'
  and jsonb_typeof(value::jsonb) = 'array';