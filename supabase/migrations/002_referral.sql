-- Referral program
alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by uuid references profiles(id);
alter table profiles add column if not exists referral_rewards int not null default 0;

create index if not exists idx_profiles_referral_code on profiles(referral_code);

-- Backfill referral codes for existing users
update profiles
set referral_code = 'FD' || upper(substring(replace(id::text, '-', ''), 1, 8))
where referral_code is null;
