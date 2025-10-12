-- Create user profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create user roles table
create type public.app_role as enum ('admin', 'user', 'premium');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamp with time zone default now(),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- RLS for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Articles table
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text,
  category text not null,
  image_url text,
  source text,
  published_date date not null default current_date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.articles enable row level security;

create policy "Anyone can view articles"
  on public.articles for select
  using (true);

create policy "Admins can manage articles"
  on public.articles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Bookmarks table
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can create their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- NCERT content table
create table public.ncert_content (
  id uuid primary key default gen_random_uuid(),
  class_number int not null check (class_number between 6 and 12),
  subject text not null,
  chapter_number int not null,
  chapter_name text not null,
  pdf_url text,
  pages int,
  created_at timestamp with time zone default now(),
  unique(class_number, subject, chapter_number)
);

alter table public.ncert_content enable row level security;

create policy "Anyone can view NCERT content"
  on public.ncert_content for select
  using (true);

-- Previous Year Papers table
create table public.previous_papers (
  id uuid primary key default gen_random_uuid(),
  exam_type text not null,
  paper_name text not null,
  year int not null,
  questions_count int not null default 100,
  duration_minutes int not null default 120,
  pdf_url text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  created_at timestamp with time zone default now()
);

alter table public.previous_papers enable row level security;

create policy "Anyone can view previous papers"
  on public.previous_papers for select
  using (true);

-- Mock test templates
create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  questions_count int not null default 20,
  duration_minutes int not null default 30,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  created_at timestamp with time zone default now()
);

alter table public.mock_tests enable row level security;

create policy "Anyone can view mock tests"
  on public.mock_tests for select
  using (true);

-- Questions table
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.mock_tests(id) on delete cascade,
  paper_id uuid references public.previous_papers(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text,
  created_at timestamp with time zone default now()
);

alter table public.questions enable row level security;

create policy "Anyone can view questions"
  on public.questions for select
  using (true);

-- Test attempts table
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  test_id uuid references public.mock_tests(id) on delete cascade,
  paper_id uuid references public.previous_papers(id) on delete cascade,
  score int not null default 0,
  total_questions int not null,
  correct_answers int not null default 0,
  incorrect_answers int not null default 0,
  time_taken_minutes int,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.test_attempts enable row level security;

create policy "Users can view their own attempts"
  on public.test_attempts for select
  using (auth.uid() = user_id);

create policy "Users can create their own attempts"
  on public.test_attempts for insert
  with check (auth.uid() = user_id);

-- User answers table
create table public.user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.test_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_answer text check (selected_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean,
  is_bookmarked boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.user_answers enable row level security;

create policy "Users can view their own answers"
  on public.user_answers for select
  using (
    exists (
      select 1 from public.test_attempts
      where test_attempts.id = user_answers.attempt_id
      and test_attempts.user_id = auth.uid()
    )
  );

create policy "Users can create their own answers"
  on public.user_answers for insert
  with check (
    exists (
      select 1 from public.test_attempts
      where test_attempts.id = user_answers.attempt_id
      and test_attempts.user_id = auth.uid()
    )
  );

-- Downloads table
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null,
  content_id uuid not null,
  file_name text not null,
  downloaded_at timestamp with time zone default now()
);

alter table public.downloads enable row level security;

create policy "Users can view their own downloads"
  on public.downloads for select
  using (auth.uid() = user_id);

create policy "Users can create downloads"
  on public.downloads for insert
  with check (auth.uid() = user_id);

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_type text not null check (plan_type in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  start_date timestamp with time zone not null default now(),
  end_date timestamp with time zone not null,
  amount decimal(10,2) not null,
  created_at timestamp with time zone default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Referrals table
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade,
  referral_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  bonus_amount decimal(10,2) default 10.00,
  created_at timestamp with time zone default now()
);

alter table public.referrals enable row level security;

create policy "Users can view their own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Wallet table
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  balance decimal(10,2) not null default 0.00,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.wallets enable row level security;

create policy "Users can view their own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

-- Function to generate unique referral code
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    select exists(select 1 from public.referrals where referral_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;
  return new_code;
end;
$$;

-- Trigger to create wallet on profile creation
create or replace function public.create_user_wallet()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.wallets (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_user_wallet();

-- Updated at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_articles_updated_at
  before update on public.articles
  for each row execute procedure public.update_updated_at_column();

create trigger update_wallets_updated_at
  before update on public.wallets
  for each row execute procedure public.update_updated_at_column();