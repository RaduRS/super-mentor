-- ============================================================
-- SUPER MENTOR - HARDENED DATABASE SCHEMA
-- Production-grade with all optional constraints
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp default now(),
  name text not null,
  email text unique not null,
  age integer check (age > 0 and age < 120),
  gender text,
  height_cm decimal check (height_cm > 0),
  timezone text default 'Europe/London',
  dietary_restrictions text[],
  food_dislikes text[],
  favorite_cuisines text[],
  cooking_skill text check (cooking_skill in ('beginner', 'intermediate', 'advanced')),
  budget_level text check (budget_level in ('tight', 'moderate', 'flexible')),
  activity_level text check (activity_level in ('sedentary', 'moderate', 'active')),
  injuries text[],
  medical_conditions text[],
  equipment_available text[],
  reading_speed_wpm integer check (reading_speed_wpm > 0),
  favorite_genres text[],
  sleep_schedule jsonb,
  work_schedule text,
  stress_level integer check (stress_level >= 1 and stress_level <= 10),
  birth_date date,
  birth_time time,
  birth_location text
);

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  category text not null check (category in ('fitness', 'nutrition', 'reading', 'lifestyle')),
  goal_type text not null check (goal_type in ('target', 'lifestyle')),
  description text not null,
  target_weight_kg decimal check (target_weight_kg > 0),
  target_measurements jsonb,
  starting_measurements jsonb,
  calorie_mode text check (calorie_mode in ('deficit', 'maintenance', 'surplus')),
  macro_targets jsonb,
  daily_reading_minutes integer check (daily_reading_minutes > 0),
  books_per_month integer check (books_per_month > 0),
  status text not null default 'active' check (status in ('active', 'achieved', 'maintenance')),
  achieved_at timestamp
);

create table if not exists measurements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  measured_at timestamp not null default now(),
  weight_kg decimal check (weight_kg > 0),
  belly_cm decimal check (belly_cm > 0),
  chest_cm decimal check (chest_cm > 0),
  biceps_left_cm decimal check (biceps_left_cm > 0),
  biceps_right_cm decimal check (biceps_right_cm > 0),
  calves_left_cm decimal check (calves_left_cm > 0),
  calves_right_cm decimal check (calves_right_cm > 0),
  thighs_left_cm decimal check (thighs_left_cm > 0),
  thighs_right_cm decimal check (thighs_right_cm > 0),
  shoulders_cm decimal check (shoulders_cm > 0),
  neck_cm decimal check (neck_cm > 0),
  body_fat_percentage decimal check (body_fat_percentage >= 0 and body_fat_percentage <= 100),
  input_method text check (input_method in ('manual', 'ai_extracted'))
);

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp not null default now(),
  manager text not null check (manager in ('atlas', 'forge', 'olive', 'lexicon')),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  tokens_used integer check (tokens_used >= 0)
);

create table if not exists embeddings (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp not null default now(),
  embedding vector(1536) not null,
  content_chunk text not null,
  manager text not null check (manager in ('atlas', 'forge', 'olive', 'lexicon')),
  category text check (category in ('fitness', 'nutrition', 'reading', 'general'))
);

create table if not exists meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  start_date date not null,
  end_date date not null,
  status text not null default 'proposed' check (status in ('proposed', 'committed', 'completed')),
  committed_at timestamp,
  generation_context jsonb,
  user_feedback text,
  
  -- ✅ Date validity check
  check (end_date >= start_date)
);

create table if not exists meals (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  scheduled_date date not null,
  scheduled_time time not null,
  name text not null,
  description text,
  ingredients jsonb not null,
  preparation_steps text[],
  prep_time_minutes integer check (prep_time_minutes >= 0),
  calories decimal check (calories >= 0),
  protein_g decimal check (protein_g >= 0),
  carbs_g decimal check (carbs_g >= 0),
  fats_g decimal check (fats_g >= 0),
  fiber_g decimal check (fiber_g >= 0),
  vitamin_a_mcg decimal check (vitamin_a_mcg >= 0),
  vitamin_b12_mcg decimal check (vitamin_b12_mcg >= 0),
  vitamin_c_mg decimal check (vitamin_c_mg >= 0),
  vitamin_d_mcg decimal check (vitamin_d_mcg >= 0),
  vitamin_e_mg decimal check (vitamin_e_mg >= 0),
  vitamin_k_mcg decimal check (vitamin_k_mcg >= 0),
  iron_mg decimal check (iron_mg >= 0),
  calcium_mg decimal check (calcium_mg >= 0),
  magnesium_mg decimal check (magnesium_mg >= 0),
  omega3_g decimal check (omega3_g >= 0),
  health_benefits text[],
  logged_at timestamp,
  actually_eaten boolean default false,
  user_rating integer check (user_rating >= 1 and user_rating <= 5),
  would_eat_again boolean,
  original_meal_id uuid references meals(id) on delete set null,
  swap_count integer default 0 check (swap_count >= 0),
  status text not null default 'active' check (status in ('active', 'replaced')),
  reminded_at timestamp
);

create table if not exists shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  shopping_date date not null,
  total_estimated_cost decimal check (total_estimated_cost >= 0),
  items jsonb not null,
  completed boolean default false,
  completed_at timestamp
);

create table if not exists nutrition_tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  total_calories decimal check (total_calories >= 0),
  total_protein_g decimal check (total_protein_g >= 0),
  total_carbs_g decimal check (total_carbs_g >= 0),
  total_fats_g decimal check (total_fats_g >= 0),
  total_fiber_g decimal check (total_fiber_g >= 0),
  total_vitamin_a_mcg decimal check (total_vitamin_a_mcg >= 0),
  total_vitamin_b12_mcg decimal check (total_vitamin_b12_mcg >= 0),
  total_vitamin_c_mg decimal check (total_vitamin_c_mg >= 0),
  total_vitamin_d_mcg decimal check (total_vitamin_d_mcg >= 0),
  total_vitamin_e_mg decimal check (total_vitamin_e_mg >= 0),
  total_vitamin_k_mcg decimal check (total_vitamin_k_mcg >= 0),
  total_iron_mg decimal check (total_iron_mg >= 0),
  total_calcium_mg decimal check (total_calcium_mg >= 0),
  total_magnesium_mg decimal check (total_magnesium_mg >= 0),
  total_omega3_g decimal check (total_omega3_g >= 0),
  calorie_target decimal check (calorie_target >= 0),
  protein_target_g decimal check (protein_target_g >= 0),
  carbs_target_g decimal check (carbs_target_g >= 0),
  fats_target_g decimal check (fats_target_g >= 0),
  deficiencies text[],
  nutrition_score integer check (nutrition_score >= 0 and nutrition_score <= 100),
  olive_feedback text
);

create table if not exists workout_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  scheduled_date date not null,
  scheduled_time time not null,
  workout_type text not null check (workout_type in ('strength', 'cardio', 'hiit', 'yoga', 'active_recovery', 'rest')),
  focus_areas text[],
  generation_context jsonb,
  exercises jsonb,
  total_duration_minutes integer check (total_duration_minutes > 0),
  intensity text not null check (intensity in ('low', 'moderate', 'high')),
  completed boolean default false,
  completed_at timestamp,
  user_feedback text,
  approved_by_atlas boolean default false,
  atlas_modifications text,
  reminded_at timestamp
);

create table if not exists workout_logs (
  id uuid primary key default uuid_generate_v4(),
  workout_plan_id uuid not null references workout_plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  logged_at timestamp not null default now(),
  exercise_name text not null,
  sets_completed integer check (sets_completed >= 0),
  reps_completed integer check (reps_completed >= 0),
  weight_used_kg decimal check (weight_used_kg >= 0),
  difficulty text check (difficulty in ('easy', 'moderate', 'hard')),
  form_quality text check (form_quality in ('good', 'needs_work')),
  notes text
);

create table if not exists muscle_balance_tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  calculated_at timestamp not null default now(),
  muscle_groups jsonb not null,
  balance_score integer check (balance_score >= 0 and balance_score <= 100),
  priority_areas text[],
  forge_notes text
);

create table if not exists books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  added_at timestamp default now(),
  title text not null,
  author text,
  isbn text,
  total_pages integer check (total_pages > 0),
  genre text,
  topic text,
  format text not null check (format in ('physical', 'ebook', 'audiobook')),
  audiobook_duration_minutes integer check (audiobook_duration_minutes > 0),
  status text not null default 'backlog' check (status in ('backlog', 'reading', 'completed', 'paused')),
  priority integer check (priority >= 1),
  current_page integer default 0 check (current_page >= 0),
  started_at timestamp,
  completed_at timestamp,
  open_library_id text,
  google_books_id text,
  
  -- ✅ Page validity check
  check (current_page <= total_pages or total_pages is null)
);

create table if not exists reading_sessions (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  started_at timestamp,
  ended_at timestamp,
  duration_minutes integer check (duration_minutes >= 0),
  pages_read integer check (pages_read >= 0),
  start_page integer check (start_page >= 0),
  end_page integer check (end_page >= 0),
  scheduled_time time,
  was_scheduled boolean default true,
  user_notes text,
  difficulty text check (difficulty in ('easy', 'moderate', 'challenging')),
  enjoyment integer check (enjoyment >= 1 and enjoyment <= 5),
  reminded_at timestamp,
  
  -- ✅ Time validity checks
  check (ended_at is null or ended_at >= started_at),
  check (end_page is null or start_page is null or end_page >= start_page)
);

create table if not exists reading_notes (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  page_number integer check (page_number > 0),
  chapter text,
  note_type text check (note_type in ('highlight', 'reflection', 'question', 'insight')),
  content text not null,
  discussed_with_lexicon boolean default false,
  lexicon_response text
);

create table if not exists reading_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  goal_type text not null check (goal_type in ('daily_pages', 'daily_minutes', 'books_per_month', 'complete_backlog')),
  target_value integer not null check (target_value > 0),
  current_streak integer default 0 check (current_streak >= 0),
  longest_streak integer default 0 check (longest_streak >= 0),
  status text not null check (status in ('active', 'achieved'))
);

create table if not exists user_schedules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  start_date date,
  end_date date,
  schedule_type text check (schedule_type in ('work', 'personal', 'recurring')),
  days_of_week integer[],
  event_type text check (event_type in ('work', 'meeting', 'workout', 'meal', 'reading', 'sleep', 'free_time')),
  start_time time,
  end_time time,
  specific_date date,
  title text,
  description text,
  is_flexible boolean default false,
  priority integer check (priority >= 1 and priority <= 10),
  
  -- ✅ Time validity checks
  check (end_date is null or start_date is null or end_date >= start_date),
  check (end_time is null or start_time is null or end_time > start_time)
);

create table if not exists daily_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  plan_date date not null,
  workout_plan_id uuid references workout_plans(id) on delete set null,
  meal_plan_id uuid references meal_plans(id) on delete set null,
  reading_goal_id uuid references reading_sessions(id) on delete set null,
  atlas_morning_message text,
  coordination_log jsonb,
  plan_status text check (plan_status in ('generated', 'in_progress', 'completed', 'partially_completed')),
  atlas_evening_summary text,
  completion_score integer check (completion_score >= 0 and completion_score <= 100),
  generated_evening_summary_at timestamp
);

create table if not exists ai_summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp default now(),
  summary_type text not null check (summary_type in ('daily', 'weekly', 'monthly')),
  start_date date not null,
  end_date date not null,
  summary_text text,
  metrics jsonb,
  achievements text[],
  areas_for_improvement text[],
  atlas_recommendations text,
  
  -- ✅ Date validity check
  check (end_date >= start_date)
);

create table if not exists manager_conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp default now(),
  initiator text not null check (initiator in ('atlas', 'forge', 'olive', 'lexicon')),
  recipient text not null check (recipient in ('atlas', 'forge', 'olive', 'lexicon')),
  conversation_context text check (conversation_context in ('daily_planning', 'goal_adjustment', 'conflict_resolution', 'cross_domain_sync')),
  message text not null,
  response text,
  visible_to_user boolean default false
);

-- ============================================================
-- INDEXES (Performance)
-- ============================================================

-- Basic user_id indexes
create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists measurements_user_id_measured_at_idx on measurements(user_id, measured_at desc);
create index if not exists conversations_user_id_manager_created_at_idx on conversations(user_id, manager, created_at desc);
create index if not exists embeddings_user_id_created_at_idx on embeddings(user_id, created_at desc);
create index if not exists meal_plans_user_id_start_date_idx on meal_plans(user_id, start_date desc);
create index if not exists meals_user_id_scheduled_date_idx on meals(user_id, scheduled_date desc);
create index if not exists workout_plans_user_id_scheduled_date_idx on workout_plans(user_id, scheduled_date desc);
create index if not exists workout_logs_user_id_logged_at_idx on workout_logs(user_id, logged_at desc);
create index if not exists books_user_id_status_priority_idx on books(user_id, status, priority);
create index if not exists reading_sessions_user_id_started_at_idx on reading_sessions(user_id, started_at desc);
create index if not exists user_schedules_user_id_start_end_idx on user_schedules(user_id, start_date, end_date);
create index if not exists daily_plans_user_id_plan_date_idx on daily_plans(user_id, plan_date desc);
create index if not exists ai_summaries_user_id_created_at_idx on ai_summaries(user_id, created_at desc);

-- ✅ ADDED: Foreign key join indexes (for performance)
create index if not exists meals_meal_plan_id_idx on meals(meal_plan_id);
create index if not exists shopping_lists_meal_plan_id_idx on shopping_lists(meal_plan_id);
create index if not exists workout_logs_workout_plan_id_idx on workout_logs(workout_plan_id);
create index if not exists reading_sessions_book_id_idx on reading_sessions(book_id);
create index if not exists reading_notes_book_id_idx on reading_notes(book_id);
create index if not exists embeddings_conversation_id_idx on embeddings(conversation_id);
create index if not exists daily_plans_workout_plan_id_idx on daily_plans(workout_plan_id);
create index if not exists daily_plans_meal_plan_id_idx on daily_plans(meal_plan_id);

-- Vector index
create index if not exists embeddings_embedding_ivfflat_idx
  on embeddings using ivfflat (embedding vector_cosine_ops);

-- Partial indexes
create index if not exists goals_active_idx 
  on goals(user_id, status) where status = 'active';

create index if not exists workout_plans_pending_idx
  on workout_plans(user_id, scheduled_date) where completed = false;

create index if not exists meal_plans_proposed_idx
  on meal_plans(user_id, start_date) where status = 'proposed';

create index if not exists books_reading_idx
  on books(user_id, priority) where status = 'reading';

create index if not exists meals_active_idx
  on meals(user_id, scheduled_date) where status = 'active';

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

create unique index if not exists measurements_user_date_unique 
  on measurements(user_id, date(measured_at));

create unique index if not exists nutrition_tracking_user_date_unique
  on nutrition_tracking(user_id, date);

create unique index if not exists daily_plans_user_date_unique
  on daily_plans(user_id, plan_date);

-- ============================================================
-- TRIGGERS
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_goals_updated_at 
  before update on goals
  for each row
  execute function update_updated_at_column();

create trigger update_user_schedules_updated_at
  before update on user_schedules
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- FUNCTIONS
-- ============================================================

create or replace function match_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_manager text default null,
  filter_category text default null
)
returns table (
  id uuid,
  content_chunk text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where embeddings.user_id = filter_user_id
    and (filter_manager is null or embeddings.manager = filter_manager)
    and (filter_category is null or embeddings.category = filter_category)
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- VIEWS
-- ============================================================

create or replace view user_progress_summary as
select 
  u.id as user_id,
  u.name,
  u.email,
  u.age,
  u.gender,
  u.height_cm,
  (select weight_kg from measurements where user_id = u.id order by measured_at desc limit 1) as current_weight,
  (select belly_cm from measurements where user_id = u.id order by measured_at desc limit 1) as current_belly,
  (select count(*) from workout_plans where user_id = u.id and completed = true) as total_workouts_completed,
  (select count(*) from books where user_id = u.id and status = 'completed') as total_books_completed,
  (select current_streak from reading_goals where user_id = u.id order by created_at desc limit 1) as reading_streak
from users u;

create or replace view todays_plans as
select
  dp.user_id,
  dp.plan_date,
  dp.atlas_morning_message,
  wp.workout_type,
  wp.total_duration_minutes as workout_duration,
  wp.completed as workout_completed,
  (select count(*) from meals m where m.meal_plan_id = dp.meal_plan_id and m.status = 'active') as total_meals,
  (select count(*) from meals m where m.meal_plan_id = dp.meal_plan_id and m.actually_eaten = true and m.status = 'active') as meals_logged
from daily_plans dp
left join workout_plans wp on dp.workout_plan_id = wp.id
where dp.plan_date = current_date;

-- ============================================================
-- COMPLETION
-- ============================================================

select '✅ Super Mentor HARDENED database setup complete! Production-grade with full constraints.' as status;
