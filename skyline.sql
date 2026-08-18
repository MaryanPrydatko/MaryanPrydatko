-- One row per ISO week: how many contributions that week.
-- Input: days(day date, n int), one row per day from the GitHub contribution calendar.
create table if not exists days (day date primary key, n int not null);
\copy days from 'days.csv' csv

\copy (select date_trunc('week', day)::date as week, sum(n) as n from days group by 1 order by 1) to 'weekly.csv' csv
