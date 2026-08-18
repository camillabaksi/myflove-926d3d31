update public.push_reminders set canceled_at = now()
where delivered_at is null and canceled_at is null
and (client_key like 'med:98fy3i1ak%'
  or client_key like 'med:6hh0xoqp5%'
  or client_key like 'med:5e6klu8dl%'
  or client_key like 'rem:3c4r3lsxa%'
  or client_key like 'rem:eq3nok3ai%'
  or client_key like 'rem:nsagw1cu5%'
  or client_key like 'rem:zuj1g8m0r%'
  or client_key like 'routine:mfsxb9noz%'
  or client_key like 'quickflow:test-undo%');