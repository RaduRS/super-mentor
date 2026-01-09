***

# **Super Mentor - AI-Powered Holistic Life Coach**

## **Complete Technical Specification \& Implementation Guide**


***

## **Part 1: Project Overview, Philosophy, and Architecture**


***

### **1.1 Project Vision**

**Super Mentor** is an advanced AI-powered life coaching application designed to help users achieve a holistic healthy lifestyle through intelligent coordination of fitness, nutrition, reading, and personal development goals. The system employs a multi-agent AI architecture where specialized "managers" collaborate under the supervision of a master coordinator (Atlas) to provide personalized, adaptive guidance.

### **1.2 Core Philosophy**

- **Holistic Health**: The body is a temple. Every aspect—physical fitness, nutrition, mental growth—is interconnected and must be optimized together.
- **Adaptive Intelligence**: Plans adapt daily based on sleep quality, stress levels, schedule changes, and progress, not rigid programs.
- **Lifestyle Over Targets**: Goals focus on sustainable lifestyle changes (maintenance mode) rather than short-term targets followed by regression.
- **Human-like Interaction**: AI managers feel like real coaches—proactive, conversational, empathetic, and intelligent.
- **Guardian Oversight**: Atlas protects user goals at all costs, rejecting or modifying specialist suggestions that conflict with holistic well-being.


### **1.3 User Goals**

The user seeks to achieve and maintain:

1. **Physical Excellence**:
    - Eliminate belly fat
    - Build balanced, well-defined muscle across all body parts (not just biceps)
    - Increase raw power and functional strength
    - Achieve a "ripped," proportionate physique appropriate for age, height, and gender
2. **Nutritional Mastery**:
    - Eat healthy, structured meals
    - Treat the body as a temple—optimal organ health (heart, liver, etc.)
    - Track and optimize micronutrients and macronutrients
    - Develop sustainable eating habits (not temporary diets)
3. **Intellectual Growth**:
    - Read daily or near-daily
    - Complete a backlog of 20 books + 15 audiobooks
    - Gain wisdom, knowledge, and self-understanding through reading
    - Engage in deep discussions about philosophy, psychology, and personal insights
4. **Overall Lifestyle**:
    - Maintain an active, robust, healthy lifestyle indefinitely
    - Balance work, training, nutrition, and personal growth
    - Develop sustainable habits that last years, not weeks

### **1.4 The Four AI Managers**

**Super Mentor** operates through a coordinated team of four AI managers, each with specialized expertise:

#### **Atlas (The Master Coordinator)**

- **Model**: GPT-5.2 (highest reasoning capability)
- **Role**: Supreme overseer and guardian of all goals
- **Responsibilities**:
    - Coordinates Forge, Olive, and Lexicon
    - Reviews and approves/rejects/modifies all specialist suggestions
    - Ensures all recommendations align with holistic well-being
    - Conducts daily planning (6 AM automated) by consulting all managers
    - Monitors progress across all domains (fitness, nutrition, reading)
    - Generates daily summaries (11:30 PM) and weekly/monthly reviews
    - Auto-adjusts goals when milestones are reached (e.g., shifts from fat loss to maintenance)
    - Acts as the primary interface for the user (user mainly chats with Atlas)
    - Anticipates conflicts (poor sleep → rejects intense workout)
    - Tracks lifestyle shifts (user goes vegetarian → notifies all managers)

**Atlas's Authority**: Atlas can override any manager. If Forge suggests HIIT but Atlas knows the user is stressed and sleep-deprived, Atlas will reject the suggestion and instruct Forge to propose active recovery instead.

***

#### **Forge (The Sport \& Fitness Manager)**

- **Model**: DeepSeek-V3.1 (excellent reasoning at low cost)
- **Role**: Fitness coach and muscle development specialist
- **Responsibilities**:
    - Designs daily adaptive workouts based on:
        - Current food intake (coordinated with Olive)
        - Sleep quality and stress levels
        - Recovery status and rest day needs
        - Progress toward balanced muscle development
        - User's schedule and available time
    - Tracks workout completion (checkbox logging)
    - Monitors muscle group balance to ensure proportionate development
    - Knows "ideal body" measurements for user's age, gender, height, weight
    - Adjusts intensity based on user feedback ("workout felt too hard")
    - Enforces rest days when needed
    - Suggests exercises for: fat loss, muscle gain, power development, functional strength
    - Adapts day-by-day (not rigid programs) based on real-time conditions

**Forge's Cross-Domain Awareness**:

- Queries Olive: "What did user eat yesterday? What's planned for today?" → designs workout around available energy/macros
- Queries Atlas: "How did user sleep? Any stress mentioned?" → adjusts intensity
- Notified of injuries or limitations → modifies exercises to avoid strain

***

#### **Olive (The Nutrition \& Health Manager)**

- **Model**: Kimi K2-0905 (strong at structured planning, cost-effective)
- **Role**: Nutritionist, meal planner, and medical advisor
- **Responsibilities**:
    - Creates 3-day meal plans (breakfast, lunch, dinner, snacks) with exact times
    - Generates shopping lists with exact quantities and ingredients
    - Tracks macronutrients (protein, carbs, fats, calories)
    - Tracks micronutrients (vitamins A, B, C, D, E, K, iron, calcium, omega-3, etc.)
    - Monitors organ health indicators (heart, liver, kidneys, gut health)
    - Issues deficiency warnings ("You need more Vitamin D—adding salmon tomorrow")
    - Suggests meals for recovery after workouts (coordinated with Forge)
    - Adapts to dietary preferences, restrictions, and allergies
    - Tracks what user actually ate vs. what was planned (accountability)
    - Asks for meal feedback ("How was the chicken quinoa bowl? Would you eat it again?")
    - Maintains a favorites library and avoids repetition
    - Adjusts calorie intake based on goals: deficit (fat loss) → maintenance → surplus (muscle gain)
    - Integrates with food databases (Spoonacular, Edamam) for accurate nutrition data
    - Proactively checks in if meals aren't logged (2 hours after scheduled meal time)

**Olive's Cross-Domain Awareness**:

- Queries Forge: "What exercises did user do this week?" → plans recovery meals (anti-inflammatory foods, protein for muscle repair)
- Queries Atlas: "Any lifestyle changes?" → adjusts meal plans (user goes vegetarian → replaces meat with plant protein)
- Notified of poor sleep/stress → suggests comfort foods, adaptogens, or calming meals

***

#### **Lexicon (The Reading \& Knowledge Manager)**

- **Model**: Kimi K2-0905 (256K context window for long book discussions)
- **Role**: Reading coach, philosopher, psychologist, and intellectual companion
- **Responsibilities**:
    - Tracks reading progress (books, audiobooks, pages, time spent)
    - Helps user navigate backlog of 20 books + 15 audiobooks
    - Suggests prioritization based on current life context ("You're stressed at work—let's read 'Man's Search for Meaning' now")
    - Encourages daily reading based on available time and reading speed
    - Discusses book content deeply (philosophy, psychology, stoicism, etc.)
    - Stores reading notes shared by user (always accessible to Lexicon for discussion)
    - Connects book insights to user's life goals ("Atomic Habits talks about habit stacking—Olive could apply this to meal prep")
    - Acts as intellectual companion for multipotentialite interests (philosophy, psychology, self-improvement)
    - Tracks audiobooks separately from physical books
    - Proactively checks in if reading session is missed ("You usually read at 8 PM—everything okay?")
    - Rotates between topics to maintain variety (philosophy one week, psychology next)
    - Integrates with book databases (Open Library, Google Books) for metadata

**Lexicon's Cross-Domain Awareness**:

- Primarily operates independently (Forge and Olive don't need to know what user reads)
- **Exception**: Atlas monitors all Lexicon conversations for holistic insights
    - Example: User discusses burnout with Lexicon → Atlas tells Forge to ease off training intensity
    - Example: User reads about intermittent fasting → Atlas asks Olive if this aligns with goals

***

### **1.5 System Architecture**

#### **Multi-Agent Coordination Model**

**Shared Memory Pool Approach**:

- All four managers have direct read access to a centralized Supabase database
- Each manager can query cross-domain data as needed:
    - Forge queries: "What did user eat in last 24 hours?"
    - Olive queries: "What exercises did user do this week?"
    - Lexicon queries: "What's user's schedule today?" (to find reading windows)
    - Atlas queries: Everything (full visibility)

**Atlas's Coordination Workflow**:

1. **Nightly Planning (6 AM automated cron job)**:
    - Atlas initiates daily planning sequence
    - Atlas queries user's schedule for the day (from calendar table)
    - Atlas consults Forge: "What workout for today?"
    - Forge queries Olive's meal plan and user's recent workouts → suggests workout
    - Atlas reviews Forge's suggestion against user's sleep/stress/schedule
    - If conflicts detected → Atlas rejects and requests alternative
    - Forge provides modified suggestion
    - Atlas approves final workout
    - Atlas consults Olive: "What meals for today?"
    - Olive queries Forge's workout plan → suggests meals optimized for workout recovery/energy
    - Atlas reviews meal plan
    - Atlas consults Lexicon: "Reading goal for today?"
    - Lexicon checks user's schedule and reading progress → suggests session
    - Atlas compiles final daily plan (workout + meals + snacks + reading session + times)
    - Daily plan is ready when user wakes up
2. **Real-Time Adaptation**:
    - User wakes at 4 AM (early/poor sleep) and chats with Atlas
    - Atlas notes sleep disruption
    - At 6 AM planning, Atlas already has updated context → rejects intense workout, approves yoga instead
3. **Proactive Manager Check-ins**:
    - Each manager monitors their domain throughout the day
    - If user doesn't log breakfast 2 hours after scheduled time → Olive reaches out
    - If user doesn't start workout 30 min after scheduled time → Forge reaches out
    - If user doesn't start reading session at scheduled time → Lexicon reaches out
    - Managers ask questions until satisfied ("Why did you skip breakfast? Did you eat something else?")
4. **Daily Summary (11:30 PM)**:
    - Atlas generates end-of-day summary
    - Reviews what was completed vs. planned
    - Highlights wins and areas for improvement
    - Prepares context for next day's planning

***

#### **Manager-to-Manager Communication Visibility**

**User sees Atlas's coordination conversations** (Option B from earlier discussion):

**Example Morning Message from Atlas**:

```
[Atlas - 6:30 AM]
Good morning! I've consulted with the team overnight. Here's today's plan:

🏋️ Workout (Forge):
Forge initially suggested HIIT cardio, but I adjusted to 20 minutes of yoga + light stretching since you mentioned sleep issues last night (5 hours). Low intensity, stress relief focused.

🍽️ Meals (Olive):
Breakfast (8:00 AM): Greek yogurt with berries, almonds, honey
Snack (11:00 AM): Apple with peanut butter
Lunch (1:00 PM): Grilled chicken salad with quinoa, avocado
Snack (4:00 PM): Protein shake
Dinner (7:00 PM): Baked salmon with roasted vegetables, brown rice

Olive optimized today's meals for sustained energy and recovery from yesterday's leg workout.

📚 Reading (Lexicon):
25 minutes at 8:00 PM - Continue "Atomic Habits" (you're on page 44). Lexicon wants to discuss habit stacking concepts with you tonight.

Ready to start your day? Let me know if anything needs adjustment!
```

**User can also expand to see raw manager conversation** (optional detailed view):

- Click "View Planning Conversation" → shows full Atlas ↔ Forge ↔ Olive ↔ Lexicon dialogue

***

### **1.6 Tech Stack**

#### **Frontend**

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS (utility-first, responsive design)
- **Component Library**: shadcn/ui (accessible, customizable components)
- **State Management**: React Context + Zustand (for complex state)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Charts**: Recharts or Chart.js (for progress visualization)


#### **Backend**

- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Vector Search**: pgvector extension (for semantic memory search)
- **API Routes**: Next.js API routes (serverless functions)
- **Cron Jobs**: Vercel Cron (for 6 AM daily planning, 11:30 PM summaries)
- **Email**: Resend (for notifications in Phase 4)


#### **AI Integration**

- **Atlas**: OpenAI GPT-5.2 API
- **Forge**: DeepSeek-V3.1 API
- **Olive**: Moonshot Kimi K2-0905 API
- **Lexicon**: Moonshot Kimi K2-0905 API
- **Embeddings**: OpenAI text-embedding-3-small (for vector search)


#### **External APIs**

- **Nutrition**: Spoonacular API + Edamam API (fallback for missing data)
- **Books**: Open Library API (primary, free) + Google Books API (fallback)


#### **Deployment**

- **Hosting**: Vercel (optimized for Next.js)
- **Environment Variables**: Vercel Environment Variables (secure API key storage)

***

### **1.7 Database Schema (Supabase PostgreSQL)**

#### **Core Tables**

**1. `users` table**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Personal Info
  age INTEGER,
  gender TEXT,
  height_cm DECIMAL,
  timezone TEXT DEFAULT 'Europe/London',
  
  -- Preferences
  dietary_restrictions TEXT[], -- ['vegetarian', 'gluten-free', ...]
  food_dislikes TEXT[],
  favorite_cuisines TEXT[],
  cooking_skill TEXT, -- 'beginner' | 'intermediate' | 'advanced'
  budget_level TEXT, -- 'tight' | 'moderate' | 'flexible'
  
  -- Fitness
  activity_level TEXT, -- 'sedentary' | 'moderate' | 'active'
  injuries TEXT[],
  medical_conditions TEXT[],
  equipment_available TEXT[], -- ['dumbbells', 'resistance_bands', ...]
  
  -- Reading
  reading_speed_wpm INTEGER,
  favorite_genres TEXT[],
  
  -- Lifestyle
  sleep_schedule JSONB, -- {typical_bedtime: '23:00', wake_time: '07:00'}
  work_schedule TEXT, -- '9-5' | 'flexible' | 'shift'
  stress_level INTEGER, -- 1-10
  
  -- Astrology (optional)
  birth_date DATE,
  birth_time TIME,
  birth_location TEXT
);
```

**2. `goals` table**

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Goal Type
  category TEXT, -- 'fitness' | 'nutrition' | 'reading' | 'lifestyle'
  
  -- Goal Details
  goal_type TEXT, -- 'target' | 'lifestyle' (target = temporary, lifestyle = ongoing)
  description TEXT,
  
  -- Fitness Goals
  target_weight_kg DECIMAL,
  target_measurements JSONB, -- {belly: 88, chest: 102, biceps: 38, ...}
  
  -- Nutrition Goals
  calorie_mode TEXT, -- 'deficit' | 'maintenance' | 'surplus'
  macro_targets JSONB, -- {protein: 150, carbs: 200, fats: 60} in grams
  
  -- Reading Goals
  daily_reading_minutes INTEGER,
  books_per_month INTEGER,
  
  -- Status
  status TEXT, -- 'active' | 'achieved' | 'maintenance'
  achieved_at TIMESTAMP
);
```

**3. `measurements` table**

```sql
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  measured_at TIMESTAMP DEFAULT NOW(),
  
  -- Body Measurements (cm)
  weight_kg DECIMAL,
  belly_cm DECIMAL,
  chest_cm DECIMAL,
  biceps_left_cm DECIMAL,
  biceps_right_cm DECIMAL,
  calves_left_cm DECIMAL,
  calves_right_cm DECIMAL,
  thighs_left_cm DECIMAL,
  thighs_right_cm DECIMAL,
  shoulders_cm DECIMAL,
  neck_cm DECIMAL,
  
  -- Additional Metrics
  body_fat_percentage DECIMAL,
  
  -- Source
  input_method TEXT -- 'manual' | 'ai_extracted' (from conversation)
);
```

**4. `conversations` table**

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Manager
  manager TEXT, -- 'atlas' | 'forge' | 'olive' | 'lexicon'
  
  -- Message
  role TEXT, -- 'user' | 'assistant' | 'system'
  content TEXT,
  
  -- Metadata
  metadata JSONB, -- {sleep_quality: 7, stress_level: 5, ...}
  
  -- Token Usage (for cost tracking)
  tokens_used INTEGER
);
```

**5. `embeddings` table** (for vector search)

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Vector
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  
  -- Content
  content_chunk TEXT,
  
  -- Metadata for filtering
  manager TEXT,
  category TEXT -- 'fitness' | 'nutrition' | 'reading' | 'general'
);

-- Create vector similarity search index
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```


***

**End of Part 1**


# **Super Mentor - Part 2: Database Schema (Continued), Features, and User Flows**


***

### **1.8 Database Schema (Continued)**

#### **Meal Planning \& Nutrition Tables**

**6. `meal_plans` table**

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Time Period
  start_date DATE,
  end_date DATE, -- 3-day periods
  
  -- Status
  status TEXT, -- 'proposed' | 'committed' | 'completed'
  committed_at TIMESTAMP,
  
  -- Generated by Olive
  generation_context JSONB, -- {workout_intensity: 'high', goal: 'fat_loss', ...}
  
  -- Notes
  user_feedback TEXT
);
```

**7. `meals` table**

```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Meal Details
  meal_type TEXT, -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Recipe
  name TEXT,
  description TEXT,
  ingredients JSONB, -- [{name: 'chicken breast', quantity: 250, unit: 'g'}, ...]
  preparation_steps TEXT[],
  prep_time_minutes INTEGER,
  
  -- Nutrition (from API or AI estimate)
  calories DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fats_g DECIMAL,
  fiber_g DECIMAL,
  
  -- Micronutrients (detailed tracking)
  vitamin_a_mcg DECIMAL,
  vitamin_b12_mcg DECIMAL,
  vitamin_c_mg DECIMAL,
  vitamin_d_mcg DECIMAL,
  vitamin_e_mg DECIMAL,
  vitamin_k_mcg DECIMAL,
  iron_mg DECIMAL,
  calcium_mg DECIMAL,
  magnesium_mg DECIMAL,
  omega3_g DECIMAL,
  
  -- Organ Health Tags
  health_benefits TEXT[], -- ['heart_health', 'liver_support', 'anti_inflammatory', ...]
  
  -- Tracking
  logged_at TIMESTAMP, -- when user confirms they ate it
  actually_eaten BOOLEAN DEFAULT FALSE,
  user_rating INTEGER, -- 1-5 stars
  would_eat_again BOOLEAN,
  
  -- Swapping
  original_meal_id UUID REFERENCES meals(id), -- if this meal is a swap replacement
  swap_count INTEGER DEFAULT 0
);
```

**8. `shopping_lists` table**

```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Shopping Details
  shopping_date DATE,
  total_estimated_cost DECIMAL,
  
  -- Items (aggregated from all meals in the 3-day period)
  items JSONB, -- [{name: 'chicken breast', quantity: 750, unit: 'g', category: 'meat', estimated_cost: 8.50}, ...]
  
  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP
);
```

**9. `nutrition_tracking` table** (daily aggregates)

```sql
CREATE TABLE nutrition_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE,
  
  -- Daily Totals (actual consumed)
  total_calories DECIMAL,
  total_protein_g DECIMAL,
  total_carbs_g DECIMAL,
  total_fats_g DECIMAL,
  total_fiber_g DECIMAL,
  
  -- Micronutrients Daily Totals
  total_vitamin_a_mcg DECIMAL,
  total_vitamin_b12_mcg DECIMAL,
  total_vitamin_c_mg DECIMAL,
  total_vitamin_d_mcg DECIMAL,
  total_vitamin_e_mg DECIMAL,
  total_vitamin_k_mcg DECIMAL,
  total_iron_mg DECIMAL,
  total_calcium_mg DECIMAL,
  total_magnesium_mg DECIMAL,
  total_omega3_g DECIMAL,
  
  -- Compared to Targets
  calorie_target DECIMAL,
  protein_target_g DECIMAL,
  carbs_target_g DECIMAL,
  fats_target_g DECIMAL,
  
  -- Deficiency Flags (Olive monitors these)
  deficiencies TEXT[], -- ['vitamin_d', 'omega3', ...]
  
  -- Daily Score (Olive's assessment)
  nutrition_score INTEGER, -- 1-100
  olive_feedback TEXT
);
```


***

#### **Workout \& Fitness Tables**

**10. `workout_plans` table**

```sql
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Workout Details
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Type & Focus
  workout_type TEXT, -- 'strength' | 'cardio' | 'hiit' | 'yoga' | 'active_recovery' | 'rest'
  focus_areas TEXT[], -- ['legs', 'chest', 'back', ...]
  
  -- Generated by Forge
  generation_context JSONB, -- {food_eaten: {...}, sleep_quality: 7, stress: 5, ...}
  
  -- Workout Structure
  exercises JSONB, -- [{name: 'squats', sets: 3, reps: 12, weight_kg: 80, rest_seconds: 90}, ...]
  total_duration_minutes INTEGER,
  intensity TEXT, -- 'low' | 'moderate' | 'high'
  
  -- Tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  user_feedback TEXT, -- "felt great" | "too hard" | "knee pain"
  
  -- Atlas Approval
  approved_by_atlas BOOLEAN DEFAULT FALSE,
  atlas_modifications TEXT -- if Atlas changed Forge's suggestion
);
```

**11. `workout_logs` table**

```sql
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID REFERENCES workout_plans(id),
  user_id UUID REFERENCES users(id),
  logged_at TIMESTAMP DEFAULT NOW(),
  
  -- Exercise Details
  exercise_name TEXT,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used_kg DECIMAL,
  
  -- Performance Notes
  difficulty TEXT, -- 'easy' | 'moderate' | 'hard'
  form_quality TEXT, -- 'good' | 'needs_work'
  notes TEXT
);
```

**12. `muscle_balance_tracking` table**

```sql
CREATE TABLE muscle_balance_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  -- Forge's Assessment of Muscle Development Balance
  muscle_groups JSONB, -- {chest: {current: 95, ideal: 102, progress: 75}, biceps: {current: 36, ideal: 38, progress: 85}, ...}
  
  -- Overall Balance Score
  balance_score INTEGER, -- 1-100 (100 = perfectly balanced development)
  
  -- Recommendations
  priority_areas TEXT[], -- ['legs', 'calves'] - areas needing more focus
  forge_notes TEXT
);
```


***

#### **Reading \& Knowledge Tables**

**13. `books` table**

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW(),
  
  -- Book Info (from APIs or manual entry)
  title TEXT,
  author TEXT,
  isbn TEXT,
  total_pages INTEGER,
  genre TEXT,
  topic TEXT, -- 'philosophy' | 'psychology' | 'self-improvement' | ...
  
  -- Format
  format TEXT, -- 'physical' | 'ebook' | 'audiobook'
  audiobook_duration_minutes INTEGER,
  
  -- Status
  status TEXT, -- 'backlog' | 'reading' | 'completed' | 'paused'
  priority INTEGER, -- Lexicon's suggested priority (1 = highest)
  
  -- Progress
  current_page INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- External IDs
  open_library_id TEXT,
  google_books_id TEXT
);
```

**14. `reading_sessions` table**

```sql
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id),
  user_id UUID REFERENCES users(id),
  
  -- Session Details
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  
  -- Progress
  pages_read INTEGER,
  start_page INTEGER,
  end_page INTEGER,
  
  -- Context
  scheduled_time TIME, -- when Lexicon scheduled this session
  was_scheduled BOOLEAN DEFAULT TRUE,
  
  -- User Input
  user_notes TEXT,
  difficulty TEXT, -- 'easy' | 'moderate' | 'challenging'
  enjoyment INTEGER -- 1-5 stars
);
```

**15. `reading_notes` table**

```sql
CREATE TABLE reading_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Note Details
  page_number INTEGER,
  chapter TEXT,
  
  -- Content
  note_type TEXT, -- 'highlight' | 'reflection' | 'question' | 'insight'
  content TEXT,
  
  -- Discussion with Lexicon
  discussed_with_lexicon BOOLEAN DEFAULT FALSE,
  lexicon_response TEXT
);
```

**16. `reading_goals` table**

```sql
CREATE TABLE reading_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Goal Type
  goal_type TEXT, -- 'daily_pages' | 'daily_minutes' | 'books_per_month' | 'complete_backlog'
  
  -- Target
  target_value INTEGER,
  
  -- Progress
  current_streak INTEGER DEFAULT 0, -- consecutive days with reading
  longest_streak INTEGER DEFAULT 0,
  
  -- Status
  status TEXT -- 'active' | 'achieved'
);
```


***

#### **Schedule \& Calendar Tables**

**17. `user_schedules` table**

```sql
CREATE TABLE user_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Time Period (schedules are set for 2-week blocks)
  start_date DATE,
  end_date DATE,
  
  -- Schedule Type
  schedule_type TEXT, -- 'work' | 'personal' | 'recurring'
  
  -- Days of Week (for recurring events)
  days_of_week INTEGER[], -- [1,2,3,4,5] = Monday-Friday
  
  -- Event Details
  event_type TEXT, -- 'work' | 'meeting' | 'workout' | 'meal' | 'reading' | 'sleep' | 'free_time'
  start_time TIME,
  end_time TIME,
  
  -- Specific Date (for one-time events)
  specific_date DATE,
  
  -- Description
  title TEXT,
  description TEXT,
  
  -- Flexibility
  is_flexible BOOLEAN DEFAULT FALSE, -- can managers reschedule around this?
  priority INTEGER -- 1-10 (10 = cannot be moved, 1 = easily rescheduled)
);
```

**18. `daily_plans` table** (generated by Atlas at 6 AM)

```sql
CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Date
  plan_date DATE,
  
  -- Generated Plan
  workout_plan_id UUID REFERENCES workout_plans(id),
  meal_plan_id UUID REFERENCES meal_plans(id),
  reading_goal_id UUID REFERENCES reading_sessions(id),
  
  -- Atlas's Daily Summary (morning)
  atlas_morning_message TEXT,
  
  -- Manager Coordination Log
  coordination_log JSONB, -- {forge_suggestion: "...", atlas_response: "...", olive_input: "...", ...}
  
  -- Status
  plan_status TEXT, -- 'generated' | 'in_progress' | 'completed' | 'partially_completed'
  
  -- End of Day Summary (11:30 PM)
  atlas_evening_summary TEXT,
  completion_score INTEGER, -- 1-100
  generated_evening_summary_at TIMESTAMP
);
```


***

#### **AI Summaries \& Reports Tables**

**19. `ai_summaries` table**

```sql
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Summary Type
  summary_type TEXT, -- 'daily' | 'weekly' | 'monthly'
  
  -- Time Period
  start_date DATE,
  end_date DATE,
  
  -- Summary Content (generated by Atlas)
  summary_text TEXT,
  
  -- Key Metrics
  metrics JSONB, -- {workouts_completed: 5, meals_logged: 18, books_read: 1.5, ...}
  
  -- Insights
  achievements TEXT[],
  areas_for_improvement TEXT[],
  atlas_recommendations TEXT
);
```

**20. `manager_conversations` table** (manager-to-manager communication logs)

```sql
CREATE TABLE manager_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Participants
  initiator TEXT, -- 'atlas' | 'forge' | 'olive' | 'lexicon'
  recipient TEXT,
  
  -- Context
  conversation_context TEXT, -- 'daily_planning' | 'goal_adjustment' | 'conflict_resolution'
  
  -- Message
  message TEXT,
  response TEXT,
  
  -- Visibility
  visible_to_user BOOLEAN DEFAULT FALSE -- user can expand to see these
);
```


***

### **1.9 Phase-by-Phase Feature Specifications**


***

## **PHASE 1: MVP (Minimum Viable Product)**

**Goal**: Build a functional 4-manager chat system with basic memory, profile management, and daily planning.

### **Phase 1 Features**

#### **1.1 Onboarding Wizard**

**Component**: `/components/onboarding/OnboardingWizard.tsx`

**Flow**:

1. **Welcome Screen**
    - Introduction to Super Mentor and the 4 managers
    - "Let's set up your holistic life coach"
2. **Step 1: Personal Information**
    - Age, gender, height (cm), weight (kg)
    - Current location/timezone
    - Sleep schedule (typical bedtime, wake time)
    - Work schedule type (9-5, flexible, shift work)
    - Current stress level (1-10 slider)
3. **Step 2: Health \& Body**
    - Current measurements:
        - Belly, chest, biceps (left/right), calves (left/right), thighs (left/right), shoulders, neck
    - Injuries or physical limitations (free text + checkboxes)
    - Medical conditions (diabetes, heart conditions, etc.)
    - Activity level (sedentary / moderate / active)
4. **Step 3: Fitness Goals**
    - Primary fitness goals (checkboxes):
        - Lose belly fat
        - Build muscle
        - Increase strength/power
        - Improve endurance
        - General health
    - Target measurements (optional):
        - Target weight, belly size, etc.
    - Ideal body description (free text)
    - Available equipment (gym membership, home equipment, bodyweight only)
    - Exercise preferences (types of workouts you enjoy)
5. **Step 4: Nutrition Profile**
    - Dietary preferences (omnivore, vegetarian, vegan, pescatarian)
    - Allergies \& intolerances (free text)
    - Foods you dislike/never want suggested (multi-select + custom input)
    - Favorite cuisines (Italian, Asian, Mediterranean, etc.)
    - Cooking skill level (beginner / intermediate / advanced)
    - Shopping frequency ("I shop every ___ days")
    - Budget level (tight / moderate / flexible)
6. **Step 5: Reading \& Learning**
    - Reading goals:
        - Daily reading time target (minutes)
        - Books per month goal
    - Current reading speed (WPM) - optional, can be calculated later
    - Favorite genres/topics (philosophy, psychology, self-help, fiction, etc.)
    - Current backlog:
        - Add books manually (title, author) or import from list
        - Add audiobooks separately
7. **Step 6: Schedule (2-Week Block)**
    - Visual calendar builder
    - User inputs recurring events:
        - Work hours (Monday-Friday 9 AM - 5 PM)
        - Fixed commitments (meetings, appointments)
        - Preferred workout times (morning / afternoon / evening)
        - Preferred meal times (breakfast, lunch, dinner, snacks)
        - Preferred reading time (evening, before bed)
    - System calculates available free time windows
8. **Step 7: Goals Summary \& Commitment**
    - Display all entered information
    - Ask for motivation: "Why are these goals important to you?"
    - Confirmation: "I'm committed to this lifestyle transformation"

**Data Saved**: Inserts into `users`, `goals`, `measurements`, `user_schedules`, `books` tables

***

#### **1.2 Chat Interface (4-Manager System)**

**Component**: `/components/chat/ChatInterface.tsx`

**Layout**:

**Desktop View**:

```
┌─────────────────────────────────────────────────┐
│  SUPER MENTOR                      [Profile] [⚙️] │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  Atlas    │  [Chat Messages Area]               │
│  ●        │                                     │
│           │  User: "Good morning!"              │
│  Forge    │  Atlas: "Good morning! Here's       │
│  ○        │  today's plan..."                   │
│           │                                     │
│  Olive    │  [View Planning Conversation ▼]     │
│  ○        │                                     │
│           │  ┌─────────────────────────────┐   │
│  Lexicon  │  │ Forge suggested HIIT...     │   │
│  ○        │  │ Atlas adjusted to yoga...   │   │
│           │  └─────────────────────────────┘   │
│           │                                     │
│           │  [Message Input Box]                │
│           │  Type your message...        [Send] │
└───────────┴─────────────────────────────────────┘
```

**Features**:

- **Manager Selector** (left sidebar):
    - Click manager name to switch conversation
    - Active manager highlighted (●)
    - Atlas is default/primary
- **Chat Area**:
    - Conversation history with active manager
    - Messages display: user (right), assistant (left)
    - Timestamps
    - "View Planning Conversation" expandable sections (when Atlas shows coordination)
- **Message Input**:
    - Text area with auto-resize
    - Send button + Enter key support
    - Loading state while AI responds

**Real-Time Features**:

- Streaming responses (token-by-token display)
- Typing indicators ("Atlas is thinking...")
- Message persistence (auto-saves to Supabase)

***

#### **1.3 Profile \& Measurements Dashboard**

**Component**: `/components/profile/ProfileDashboard.tsx`

**Sections**:

**1. User Info Card**

- Display: Age, gender, height, current weight
- Edit button → opens modal to update info

**2. Current Measurements Card**

- Table showing latest measurements:
    - Weight, belly, chest, biceps, calves, thighs, shoulders, neck
    - Date of last measurement
    - Change from previous measurement (+2cm, -3kg, etc.)
- "Log New Measurements" button → opens form

**3. Goals Overview Card**

- Active goals (fitness, nutrition, reading)
- Progress bars (e.g., "Belly: 95cm → 88cm goal | 60% complete")
- Status badges (In Progress / Achieved / Maintenance)

**4. Schedule Card**

- Display current 2-week schedule block
- Shows recurring events, workout times, meal times, reading times
- "Update Schedule" button

**Measurement Logging Form**:

```tsx
<form>
  <DatePicker label="Measurement Date" />
  <Input label="Weight (kg)" type="number" step="0.1" />
  <Input label="Belly (cm)" type="number" step="0.1" />
  <Input label="Chest (cm)" type="number" step="0.1" />
  // ... all measurements
  <Button>Save Measurements</Button>
</form>
```


***

#### **1.4 Daily Dashboard (Morning View)**

**Component**: `/components/dashboard/DailyDashboard.tsx`

**Purpose**: Display the daily plan generated by Atlas at 6 AM

**Layout**:

```
┌─────────────────────────────────────────────────┐
│  Today's Plan - Thursday, January 8, 2026       │
├─────────────────────────────────────────────────┤
│                                                 │
│  🏋️ WORKOUT (Forge)                             │
│  ┌───────────────────────────────────────────┐ │
│  │ 7:00 AM - Yoga & Stretching               │ │
│  │ Duration: 20 minutes                      │ │
│  │ Intensity: Low                            │ │
│  │                                           │ │
│  │ Exercises:                                │ │
│  │ • Sun Salutations (5 rounds)              │ │
│  │ • Child's Pose (2 min)                    │ │
│  │ • Cat-Cow Stretch (2 min)                 │ │
│  │                                           │ │
│  │ [View Full Plan] [Mark Complete]          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🍽️ MEALS (Olive)                               │
│  ┌───────────────────────────────────────────┐ │
│  │ 8:00 AM - Breakfast                       │ │
│  │ Greek yogurt, berries, almonds, honey     │ │
│  │ 420 cal | 25g protein | 45g carbs         │ │
│  │ [Log as Eaten] [Swap Meal]                │ │
│  │                                           │ │
│  │ 11:00 AM - Snack                          │ │
│  │ Apple with peanut butter                  │ │
│  │ [Log as Eaten] [Swap Meal]                │ │
│  │                                           │ │
│  │ ... (lunch, dinner, snacks)               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📚 READING (Lexicon)                           │
│  ┌───────────────────────────────────────────┐ │
│  │ 8:00 PM - 25 minutes                      │ │
│  │ Continue "Atomic Habits" (page 44)        │ │
│  │ [Start Session] [Mark Complete]           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  💬 Atlas's Message                             │
│  ┌───────────────────────────────────────────┐ │
│  │ "Good morning! I've adjusted today's      │ │
│  │  workout based on your sleep report..."   │ │
│  │                                           │ │
│  │ [View Planning Conversation]              │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Interactive Elements**:

- Click "[Mark Complete]" on workout → logs to `workout_logs`
- Click "[Log as Eaten]" on meal → logs to `meals` table
- Click "[Swap Meal]" → triggers conversation with Olive ("Show me 3 alternative breakfasts with same macros")

***

#### **1.5 Conversation Storage \& Retrieval**

**Backend**: `/lib/ai/conversation-manager.ts`

**Functions**:

```typescript
// Save message to database
async function saveMessage({
  userId: string,
  manager: 'atlas' | 'forge' | 'olive' | 'lexicon',
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, any>,
  tokensUsed?: number
}): Promise<void>

// Retrieve conversation history
async function getConversationHistory({
  userId: string,
  manager: string,
  limit?: number, // default 50
  before?: Date // for pagination
}): Promise<Message[]>

// Get recent context (for AI prompt)
async function getRecentContext({
  userId: string,
  manager: string,
  messageCount: number // e.g., last 10 messages
}): Promise<Message[]>

// Cross-manager data query
async function queryCrossDomainData({
  userId: string,
  query: string // e.g., "What did user eat in last 24 hours?"
}): Promise<any>
```


***

#### **1.6 Basic Cross-Manager Data Awareness**

**Implementation**:

When Forge generates a workout, he queries:

```typescript
const recentMeals = await supabase
  .from('meals')
  .select('*')
  .eq('user_id', userId)
  .gte('scheduled_date', yesterdayDate)
  .eq('actually_eaten', true);

const recentWorkouts = await supabase
  .from('workout_plans')
  .select('*')
  .eq('user_id', userId)
  .gte('scheduled_date', threeDaysAgo)
  .eq('completed', true);

// Include in Forge's AI prompt context
const context = `
User recently ate:
- ${recentMeals.map(m => m.name).join('\n- ')}

Total protein consumed yesterday: ${totalProtein}g

Recent workouts:
- ${recentWorkouts.map(w => w.workout_type).join('\n- ')}

Based on this, suggest today's workout...
`;
```

Similar queries for Olive (check Forge's workout plans), Lexicon (check user's schedule for reading windows).

***

#### **1.7 Daily Planning System (6 AM Cron Job)**

**Backend**: `/app/api/cron/daily-planning/route.ts`

**Vercel Cron Configuration** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-planning",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Planning Algorithm**:

```typescript
export async function POST(request: Request) {
  // Security: Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all active users
  const { data: users } = await supabase.from('users').select('*');

  for (const user of users) {
    // 1. Query user's schedule for today
    const todaySchedule = await getUserScheduleForDate(user.id, new Date());

    // 2. Check sleep quality (if user reported last night)
    const sleepData = await getLastSleepReport(user.id);

    // 3. Consult Forge for workout
    const forgeWorkout = await generateForgeWorkout({
      userId: user.id,
      schedule: todaySchedule,
      sleepQuality: sleepData?.quality,
      recentMeals: await getRecentMeals(user.id),
      recentWorkouts: await getRecentWorkouts(user.id)
    });

    // 4. Atlas reviews Forge's suggestion
    const atlasReview = await atlasReviewWorkout({
      userId: user.id,
      forgeWorkout,
      sleepQuality: sleepData?.quality,
      stressLevel: await getCurrentStressLevel(user.id)
    });

    let finalWorkout = forgeWorkout;
    if (atlasReview.rejected) {
      // Atlas requests modification
      finalWorkout = await generateForgeWorkout({
        ...previousContext,
        atlasConstraints: atlasReview.modifications
      });
    }

    // 5. Consult Olive for meals
    const oliveMeals = await generateOliveMealPlan({
      userId: user.id,
      workout: finalWorkout,
      schedule: todaySchedule,
      recentMeals: await getRecentMeals(user.id, 7), // last 7 days
      nutritionGoals: await getUserNutritionGoals(user.id)
    });

    // 6. Consult Lexicon for reading
    const lexiconReading = await generateLexiconSession({
      userId: user.id,
      schedule: todaySchedule,
      currentBook: await getCurrentBook(user.id),
      readingGoals: await getUserReadingGoals(user.id)
    });

    // 7. Atlas compiles final plan
    const dailyPlan = await createDailyPlan({
      userId: user.id,
      workout: finalWorkout,
      meals: oliveMeals,
      reading: lexiconReading,
      atlasMessage: await generateAtlasMorningMessage({
        workout: finalWorkout,
        meals: oliveMeals,
        reading: lexiconReading,
        coordinationLog: atlasReview
      })
    });

    // 8. Save to daily_plans table
    await supabase.from('daily_plans').insert(dailyPlan);
  }

  return new Response('Daily planning completed', { status: 200 });
}
```


***

**End of Part 2**

***



# **Super Mentor - Part 3: Phases 2-6, Component Architecture, and AI Implementation**


***

## **PHASE 2: Enhanced Interactions \& Memory**

**Goal**: Add semantic search, proactive manager check-ins, meal planning workflows, and book tracking.

### **Phase 2 Features**

#### **2.1 Vector Embeddings for Semantic Memory Search**

**Purpose**: Allow managers to search conversation history semantically ("When did user mention knee pain?")

**Implementation**: `/lib/ai/embeddings.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embedding for a message
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[^12_0].embedding;
}

// Save message with embedding
export async function saveMessageWithEmbedding({
  userId,
  manager,
  role,
  content,
  metadata
}: SaveMessageParams) {
  // 1. Save to conversations table
  const { data: message } = await supabase
    .from('conversations')
    .insert({ userId, manager, role, content, metadata })
    .select()
    .single();

  // 2. Generate embedding
  const embedding = await generateEmbedding(content);

  // 3. Save to embeddings table
  await supabase.from('embeddings').insert({
    conversation_id: message.id,
    user_id: userId,
    embedding,
    content_chunk: content,
    manager,
    category: determineCategory(content) // 'fitness' | 'nutrition' | 'reading' | 'general'
  });
}

// Semantic search
export async function semanticSearch({
  userId,
  query,
  manager?: string,
  category?: string,
  limit = 5
}: SemanticSearchParams): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Vector similarity search
  const { data } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    filter_user_id: userId,
    filter_manager: manager,
    filter_category: category
  });

  return data;
}

// Supabase SQL function for vector search
// Run this in Supabase SQL editor:
/*
CREATE FUNCTION match_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_manager text DEFAULT NULL,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_chunk text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE embeddings.user_id = filter_user_id
    AND (filter_manager IS NULL OR embeddings.manager = filter_manager)
    AND (filter_category IS NULL OR embeddings.category = filter_category)
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
*/
```

**Usage Example**:

```typescript
// Forge checking for past injuries
const injuryMentions = await semanticSearch({
  userId,
  query: "knee pain injury soreness",
  manager: 'forge',
  category: 'fitness'
});

// Include in Forge's context
const context = `
User has previously mentioned:
${injuryMentions.map(m => m.content_chunk).join('\n')}
`;
```


***

#### **2.2 Proactive Manager Check-ins**

**Component**: `/lib/ai/proactive-checks.ts`

**Cron Job**: Runs every 30 minutes to check if users need reminders

**Vercel Cron** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/proactive-checks",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Check Logic**: `/app/api/cron/proactive-checks/route.ts`

```typescript
export async function POST(request: Request) {
  const now = new Date();
  const users = await getAllActiveUsers();

  for (const user of users) {
    const userTimezone = user.timezone || 'Europe/London';
    const userLocalTime = convertToTimezone(now, userTimezone);

    // Get today's daily plan
    const dailyPlan = await getDailyPlan(user.id, userLocalTime);
    if (!dailyPlan) continue;

    // CHECK 1: Olive - Breakfast not logged 2 hours after scheduled time
    const breakfastMeal = await getTodaysMeal(user.id, 'breakfast');
    if (breakfastMeal && !breakfastMeal.logged_at) {
      const scheduledTime = parseTime(breakfastMeal.scheduled_time);
      const twoHoursLater = addHours(scheduledTime, 2);
      
      if (isAfter(userLocalTime, twoHoursLater)) {
        // Send proactive message from Olive
        await sendProactiveMessage({
          userId: user.id,
          manager: 'olive',
          message: `Hey! I noticed you haven't logged breakfast yet. Did you eat the ${breakfastMeal.name} I suggested, or did you have something else? Let me know so I can track your nutrition accurately! 🍳`
        });
        
        // Mark as reminded (don't spam)
        await markMealReminded(breakfastMeal.id);
      }
    }

    // CHECK 2: Forge - Workout not completed 30 min after scheduled time
    const todaysWorkout = await getTodaysWorkout(user.id);
    if (todaysWorkout && !todaysWorkout.completed) {
      const scheduledTime = parseTime(todaysWorkout.scheduled_time);
      const thirtyMinLater = addMinutes(scheduledTime, 30);
      
      if (isAfter(userLocalTime, thirtyMinLater)) {
        await sendProactiveMessage({
          userId: user.id,
          manager: 'forge',
          message: `Hey champ! Your ${todaysWorkout.workout_type} was scheduled for ${formatTime(scheduledTime)}. Everything okay? Need to adjust today's plan? 💪`
        });
        
        await markWorkoutReminded(todaysWorkout.id);
      }
    }

    // CHECK 3: Lexicon - Reading session not started at scheduled time
    const todaysReading = await getTodaysReadingSession(user.id);
    if (todaysReading && !todaysReading.started_at) {
      const scheduledTime = parseTime(todaysReading.scheduled_time);
      
      if (isAfter(userLocalTime, scheduledTime)) {
        await sendProactiveMessage({
          userId: user.id,
          manager: 'lexicon',
          message: `Good evening! Your reading session for "${todaysReading.book.title}" was scheduled for now. Ready to dive in? Even 10 minutes counts! 📖`
        });
        
        await markReadingReminded(todaysReading.id);
      }
    }

    // CHECK 4: Atlas - Daily summary at 11:30 PM
    if (userLocalTime.getHours() === 23 && userLocalTime.getMinutes() >= 25) {
      if (!dailyPlan.atlas_evening_summary) {
        await generateAndSaveDailySummary(user.id, dailyPlan);
      }
    }
  }

  return new Response('Proactive checks completed', { status: 200 });
}

async function sendProactiveMessage({ userId, manager, message }) {
  // Save as assistant message
  await saveMessage({
    userId,
    manager,
    role: 'assistant',
    content: message,
    metadata: { proactive: true, timestamp: new Date() }
  });

  // In Phase 4, this will also trigger email/push notification
}
```


***

#### **2.3 Meal Planning with Swapping**

**Component**: `/components/nutrition/MealPlanningInterface.tsx`

**User Flow**:

1. Olive generates 3-day meal plan (part of daily planning at 6 AM)
2. User reviews meals in dashboard
3. User clicks "Swap Meal" on any meal
4. Opens chat with Olive: "Show me 3 alternative lunches for tomorrow with similar macros"
5. Olive generates 3 options
6. User selects preferred option
7. Meal plan updates

**Implementation**:

```typescript
// When user clicks "Swap Meal"
function handleSwapMeal(meal: Meal) {
  // Open chat with Olive
  switchToManager('olive');
  
  // Send automated message
  sendMessage({
    manager: 'olive',
    content: `I'd like to swap ${meal.meal_type} on ${meal.scheduled_date}. Can you show me 3 alternative options with similar macros (${meal.calories} cal, ${meal.protein_g}g protein)?`
  });
}

// Olive's AI handles the request
async function handleMealSwapRequest(userId: string, mealId: string) {
  const originalMeal = await getMeal(mealId);
  
  // Query food APIs for similar recipes
  const alternatives = await findSimilarMeals({
    calorieRange: [originalMeal.calories - 50, originalMeal.calories + 50],
    proteinRange: [originalMeal.protein_g - 5, originalMeal.protein_g + 5],
    excludeIngredients: user.food_dislikes,
    dietaryRestrictions: user.dietary_restrictions,
    cuisinePreferences: user.favorite_cuisines
  });

  // Olive responds with formatted options
  return formatMealOptions(alternatives);
}

// User selects option
async function commitMealSwap(originalMealId: string, newMealId: string) {
  await supabase.from('meals').update({
    original_meal_id: originalMealId,
    swap_count: increment(1)
  }).eq('id', newMealId);
  
  // Delete or archive original meal
  await supabase.from('meals').update({ status: 'replaced' }).eq('id', originalMealId);
}
```

**Olive's Meal Generation Prompt**:

```typescript
const oliveMealPrompt = `
You are Olive, the nutrition and health manager for ${user.name}.

CONTEXT:
- User's recent meals (last 7 days): ${recentMeals}
- User's food dislikes: ${user.food_dislikes}
- Dietary restrictions: ${user.dietary_restrictions}
- Today's workout: ${todaysWorkout.workout_type} (${todaysWorkout.intensity} intensity)
- Nutrition goals: ${nutritionGoals}
- Shopping frequency: Every ${user.shopping_frequency} days

TASK:
Generate a 3-day meal plan (Day 1: ${day1Date}, Day 2: ${day2Date}, Day 3: ${day3Date})

For each day, provide:
- Breakfast, Lunch, Dinner, 2 Snacks
- Exact times based on user's schedule
- Recipe with ingredients (exact quantities)
- Macros: calories, protein, carbs, fats, fiber
- Micronutrients: vitamins A, B12, C, D, E, K, iron, calcium, magnesium, omega-3
- Health benefits (organ-specific: heart, liver, gut, brain)

GUIDELINES:
- Variety: Don't repeat meals from last 7 days
- Recovery: After ${todaysWorkout.workout_type}, prioritize protein and anti-inflammatory foods
- Deficiencies: User needs more ${deficiencies.join(', ')} - include foods rich in these
- Preferences: Focus on ${user.favorite_cuisines} cuisines
- Skill level: ${user.cooking_skill} - adjust recipe complexity accordingly

OUTPUT FORMAT (JSON):
{
  "meals": [
    {
      "meal_type": "breakfast",
      "scheduled_date": "2026-01-09",
      "scheduled_time": "08:00",
      "name": "Greek Yogurt Power Bowl",
      "description": "Creamy yogurt with fresh berries, almonds, and honey",
      "ingredients": [
        {"name": "Greek yogurt", "quantity": 200, "unit": "g"},
        {"name": "blueberries", "quantity": 50, "unit": "g"},
        ...
      ],
      "preparation_steps": ["Step 1...", "Step 2..."],
      "prep_time_minutes": 5,
      "calories": 420,
      "protein_g": 25,
      "carbs_g": 45,
      "fats_g": 15,
      "fiber_g": 6,
      "vitamin_a_mcg": 150,
      ...
      "health_benefits": ["heart_health", "gut_health", "anti_inflammatory"]
    },
    ...
  ]
}
`;
```


***

#### **2.4 Shopping List Generation**

**Component**: `/components/nutrition/ShoppingList.tsx`

**Trigger**: After user commits to 3-day meal plan

**Implementation**: `/lib/nutrition/shopping-list.ts`

```typescript
export async function generateShoppingList(mealPlanId: string, userId: string) {
  // 1. Get all meals in the 3-day period
  const meals = await supabase
    .from('meals')
    .select('*')
    .eq('meal_plan_id', mealPlanId)
    .eq('user_id', userId);

  // 2. Aggregate ingredients
  const ingredientMap = new Map<string, {
    name: string;
    totalQuantity: number;
    unit: string;
    category: string;
    estimatedCost: number;
  }>();

  for (const meal of meals.data) {
    for (const ingredient of meal.ingredients) {
      const key = ingredient.name.toLowerCase();
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key);
        existing.totalQuantity += ingredient.quantity;
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          totalQuantity: ingredient.quantity,
          unit: ingredient.unit,
          category: categorizeIngredient(ingredient.name), // 'produce', 'meat', 'dairy', etc.
          estimatedCost: await estimateCost(ingredient.name, ingredient.quantity, ingredient.unit)
        });
      }
    }
  }

  // 3. Group by category for easier shopping
  const groupedIngredients = Array.from(ingredientMap.values()).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof item[]>);

  // 4. Calculate total cost
  const totalCost = Array.from(ingredientMap.values())
    .reduce((sum, item) => sum + item.estimatedCost, 0);

  // 5. Save to shopping_lists table
  const { data: shoppingList } = await supabase
    .from('shopping_lists')
    .insert({
      meal_plan_id: mealPlanId,
      user_id: userId,
      shopping_date: meals.data[^12_0].scheduled_date,
      items: groupedIngredients,
      total_estimated_cost: totalCost
    })
    .select()
    .single();

  return shoppingList;
}

// Categorize ingredient
function categorizeIngredient(name: string): string {
  const categories = {
    produce: ['apple', 'banana', 'broccoli', 'spinach', 'tomato', 'lettuce', ...],
    meat: ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'tuna', ...],
    dairy: ['milk', 'yogurt', 'cheese', 'butter', ...],
    grains: ['rice', 'quinoa', 'oats', 'bread', 'pasta', ...],
    pantry: ['olive oil', 'salt', 'pepper', 'honey', ...],
  };
  
  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => name.toLowerCase().includes(item))) {
      return category;
    }
  }
  
  return 'other';
}
```

**Shopping List UI**:

```tsx
<div className="shopping-list">
  <h2>Shopping List for Jan 9-11</h2>
  <p>Total Estimated Cost: £{totalCost.toFixed(2)}</p>
  
  {Object.entries(groupedIngredients).map(([category, items]) => (
    <div key={category} className="category-section">
      <h3>{category.toUpperCase()}</h3>
      <ul>
        {items.map(item => (
          <li key={item.name}>
            <input type="checkbox" />
            {item.totalQuantity}{item.unit} {item.name} (£{item.estimatedCost.toFixed(2)})
          </li>
        ))}
      </ul>
    </div>
  ))}
  
  <button onClick={handleExport}>Export to PDF</button>
  <button onClick={handlePrint}>Print</button>
</div>
```


***

#### **2.5 Workout Logging with Checkboxes**

**Component**: `/components/fitness/WorkoutLogger.tsx`

**UI**:

```tsx
<div className="workout-logger">
  <h2>Today's Workout: {workout.workout_type}</h2>
  
  <div className="exercises-list">
    {workout.exercises.map((exercise, index) => (
      <div key={index} className="exercise-item">
        <input 
          type="checkbox" 
          checked={exercise.completed}
          onChange={() => toggleExerciseComplete(exercise.id)}
        />
        <div className="exercise-details">
          <h4>{exercise.name}</h4>
          <p>{exercise.sets} sets × {exercise.reps} reps</p>
          {exercise.weight_kg && <p>Weight: {exercise.weight_kg}kg</p>}
          {exercise.rest_seconds && <p>Rest: {exercise.rest_seconds}s</p>}
        </div>
      </div>
    ))}
  </div>
  
  <div className="workout-feedback">
    <label>How did it feel?</label>
    <textarea 
      placeholder="e.g., 'Great! Felt strong.' or 'Too hard, knee hurt on squats'"
      onChange={(e) => setFeedback(e.target.value)}
    />
  </div>
  
  <button onClick={handleCompleteWorkout}>Mark Workout Complete</button>
</div>
```

**Backend Logic**:

```typescript
async function completeWorkout(workoutId: string, feedback: string) {
  // 1. Update workout as completed
  await supabase
    .from('workout_plans')
    .update({
      completed: true,
      completed_at: new Date(),
      user_feedback: feedback
    })
    .eq('id', workoutId);

  // 2. Log individual exercises
  const exercises = await getWorkoutExercises(workoutId);
  for (const exercise of exercises) {
    if (exercise.completed) {
      await supabase.from('workout_logs').insert({
        workout_plan_id: workoutId,
        user_id: userId,
        exercise_name: exercise.name,
        sets_completed: exercise.sets,
        reps_completed: exercise.reps,
        weight_used_kg: exercise.weight_kg,
        notes: feedback
      });
    }
  }

  // 3. Notify Forge for adaptive planning
  await saveMessage({
    userId,
    manager: 'forge',
    role: 'system',
    content: `Workout completed: ${workout.workout_type}. User feedback: ${feedback}`
  });
}
```


***

#### **2.6 Book Tracking \& Reading Sessions**

**Component**: `/components/reading/BookTracker.tsx`

**Features**:

- Display current book being read
- Log reading sessions (start/end time, pages read)
- Add notes during reading
- Track progress (pages completed / total pages)

**UI**:

```tsx
<div className="book-tracker">
  <h2>Currently Reading</h2>
  
  <div className="book-card">
    <h3>{currentBook.title}</h3>
    <p>by {currentBook.author}</p>
    <ProgressBar current={currentBook.current_page} total={currentBook.total_pages} />
    <p>{currentBook.current_page} / {currentBook.total_pages} pages ({percentComplete}%)</p>
  </div>
  
  <div className="reading-session">
    <h3>Today's Reading Session</h3>
    <p>Scheduled: {todaysSession.scheduled_time} for {todaysSession.duration_minutes} minutes</p>
    
    <button onClick={handleStartSession}>Start Reading</button>
    
    {sessionActive && (
      <div>
        <p>Session started: {startTime}</p>
        <input 
          type="number" 
          placeholder="Pages read"
          value={pagesRead}
          onChange={(e) => setPagesRead(e.target.value)}
        />
        
        <textarea 
          placeholder="Add notes or thoughts about what you read..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        
        <button onClick={handleEndSession}>End Session</button>
      </div>
    )}
  </div>
  
  <div className="reading-history">
    <h3>Recent Sessions</h3>
    {recentSessions.map(session => (
      <div key={session.id} className="session-item">
        <p>{formatDate(session.started_at)}: {session.pages_read} pages in {session.duration_minutes} min</p>
      </div>
    ))}
  </div>
</div>
```

**Session Logging**:

```typescript
async function startReadingSession(bookId: string, userId: string) {
  const { data: session } = await supabase
    .from('reading_sessions')
    .insert({
      book_id: bookId,
      user_id: userId,
      started_at: new Date(),
      start_page: currentBook.current_page
    })
    .select()
    .single();
  
  return session;
}

async function endReadingSession(sessionId: string, pagesRead: number, notes: string) {
  const session = await getSession(sessionId);
  const endTime = new Date();
  const duration = differenceInMinutes(endTime, session.started_at);
  
  await supabase
    .from('reading_sessions')
    .update({
      ended_at: endTime,
      duration_minutes: duration,
      pages_read: pagesRead,
      end_page: session.start_page + pagesRead,
      user_notes: notes
    })
    .eq('id', sessionId);
  
  // Update book progress
  await supabase
    .from('books')
    .update({
      current_page: session.start_page + pagesRead
    })
    .eq('id', session.book_id);
  
  // Check if book completed
  if (session.start_page + pagesRead >= book.total_pages) {
    await supabase
      .from('books')
      .update({
        status: 'completed',
        completed_at: new Date()
      })
      .eq('id', session.book_id);
    
    // Notify Lexicon
    await saveMessage({
      userId,
      manager: 'lexicon',
      role: 'system',
      content: `Book completed: "${book.title}". Celebrate with user and discuss insights!`
    });
  }
}
```


***

#### **2.7 Manager-to-Manager Conversation Logs**

**Component**: `/components/chat/ManagerConversationLog.tsx`

**Purpose**: Show user how Atlas coordinated with specialists

**UI** (expandable section in Atlas's messages):

```tsx
<div className="atlas-message">
  <p>{atlasMessage.content}</p>
  
  <button onClick={() => toggleExpanded()}>
    {expanded ? '▼' : '▶'} View Planning Conversation
  </button>
  
  {expanded && (
    <div className="conversation-log">
      {coordinationLog.map((log, index) => (
        <div key={index} className={`log-entry ${log.initiator}`}>
          <span className="manager-label">{log.initiator}:</span>
          <p>{log.message}</p>
          {log.response && (
            <div className="response">
              <span className="manager-label">{log.recipient}:</span>
              <p>{log.response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
```

**Sample Coordination Log**:

```json
[
  {
    "initiator": "atlas",
    "recipient": "forge",
    "message": "User reported 5 hours of sleep last night. What workout do you suggest?",
    "response": "Given poor sleep, I recommend active recovery: 20 min yoga + stretching. Low intensity to avoid overtaxing the nervous system."
  },
  {
    "initiator": "atlas",
    "recipient": "olive",
    "message": "User has low-intensity workout today (yoga). What meals support recovery and energy?",
    "response": "I'll focus on sustained energy with complex carbs and moderate protein. Breakfast: Greek yogurt bowl. Lunch: Quinoa salad. Dinner: Salmon with vegetables."
  },
  {
    "initiator": "atlas",
    "recipient": "lexicon",
    "message": "User's schedule shows free time at 8 PM. Reading session?",
    "response": "Perfect. User is on page 44 of 'Atomic Habits'. I'll schedule 25 minutes to complete Chapter 3. We can discuss habit stacking concepts."
  }
]
```


***

## **PHASE 3: Advanced Nutrition \& Progress Tracking**

**Goal**: Integrate food APIs, track micronutrients, visualize progress with charts.

### **Phase 3 Features**

#### **3.1 Food API Integration**

**Implementation**: `/lib/nutrition/food-api.ts`

```typescript
import axios from 'axios';

// Spoonacular API (primary)
export async function searchRecipes({
  query,
  calories,
  protein,
  diet,
  intolerances,
  cuisine
}: RecipeSearchParams) {
  const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
    params: {
      apiKey: process.env.SPOONACULAR_API_KEY,
      query,
      minCalories: calories - 50,
      maxCalories: calories + 50,
      minProtein: protein - 5,
      maxProtein: protein + 5,
      diet,
      intolerances: intolerances.join(','),
      cuisine,
      addRecipeInformation: true,
      fillIngredients: true,
      number: 5
    }
  });
  
  return response.data.results;
}

export async function getRecipeNutrition(recipeId: number) {
  const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json`, {
    params: { apiKey: process.env.SPOONACULAR_API_KEY }
  });
  
  return response.data;
}

// Edamam API (fallback)
export async function analyzeRecipe(ingredients: string[]) {
  const response = await axios.post('https://api.edamam.com/api/nutrition-details', {
    title: 'Custom Recipe',
    ingr: ingredients
  }, {
    params: {
      app_id: process.env.EDAMAM_APP_ID,
      app_key: process.env.EDAMAM_APP_KEY
    }
  });
  
  return {
    calories: response.data.calories,
    protein: response.data.totalNutrients.PROCNT?.quantity,
    carbs: response.data.totalNutrients.CHOCDF?.quantity,
    fats: response.data.totalNutrients.FAT?.quantity,
    vitamins: {
      a: response.data.totalNutrients.VITA_RAE?.quantity,
      b12: response.data.totalNutrients.VITB12?.quantity,
      c: response.data.totalNutrients.VITC?.quantity,
      d: response.data.totalNutrients.VITD?.quantity,
      // ...more
    }
  };
}

// AI estimation (when APIs fail)
export async function estimateNutritionWithAI(mealDescription: string, ingredients: Ingredient[]) {
  const prompt = `
  As a nutrition expert, estimate the nutritional content of this meal:
  
  Meal: ${mealDescription}
  Ingredients: ${ingredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ')}
  
  Provide estimates for:
  - Calories, protein, carbs, fats, fiber
  - Vitamins: A, B12, C, D, E, K
  - Minerals: iron, calcium, magnesium, omega-3
  
  Output JSON format only.
  `;
  
  const response = await callKimiAPI(prompt); // Use Kimi for estimation
  return JSON.parse(response);
}
```


***

#### **3.2 Micronutrient \& Organ Health Tracking**

**Component**: `/components/nutrition/NutritionDashboard.tsx`

**UI**:

```tsx
<div className="nutrition-dashboard">
  <h2>Today's Nutrition</h2>
  
  {/* Macros */}
  <div className="macros-section">
    <MacroBar label="Calories" current={1850} target={2000} unit="cal" />
    <MacroBar label="Protein" current={135} target={150} unit="g" />
    <MacroBar label="Carbs" current={180} target={200} unit="g" />
    <MacroBar label="Fats" current={55} target={60} unit="g" />
  </div>
  
  {/* Micronutrients */}
  <div className="micros-section">
    <h3>Vitamins & Minerals</h3>
    <MicronutrientGrid>
      <MicroCard 
        name="Vitamin D" 
        current={12} 
        target={15} 
        unit="mcg"
        status="low" // 'low' | 'good' | 'high'
      />
      <MicroCard name="Omega-3" current={2.5} target={2.0} unit="g" status="good" />
      {/* ...more */}
    </MicronutrientGrid>
  </div>
  
  {/* Organ Health Indicators */}
  <div className="organ-health-section">
    <h3>Organ Health Support</h3>
    <OrganCard 
      organ="Heart" 
      score={85} 
      foods={['salmon (omega-3)', 'spinach (magnesium)', 'avocado (healthy fats)']}
    />
    <OrganCard 
      organ="Liver" 
      score={78} 
      foods={['broccoli (antioxidants)', 'turmeric (anti-inflammatory)']}
    />
    <OrganCard 
      organ="Brain" 
      score={92} 
      foods={['walnuts (omega-3)', 'blueberries (antioxidants)']}
    />
  </div>
  
  {/* Deficiency Warnings */}
  {deficiencies.length > 0 && (
    <div className="deficiency-alert">
      <h3>⚠️ Nutrient Deficiencies</h3>
      <ul>
        {deficiencies.map(def => (
          <li key={def}>
            <strong>{def}</strong>: Olive will add {getFoodsRichIn(def).join(', ')} to upcoming meals
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
```

**Olive's Deficiency Monitoring**:

```typescript
async function checkNutrientDeficiencies(userId: string) {
  // Get last 7 days of nutrition
  const weekNutrition = await supabase
    .from('nutrition_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo);

  // Calculate averages
  const averages = calculateAverages(weekNutrition.data);
  
  // Compare to RDA (Recommended Daily Allowance)
  const RDA = {
    vitamin_d: 15, // mcg
    vitamin_b12: 2.4, // mcg
    iron: 18, // mg (females), 8 (males)
    calcium: 1000, // mg
    omega3: 1.6, // g
    // ...more
  };
  
  const deficiencies = [];
  for (const [nutrient, rda] of Object.entries(RDA)) {
    if (averages[nutrient] < rda * 0.8) { // 80% threshold
      deficiencies.push(nutrient);
    }
  }
  
  // Save deficiencies
  if (deficiencies.length > 0) {
    await supabase
      .from('nutrition_tracking')
      .update({ deficiencies })
      .eq('user_id', userId)
      .eq('date', today);
    
    // Notify Olive to adjust meal plans
    await saveMessage({
      userId,
      manager: 'olive',
      role: 'system',
      content: `Deficiencies detected: ${deficiencies.join(', ')}. Prioritize these in next meal plan.`
    });
  }
}
```


***

#### **3.3 Progress Charts \& Visualization**

**Component**: `/components/dashboard/ProgressCharts.tsx`

**Charts to Include**:

**1. Weight Progress (Line Chart)**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<LineChart data={weightData} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis domain={[75, 85]} />
  <Tooltip />
  <Line type="monotone" dataKey="weight" stroke="#8884d8" />
  <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" />
</LineChart>
```

**2. Body Measurements (Multi-Line Chart)**

```tsx
<LineChart data={measurementsData}>
  <Line dataKey="belly" stroke="#ff7300" name="Belly (cm)" />
  <Line dataKey="chest" stroke="#387908" name="Chest (cm)" />
  <Line dataKey="biceps" stroke="#8884d8" name="Biceps (cm)" />
</LineChart>
```

**3. Workout Completion Rate (Bar Chart)**

```tsx
<BarChart data={weeklyWorkouts}>
  <XAxis dataKey="week" />
  <YAxis />
  <Bar dataKey="completed" fill="#82ca9d" />
  <Bar dataKey="missed" fill="#ff7300" />
</BarChart>
```

**4. Reading Streak (Calendar Heatmap)**

```tsx
<CalendarHeatmap
  startDate={threeMonthsAgo}
  endDate={today}
  values={readingData} // [{date: '2026-01-08', count: 25}, ...] (pages read)
  classForValue={(value) => {
    if (!value || value.count === 0) return 'color-empty';
    if (value.count < 10) return 'color-scale-1';
    if (value.count < 20) return 'color-scale-2';
    return 'color-scale-3';
  }}
/>
```

**5. Nutrition Score (Gauge Chart)**

```tsx
<GaugeChart
  value={nutritionScore}
  max={100}
  label="Daily Nutrition Score"
  colors={['#ff0000', '#ffaa00', '#00ff00']}
/>
```


***

**End of Part 3**

***


# **Super Mentor - Part 4: Phases 4-6, AI Implementation, and Architecture**


***

## **PHASE 4: Notifications \& Automation**

**Goal**: Email notifications, scheduled check-ins, auto-rescheduling, and goal auto-adjustment.

### **Phase 4 Features**

#### **4.1 Email Notifications (Resend Integration)**

**Setup**: `/lib/email/resend-client.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Super Mentor <notifications@supermentor.app>'
}: EmailParams) {
  try {
    const { data } = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}
```

**Email Templates**: `/lib/email/templates.tsx`

```tsx
// Daily Plan Ready Email
export function DailyPlanReadyEmail({ userName, planSummary, workoutType, breakfastName }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌅 Good Morning, ${userName}!</h1>
            <p>Your daily plan is ready</p>
          </div>
          <div class="content">
            <div class="section">
              <h2>🏋️ Today's Workout</h2>
              <p><strong>${workoutType}</strong></p>
              <p>${planSummary.workoutNotes}</p>
            </div>
            
            <div class="section">
              <h2>🍽️ Breakfast</h2>
              <p><strong>${breakfastName}</strong></p>
              <p>Ready at 8:00 AM</p>
            </div>
            
            <div class="section">
              <h2>📚 Reading</h2>
              <p>${planSummary.readingGoal}</p>
            </div>
            
            <a href="https://supermentor.app/dashboard" class="button">View Full Plan</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Proactive Check-in Email
export function ProactiveCheckInEmail({ managerName, message, userName }) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div class="container">
          <h2>👋 ${managerName} checking in</h2>
          <p>Hi ${userName},</p>
          <p>${message}</p>
          <a href="https://supermentor.app/chat?manager=${managerName.toLowerCase()}" class="button">Reply to ${managerName}</a>
        </div>
      </body>
    </html>
  `;
}

// Weekly Summary Email
export function WeeklySummaryEmail({ userName, weekData, achievements, improvements }) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Summary</h1>
            <p>${weekData.startDate} - ${weekData.endDate}</p>
          </div>
          <div class="content">
            <div class="section">
              <h2>🏆 Achievements</h2>
              <ul>
                ${achievements.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section">
              <h2>📈 Progress</h2>
              <ul>
                <li>Workouts completed: ${weekData.workoutsCompleted}/${weekData.workoutsPlanned}</li>
                <li>Meals logged: ${weekData.mealsLogged}/${weekData.mealsPlanned}</li>
                <li>Reading sessions: ${weekData.readingSessions}</li>
                <li>Pages read: ${weekData.pagesRead}</li>
              </ul>
            </div>
            
            <div class="section">
              <h2>💡 Areas for Improvement</h2>
              <ul>
                ${improvements.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
            
            <a href="https://supermentor.app/progress" class="button">View Detailed Report</a>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

**Trigger Points for Emails**:

```typescript
// 1. Daily Plan Ready (6:15 AM)
async function sendDailyPlanEmail(userId: string) {
  const user = await getUser(userId);
  const dailyPlan = await getDailyPlan(userId, new Date());
  
  await sendEmail({
    to: user.email,
    subject: '🌅 Your Daily Plan is Ready',
    html: DailyPlanReadyEmail({
      userName: user.name,
      planSummary: dailyPlan.atlas_morning_message,
      workoutType: dailyPlan.workout.workout_type,
      breakfastName: dailyPlan.meals.find(m => m.meal_type === 'breakfast').name
    })
  });
}

// 2. Proactive Check-in (when manager reaches out)
async function sendProactiveCheckInEmail(userId: string, manager: string, message: string) {
  const user = await getUser(userId);
  
  await sendEmail({
    to: user.email,
    subject: `${manager} has a question for you`,
    html: ProactiveCheckInEmail({
      managerName: manager,
      message,
      userName: user.name
    })
  });
}

// 3. Weekly Summary (Sunday 8 PM)
async function sendWeeklySummaryEmail(userId: string) {
  const user = await getUser(userId);
  const weekData = await getWeekData(userId);
  const summary = await generateWeeklySummary(userId);
  
  await sendEmail({
    to: user.email,
    subject: '📊 Your Weekly Summary',
    html: WeeklySummaryEmail({
      userName: user.name,
      weekData,
      achievements: summary.achievements,
      improvements: summary.improvements
    })
  });
}
```

**Cron Job for Emails**: `/app/api/cron/send-emails/route.ts`

```typescript
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const users = await getAllActiveUsers();

  for (const user of users) {
    const userLocalTime = convertToTimezone(now, user.timezone);
    
    // Daily plan email (6:15 AM)
    if (userLocalTime.getHours() === 6 && userLocalTime.getMinutes() === 15) {
      await sendDailyPlanEmail(user.id);
    }
    
    // Weekly summary (Sunday 8 PM)
    if (userLocalTime.getDay() === 0 && userLocalTime.getHours() === 20) {
      await sendWeeklySummaryEmail(user.id);
    }
  }

  return new Response('Emails sent', { status: 200 });
}
```

**Vercel Cron** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-planning",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/proactive-checks",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/send-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```


***

#### **4.2 Auto-Rescheduling Around Conflicts**

**Implementation**: `/lib/scheduling/auto-reschedule.ts`

```typescript
export async function autoRescheduleWorkout({
  userId,
  workoutId,
  conflictStartTime,
  conflictEndTime
}: RescheduleParams) {
  // 1. Get user's schedule for today
  const todaySchedule = await getUserScheduleForDate(userId, new Date());
  
  // 2. Find available time windows (at least 45 minutes)
  const availableWindows = findAvailableTimeWindows({
    schedule: todaySchedule,
    minimumDuration: 45,
    excludeWindows: [{ start: conflictStartTime, end: conflictEndTime }]
  });
  
  // 3. Consult Forge for best time
  const forgePreference = await askForgeOptimalTime({
    availableWindows,
    mealTimes: todaySchedule.meals,
    workoutType: workout.workout_type
  });
  
  // 4. Update workout time
  await supabase
    .from('workout_plans')
    .update({ scheduled_time: forgePreference.time })
    .eq('id', workoutId);
  
  // 5. Notify user
  await sendMessage({
    userId,
    manager: 'forge',
    role: 'assistant',
    content: `I noticed your schedule changed and moved today's workout to ${formatTime(forgePreference.time)}. This works better with your meal timing. Let me know if you need another adjustment! 💪`
  });
  
  return forgePreference.time;
}

function findAvailableTimeWindows({ schedule, minimumDuration, excludeWindows }) {
  const dayStart = parseTime('06:00');
  const dayEnd = parseTime('22:00');
  const busyWindows = [...schedule.events, ...excludeWindows].sort((a, b) => 
    a.start.getTime() - b.start.getTime()
  );
  
  const available = [];
  let currentTime = dayStart;
  
  for (const busyWindow of busyWindows) {
    const gapDuration = differenceInMinutes(busyWindow.start, currentTime);
    if (gapDuration >= minimumDuration) {
      available.push({ start: currentTime, end: busyWindow.start, duration: gapDuration });
    }
    currentTime = busyWindow.end;
  }
  
  // Check remaining time until day end
  const finalGap = differenceInMinutes(dayEnd, currentTime);
  if (finalGap >= minimumDuration) {
    available.push({ start: currentTime, end: dayEnd, duration: finalGap });
  }
  
  return available;
}
```

**Trigger**: When user updates schedule mid-day

```typescript
// User says to Atlas: "I have a surprise meeting 2-4 PM today"
async function handleScheduleChange(userId: string, newEvent: ScheduleEvent) {
  // 1. Save new event
  await supabase.from('user_schedules').insert(newEvent);
  
  // 2. Check for conflicts with today's plan
  const todayPlan = await getDailyPlan(userId, new Date());
  const conflicts = findConflicts(todayPlan, newEvent);
  
  // 3. Auto-reschedule conflicting items
  for (const conflict of conflicts) {
    if (conflict.type === 'workout') {
      await autoRescheduleWorkout({
        userId,
        workoutId: conflict.id,
        conflictStartTime: newEvent.start_time,
        conflictEndTime: newEvent.end_time
      });
    } else if (conflict.type === 'meal') {
      await autoRescheduleMeal({ userId, mealId: conflict.id, newEvent });
    } else if (conflict.type === 'reading') {
      await autoRescheduleReading({ userId, sessionId: conflict.id, newEvent });
    }
  }
  
  // 4. Atlas confirms
  await sendMessage({
    userId,
    manager: 'atlas',
    role: 'assistant',
    content: `Got it! I've updated your schedule and adjusted today's plan around your 2-4 PM meeting. Everything is now optimized for your new availability. 🎯`
  });
}
```


***

#### **4.3 Goal Auto-Adjustment (Atlas Detects Milestones)**

**Implementation**: `/lib/goals/auto-adjust.ts`

```typescript
export async function checkAndAdjustGoals(userId: string) {
  const user = await getUser(userId);
  const currentGoals = await getActiveGoals(userId);
  const latestMeasurements = await getLatestMeasurements(userId);
  
  for (const goal of currentGoals) {
    if (goal.goal_type === 'target') {
      // Check if target achieved
      const achieved = checkGoalAchievement(goal, latestMeasurements);
      
      if (achieved) {
        // 1. Mark goal as achieved
        await supabase
          .from('goals')
          .update({
            status: 'achieved',
            achieved_at: new Date()
          })
          .eq('id', goal.id);
        
        // 2. Atlas celebrates with user
        await sendMessage({
          userId,
          manager: 'atlas',
          role: 'assistant',
          content: `🎉 INCREDIBLE! You've achieved your goal: ${goal.description}! Your belly is now ${latestMeasurements.belly_cm}cm - you hit your target of ${goal.target_measurements.belly}cm! This is a major milestone. Let's shift into maintenance mode to keep this progress. I'm proud of you! 💪`
        });
        
        // 3. Create new maintenance goal
        const maintenanceGoal = await supabase
          .from('goals')
          .insert({
            user_id: userId,
            category: goal.category,
            goal_type: 'lifestyle', // shift from 'target' to 'lifestyle'
            description: `Maintain ${goal.description}`,
            target_measurements: goal.target_measurements, // keep as baseline
            status: 'active',
            calorie_mode: 'maintenance' // Olive shifts from deficit
          })
          .select()
          .single();
        
        // 4. Notify all managers
        await notifyManagers({
          userId,
          message: `Goal achieved: ${goal.description}. New focus: maintenance mode.`,
          managers: ['forge', 'olive', 'lexicon']
        });
        
        // 5. Forge adjusts workout focus
        await saveMessage({
          userId,
          manager: 'forge',
          role: 'system',
          content: `User achieved fat loss goal. Shift focus to muscle building and strength maintenance. Increase intensity gradually.`
        });
        
        // 6. Olive adjusts nutrition
        await saveMessage({
          userId,
          manager: 'olive',
          role: 'system',
          content: `User achieved weight goal. Switch from calorie deficit to maintenance (${calculateMaintenanceCalories(user)} calories/day). Focus on balanced nutrition for muscle preservation.`
        });
        
        // 7. Send email
        await sendEmail({
          to: user.email,
          subject: '🎉 Goal Achieved!',
          html: GoalAchievementEmail({
            userName: user.name,
            goalDescription: goal.description,
            measurements: latestMeasurements
          })
        });
      } else {
        // Check if close to goal (80% progress)
        const progress = calculateProgress(goal, latestMeasurements);
        if (progress >= 80 && progress < 90) {
          // Atlas encourages
          await sendMessage({
            userId,
            manager: 'atlas',
            role: 'assistant',
            content: `You're ${progress}% of the way to your goal: ${goal.description}! Almost there - keep up the great work! 🔥`
          });
        }
      }
    }
  }
}

function checkGoalAchievement(goal: Goal, measurements: Measurement): boolean {
  if (goal.category === 'fitness') {
    // Check body measurements
    if (goal.target_measurements.belly) {
      return measurements.belly_cm <= goal.target_measurements.belly;
    }
    if (goal.target_weight_kg) {
      return measurements.weight_kg <= goal.target_weight_kg;
    }
  }
  
  return false;
}

function calculateProgress(goal: Goal, measurements: Measurement): number {
  const start = goal.starting_measurements.belly_cm;
  const target = goal.target_measurements.belly;
  const current = measurements.belly_cm;
  
  const totalDistance = start - target;
  const currentDistance = start - current;
  
  return (currentDistance / totalDistance) * 100;
}
```

**Trigger**: Run after measurements logged

```typescript
// User logs measurements
async function logMeasurements(userId: string, measurements: MeasurementData) {
  // 1. Save to database
  await supabase.from('measurements').insert({ user_id: userId, ...measurements });
  
  // 2. Check goals
  await checkAndAdjustGoals(userId);
  
  // 3. Update muscle balance tracking (Forge)
  await updateMuscleBalance(userId, measurements);
}
```


***

#### **4.4 Forge's Perfect Body Calculation**

**Implementation**: `/lib/fitness/ideal-measurements.ts`

```typescript
export function calculateIdealMeasurements({
  gender,
  height_cm,
  age,
  weight_kg
}: UserProfile): IdealMeasurements {
  // Based on fitness industry standards and anthropometric data
  
  if (gender === 'male') {
    return {
      chest_cm: height_cm * 0.55, // 55% of height
      waist_cm: height_cm * 0.43, // 43% of height
      hips_cm: height_cm * 0.53,
      thighs_cm: height_cm * 0.31,
      calves_cm: height_cm * 0.21,
      biceps_cm: height_cm * 0.19,
      forearms_cm: height_cm * 0.16,
      neck_cm: height_cm * 0.21,
      shoulders_cm: height_cm * 0.79
    };
  } else { // female
    return {
      chest_cm: height_cm * 0.52,
      waist_cm: height_cm * 0.38,
      hips_cm: height_cm * 0.57,
      thighs_cm: height_cm * 0.33,
      calves_cm: height_cm * 0.20,
      biceps_cm: height_cm * 0.17,
      forearms_cm: height_cm * 0.15,
      neck_cm: height_cm * 0.19,
      shoulders_cm: height_cm * 0.73
    };
  }
}

export async function assessMuscleBalance(userId: string) {
  const user = await getUser(userId);
  const currentMeasurements = await getLatestMeasurements(userId);
  const idealMeasurements = calculateIdealMeasurements(user);
  
  const balance = {};
  let totalDeviation = 0;
  
  for (const [part, idealValue] of Object.entries(idealMeasurements)) {
    const currentValue = currentMeasurements[part];
    const deviation = Math.abs(currentValue - idealValue) / idealValue;
    const progress = Math.min(100, (currentValue / idealValue) * 100);
    
    balance[part] = {
      current: currentValue,
      ideal: idealValue,
      progress: progress,
      status: deviation < 0.05 ? 'optimal' : deviation < 0.15 ? 'good' : 'needs_work'
    };
    
    totalDeviation += deviation;
  }
  
  const balanceScore = Math.max(0, 100 - (totalDeviation * 10));
  
  // Identify priority areas (furthest from ideal)
  const priorityAreas = Object.entries(balance)
    .filter(([_, data]) => data.status === 'needs_work')
    .sort((a, b) => a[^13_1].progress - b[^13_1].progress)
    .slice(0, 3)
    .map(([part, _]) => part);
  
  // Save assessment
  await supabase.from('muscle_balance_tracking').insert({
    user_id: userId,
    muscle_groups: balance,
    balance_score: balanceScore,
    priority_areas: priorityAreas,
    forge_notes: `Focus on ${priorityAreas.join(', ')} for the next 2 weeks to improve overall balance.`
  });
  
  return { balance, balanceScore, priorityAreas };
}

// Forge uses this to adjust workouts
export async function generateBalancedWorkout(userId: string) {
  const balanceData = await assessMuscleBalance(userId);
  
  // Forge's prompt includes priority areas
  const prompt = `
  Generate today's workout for ${user.name}.
  
  MUSCLE BALANCE DATA:
  - Overall balance score: ${balanceData.balanceScore}/100
  - Priority areas (need more work): ${balanceData.priorityAreas.join(', ')}
  - Muscle groups at optimal: ${Object.entries(balanceData.balance).filter(([_, d]) => d.status === 'optimal').map(([part, _]) => part).join(', ')}
  
  GUIDELINES:
  - Prioritize exercises for ${balanceData.priorityAreas[^13_0]} and ${balanceData.priorityAreas[^13_1]}
  - Include at least 2 exercises per priority area
  - Don't neglect other muscle groups, but reduce volume slightly
  - Aim for balanced, proportionate development
  
  ...rest of context
  `;
  
  return await callDeepSeekAPI(prompt);
}
```


***

## **PHASE 5: Advanced Analytics \& Export**

**Goal**: Comprehensive analytics dashboard, week-over-week comparisons, export functionality.

### **Phase 5 Features**

#### **5.1 Advanced Analytics Dashboard**

**Component**: `/components/analytics/AnalyticsDashboard.tsx`

**Features**:

- **Multi-week trends**: Weight, body fat %, measurements over 12 weeks
- **Workout intensity heatmap**: Which days had hardest workouts
- **Nutrition compliance**: % of days hitting macro targets
- **Reading consistency**: Streak calendar, pages per day trend
- **Correlations**: Sleep quality vs workout performance, nutrition vs energy levels

```tsx
<div className="analytics-dashboard">
  <h1>Analytics & Insights</h1>
  
  {/* Time Range Selector */}
  <div className="time-range-selector">
    <button onClick={() => setRange('month')}>Last Month</button>
    <button onClick={() => setRange('quarter')}>Last 3 Months</button>
    <button onClick={() => setRange('year')}>Last Year</button>
  </div>
  
  {/* Overview Cards */}
  <div className="stats-grid">
    <StatCard 
      title="Weight Change" 
      value={`-${weightChange}kg`} 
      trend="down" 
      period={range}
    />
    <StatCard 
      title="Workouts Completed" 
      value={`${workoutsCompleted}/${workoutsPlanned}`}
      percentage={completionRate}
    />
    <StatCard 
      title="Nutrition Score Avg" 
      value={avgNutritionScore}
      outOf={100}
    />
    <StatCard 
      title="Reading Streak" 
      value={`${readingStreak} days`}
      longest={longestStreak}
    />
  </div>
  
  {/* Body Composition Trends */}
  <div className="chart-section">
    <h2>Body Composition Progress</h2>
    <LineChart 
      data={bodyCompData}
      metrics={['weight', 'belly', 'chest', 'biceps']}
      showGoalLines={true}
    />
  </div>
  
  {/* Workout Performance */}
  <div className="chart-section">
    <h2>Workout Performance</h2>
    <HeatMap 
      data={workoutIntensityData}
      xAxis="week"
      yAxis="day"
      colorScale={['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']}
    />
  </div>
  
  {/* Nutrition Breakdown */}
  <div className="chart-section">
    <h2>Nutrition Compliance</h2>
    <StackedBarChart 
      data={nutritionComplianceData}
      metrics={['protein', 'carbs', 'fats']}
      showTargetLine={true}
    />
  </div>
  
  {/* Correlations */}
  <div className="insights-section">
    <h2>AI-Generated Insights</h2>
    <InsightCard 
      icon="💤"
      title="Sleep & Performance Correlation"
      insight="Your workout performance is 23% better on days after 7+ hours of sleep. Prioritize rest!"
    />
    <InsightCard 
      icon="🍽️"
      title="Nutrition Impact"
      insight="Days with 150g+ protein show 15% better muscle recovery. Keep up the protein intake!"
    />
    <InsightCard 
      icon="📚"
      title="Reading Pattern"
      insight="You read 40% more on weekends. Consider scheduling longer weekend sessions."
    />
  </div>
</div>
```


***

#### **5.2 Export Functionality**

**Implementation**: `/lib/export/data-export.ts`

```typescript
import { json2csv } from 'json-2-csv';
import PDFDocument from 'pdfkit';

// Export conversations
export async function exportConversations(userId: string, format: 'json' | 'csv') {
  const conversations = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (format === 'json') {
    return JSON.stringify(conversations.data, null, 2);
  } else {
    return json2csv(conversations.data);
  }
}

// Export measurements
export async function exportMeasurements(userId: string, format: 'json' | 'csv' | 'pdf') {
  const measurements = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: true });
  
  if (format === 'pdf') {
    return generateMeasurementsPDF(measurements.data);
  } else if (format === 'json') {
    return JSON.stringify(measurements.data, null, 2);
  } else {
    return json2csv(measurements.data);
  }
}

// Generate PDF report
function generateMeasurementsPDF(data: Measurement[]) {
  const doc = new PDFDocument();
  
  doc.fontSize(20).text('Super Mentor - Progress Report', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(14).text(`Report Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(16).text('Measurement History');
  doc.moveDown();
  
  data.forEach((measurement, index) => {
    doc.fontSize(12).text(`Date: ${new Date(measurement.measured_at).toLocaleDateString()}`);
    doc.fontSize(10).text(`Weight: ${measurement.weight_kg}kg | Belly: ${measurement.belly_cm}cm | Chest: ${measurement.chest_cm}cm`);
    doc.moveDown();
  });
  
  return doc;
}

// Export all user data (GDPR compliance)
export async function exportAllUserData(userId: string) {
  const [
    profile,
    goals,
    measurements,
    conversations,
    meals,
    workouts,
    books,
    readingSessions
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('measurements').select('*').eq('user_id', userId),
    supabase.from('conversations').select('*').eq('user_id', userId),
    supabase.from('meals').select('*').eq('user_id', userId),
    supabase.from('workout_plans').select('*').eq('user_id', userId),
    supabase.from('books').select('*').eq('user_id', userId),
    supabase.from('reading_sessions').select('*').eq('user_id', userId)
  ]);
  
  return {
    profile: profile.data,
    goals: goals.data,
    measurements: measurements.data,
    conversations: conversations.data,
    nutrition: meals.data,
    fitness: workouts.data,
    reading: {
      books: books.data,
      sessions: readingSessions.data
    },
    exportedAt: new Date().toISOString()
  };
}
```

**UI Component**: `/components/settings/ExportData.tsx`

```tsx
<div className="export-section">
  <h2>Export Your Data</h2>
  
  <div className="export-options">
    <div className="export-card">
      <h3>Conversations</h3>
      <p>All chat history with Atlas, Forge, Olive, and Lexicon</p>
      <button onClick={() => handleExport('conversations', 'json')}>Export as JSON</button>
      <button onClick={() => handleExport('conversations', 'csv')}>Export as CSV</button>
    </div>
    
    <div className="export-card">
      <h3>Measurements</h3>
      <p>Your body measurement history</p>
      <button onClick={() => handleExport('measurements', 'pdf')}>Export as PDF</button>
      <button onClick={() => handleExport('measurements', 'csv')}>Export as CSV</button>
    </div>
    
    <div className="export-card">
      <h3>Complete Data Archive</h3>
      <p>All your data (profile, goals, conversations, nutrition, fitness, reading)</p>
      <button onClick={() => handleExport('all', 'json')}>Download Complete Archive</button>
    </div>
  </div>
</div>
```


***

## **PHASE 6+: PWA \& Future Enhancements**

**Goal**: Progressive Web App, Apple Watch integration, food photo recognition.

### **Phase 6 Features**

#### **6.1 Progressive Web App (PWA)**

**Setup**: `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // your Next.js config
});
```

**Manifest**: `public/manifest.json`

```json
{
  "name": "Super Mentor",
  "short_name": "SuperMentor",
  "description": "Your AI-powered holistic life coach",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Push Notifications**: `/lib/notifications/push.ts`

```typescript
export async function subscribeToPushNotifications(userId: string, subscription: PushSubscription) {
  await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint: subscription.endpoint,
    keys: subscription.keys
  });
}

export async function sendPushNotification(userId: string, notification: NotificationPayload) {
  const subscriptions = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);
  
  for (const sub of subscriptions.data) {
    await webpush.sendNotification(sub, JSON.stringify(notification));
  }
}
```


***

#### **6.2 Apple Watch Integration** (Placeholder)

**API Endpoints**: `/app/api/apple-watch/route.ts`

```typescript
// Receive sleep data from Apple Watch
export async function POST(request: Request) {
  const { userId, sleepData } = await request.json();
  
  await supabase.from('sleep_tracking').insert({
    user_id: userId,
    sleep_start: sleepData.startTime,
    sleep_end: sleepData.endTime,
    sleep_quality: sleepData.quality,
    deep_sleep_minutes: sleepData.deepSleep,
    rem_sleep_minutes: sleepData.remSleep,
    source: 'apple_watch'
  });
  
  return Response.json({ success: true });
}

// Receive workout data
export async function POST(request: Request) {
  const { userId, workoutData } = await request.json();
  
  // Auto-log workout
  await supabase.from('workout_logs').insert({
    user_id: userId,
    workout_type: workoutData.activityType,
    duration_minutes: workoutData.duration,
    calories_burned: workoutData.calories,
    avg_heart_rate: workoutData.avgHeartRate,
    source: 'apple_watch'
  });
  
  return Response.json({ success: true });
}
```


***

#### **6.3 Food Photo Recognition** (Placeholder)

**Implementation**: `/lib/nutrition/food-recognition.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeFoodPhoto(imageBase64: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this food image. Identify all foods visible and estimate: serving sizes, calories, protein, carbs, fats. Output JSON format.'
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }
    ]
  });
  
  const analysis = JSON.parse(response.choices[^13_0].message.content);
  
  return {
    foods: analysis.foods,
    totalCalories: analysis.totalCalories,
    macros: analysis.macros
  };
}
```


***

## **AI IMPLEMENTATION DETAILS**

### **System Prompts for Each Manager**

#### **Atlas (GPT-5.2) - Master Coordinator**

```typescript
const ATLAS_SYSTEM_PROMPT = `
You are Atlas, the master coordinator and supreme guardian of ${user.name}'s holistic health journey.

CORE IDENTITY:
- You are wise, protective, and always prioritize the user's long-term well-being
- You see the big picture: fitness, nutrition, reading, stress, sleep, work-life balance
- You coordinate Forge (fitness), Olive (nutrition), and Lexicon (reading)
- You have veto power: reject any specialist suggestion that conflicts with holistic goals

YOUR RESPONSIBILITIES:
1. Generate daily plans by consulting all three specialists
2. Review and approve/reject/modify specialist suggestions
3. Monitor progress toward lifestyle goals (not just targets)
4. Detect when goals are achieved and shift to maintenance mode
5. Anticipate problems (poor sleep → reject intense workout)
6. Celebrate achievements and encourage during setbacks
7. Generate daily summaries (11:30 PM) and weekly/monthly reviews

USER CONTEXT:
- Name: ${user.name}
- Age: ${user.age}, Gender: ${user.gender}, Height: ${user.height_cm}cm
- Goals: ${goals.map(g => g.description).join(', ')}
- Current Status: ${currentStatus}

DECISION FRAMEWORK:
When evaluating specialist suggestions, consider:
- Sleep quality (last night)
- Stress levels (recent conversations)
- Schedule conflicts (calendar)
- Recovery status (recent workouts)
- Nutrition adequacy (recent meals)
- Overall goal alignment

COMMUNICATION STYLE:
- Warm but authoritative
- Use "we" language ("Let's adjust...")
- Explain your reasoning ("I modified Forge's suggestion because...")
- Celebrate wins enthusiastically
- Be honest about setbacks but always constructive

MEMORY:
You have access to:
- All conversation history (1 year)
- Daily plans and summaries
- Measurements and progress data
- Cross-manager coordination logs

When user talks to you, show you remember context and care about their journey.
`;
```


***

#### **Forge (DeepSeek-V3.1) - Fitness Manager**

```typescript
const FORGE_SYSTEM_PROMPT = `
You are Forge, ${user.name}'s personal fitness coach and muscle development specialist.

CORE IDENTITY:
- Passionate about building strong, balanced, functional bodies
- Data-driven: you track progress, adjust based on feedback
- Safety-first: never suggest exercises that risk injury
- Motivating but realistic: push users, but respect recovery needs

YOUR EXPERTISE:
- Design adaptive daily workouts (not rigid programs)
- Balance muscle development across all body parts
- Integrate nutrition (you know what Olive plans for meals)
- Manage recovery and rest days
- Track toward ideal body proportions for user's height/gender/age

USER CONTEXT:
- Current measurements: ${currentMeasurements}
- Ideal measurements: ${idealMeasurements}
- Muscle balance score: ${balanceScore}/100
- Priority areas: ${priorityAreas.join(', ')}
- Available equipment: ${user.equipment_available}
- Injuries/limitations: ${user.injuries}

WORKOUT GENERATION RULES:
1. Check recent workouts (avoid overtraining same muscle groups)
2. Check food intake (high protein yesterday → can push harder today)
3. Check sleep quality (poor sleep → active recovery or low intensity)
4. Check schedule (only 30 min available → quick HIIT, not 60 min strength)
5. Prioritize lagging muscle groups from balance assessment

WORKOUT STRUCTURE:
{
  "workout_type": "strength" | "cardio" | "hiit" | "yoga" | "active_recovery",
  "focus_areas": ["legs", "chest"],
  "exercises": [
    {
      "name": "Barbell Squats",
      "sets": 4,
      "reps": 8,
      "weight_kg": 80,
      "rest_seconds": 120,
      "form_cues": ["Keep chest up", "Knees track over toes"]
    }
  ],
  "total_duration_minutes": 45,
  "intensity": "high" | "moderate" | "low"
}

ADAPTATION:
- User says "too hard": reduce weight/reps next time
- User says "knee hurt": avoid squats, suggest alternatives
- User missed workout: don't make them feel guilty, reschedule

COMMUNICATION STYLE:
- Energetic and motivating ("Let's build some power today! 💪")
- Use fitness terminology but explain clearly
- Celebrate strength gains ("You lifted 5kg more than last week!")
- Practical: always consider user's real-life constraints

COLLABORATION:
- Query Olive for recent meals before generating workout
- Notify Atlas if user reports injury or burnout
- Adjust intensity based on Atlas's overall assessment
`;
```


***

#### **Olive (Kimi K2-0905) - Nutrition Manager**

```typescript
const OLIVE_SYSTEM_PROMPT = `
You are Olive, ${user.name}'s nutrition expert, meal planner, and health advisor.

CORE IDENTITY:
- Treat food as medicine: optimize organ health, not just calories
- Personalized: consider preferences, restrictions, cooking skill
- Structured: create detailed 3-day meal plans with shopping lists
- Medical knowledge: understand vitamins, minerals, organ health

YOUR EXPERTISE:
- Generate meal plans (breakfast, lunch, dinner, snacks)
- Calculate macros and micros accurately
- Track nutrient deficiencies and adjust meals
- Coordinate with Forge (meals support workout recovery)
- Shopping list generation (exact quantities, categories)

USER CONTEXT:
- Dietary restrictions: ${user.dietary_restrictions}
- Food dislikes: ${user.food_dislikes}
- Favorite cuisines: ${user.favorite_cuisines}
- Cooking skill: ${user.cooking_skill}
- Shopping frequency: Every ${user.shopping_frequency} days
- Calorie mode: ${calorieMode} (deficit | maintenance | surplus)
- Macro targets: ${macroTargets}

MEAL GENERATION RULES:
1. Variety: Don't repeat meals from last 7 days
2. Recovery: After intense workout, prioritize protein + anti-inflammatory foods
3. Deficiencies: If user low on Vitamin D, add salmon, eggs, fortified foods
4. Schedule: Align meal times with user's daily schedule
5. Preferences: Focus on favorite cuisines, avoid dislikes
6. Skill: ${user.cooking_skill === 'beginner' ? 'Simple recipes, 15-20 min prep' : 'Can suggest more complex recipes'}

MEAL PLAN STRUCTURE:
{
  "meals": [
    {
      "meal_type": "breakfast",
      "scheduled_time": "08:00",
      "name": "Greek Yogurt Power Bowl",
      "ingredients": [
        {"name": "Greek yogurt", "quantity": 200, "unit": "g"},
        ...
      ],
      "calories": 420,
      "protein_g": 25,
      "carbs_g": 45,
      "fats_g": 15,
      "vitamin_d_mcg": 2.5,
      "omega3_g": 0.8,
      "health_benefits": ["heart_health", "gut_health"]
    }
  ]
}

ORGAN HEALTH FOCUS:
- Heart: omega-3, fiber, magnesium, potassium
- Liver: antioxidants, turmeric, leafy greens
- Brain: omega-3, B vitamins, antioxidants
- Gut: fiber, probiotics (yogurt, kefir)
- Kidneys: hydration, low sodium

DEFICIENCY MONITORING:
Check user's last 7 days nutrition. If any vitamin/mineral below 80% RDA, prioritize in next meals.

COMMUNICATION STYLE:
- Caring and nurturing ("Let's nourish your body properly!")
- Educational: explain why certain foods benefit specific organs
- Flexible: "Don't like salmon? Let's swap for mackerel or walnuts"
- Human: ask how meals tasted, remember favorites

COLLABORATION:
- Query Forge for workout intensity before planning meals
- Notify Atlas if user consistently skips meals or eats off-plan
- Adapt quickly when user has surprise schedule changes
`;
```


***

#### **Lexicon (Kimi K2-0905) - Reading Manager**

```typescript
const LEXICON_SYSTEM_PROMPT = `
You are Lexicon, ${user.name}'s reading coach, intellectual companion, and guide to wisdom.

CORE IDENTITY:
- You love books, ideas, philosophy, psychology
- You help users extract insights and apply them to life
- You're a great conversation partner: deep discussions, not just tracking
- You understand multipotentialite interests: variety is valuable

YOUR EXPERTISE:
- Track reading progress (books, pages, sessions)
- Recommend book prioritization from backlog
- Discuss book content deeply (you remember specific pages/chapters)
- Connect book insights to user's life goals
- Encourage daily reading habit (but don't guilt-trip)

USER CONTEXT:
- Current backlog: ${books.backlog.length} books, ${audiobooks.length} audiobooks
- Reading speed: ${user.reading_speed_wpm} words/minute
- Favorite genres: ${user.favorite_genres}
- Daily reading goal: ${readingGoal.daily_minutes} minutes
- Current book: "${currentBook.title}" by ${currentBook.author} (page ${currentBook.current_page}/${currentBook.total_pages})

READING MANAGEMENT:
1. Prioritize backlog based on user's current life context
   - Example: User stressed at work → suggest "Man's Search for Meaning" before "Atomic Habits"
2. Schedule reading sessions in user's free time windows
3. Track pages read, time spent, consistency
4. Celebrate reading streaks and completed books
5. Rotate between topics (philosophy, psychology, self-help) for variety

DISCUSSION APPROACH:
- Remember specific content: "On page 44 of Atomic Habits, James Clear talks about habit stacking..."
- Ask thought-provoking questions: "How could you apply habit stacking to your meal prep?"
- Connect to other books: "This idea relates to what you read in 'Thinking, Fast and Slow'"
- Expand on user's notes: user highlights passage → discuss implications deeply

PHILOSOPHY & PSYCHOLOGY ROLE:
- User can discuss life questions, existential thoughts, personal growth
- You're knowledgeable about: Stoicism, existentialism, CBT, positive psychology
- Help user gain self-understanding through reading and reflection
- Connect book wisdom to user's fitness/nutrition/life goals

COMMUNICATION STYLE:
- Intellectual but accessible (not pretentious)
- Curious and engaging: "What did you think about...?"
- Encouraging: "Even 10 minutes counts - consistency matters more than duration"
- Reflective: help user process and apply what they read

PROACTIVE ENGAGEMENT:
- If user misses reading session: "I noticed you didn't read last night. Everything okay? We can adjust your schedule if needed."
- When user finishes book: "Congratulations on finishing [title]! What were your biggest takeaways? Ready to start the next book?"
- Mid-book check-ins: "You're halfway through [title]. How are you finding it so far?"

COLLABORATION:
- Mostly independent (Forge and Olive don't need reading info)
- BUT: Atlas monitors your conversations for holistic insights
  - Example: User discusses burnout with you → Atlas tells Forge to ease training
- If book insight applies to fitness/nutrition, share with Atlas
  - Example: User reads about intermittent fasting → Atlas asks Olive if it aligns with goals
`;
```


***

**End of Part 4**

***


# **Super Mentor - Part 5: Component Architecture, Best Practices, and Deployment**


***

## **COMPLETE FILE STRUCTURE**

```
super-mentor/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx                  # Onboarding wizard
│   ├── api/
│   │   ├── ai/
│   │   │   ├── atlas/
│   │   │   │   └── route.ts              # Atlas API endpoint
│   │   │   ├── forge/
│   │   │   │   └── route.ts              # Forge API endpoint
│   │   │   ├── olive/
│   │   │   │   └── route.ts              # Olive API endpoint
│   │   │   └── lexicon/
│   │   │       └── route.ts              # Lexicon API endpoint
│   │   ├── cron/
│   │   │   ├── daily-planning/
│   │   │   │   └── route.ts              # 6 AM daily plan generation
│   │   │   ├── proactive-checks/
│   │   │   │   └── route.ts              # 30-min proactive check-ins
│   │   │   └── send-emails/
│   │   │       └── route.ts              # Email notifications
│   │   ├── measurements/
│   │   │   └── route.ts                  # Log/retrieve measurements
│   │   ├── meals/
│   │   │   ├── route.ts                  # Meal CRUD operations
│   │   │   ├── swap/
│   │   │   │   └── route.ts              # Meal swapping
│   │   │   └── shopping-list/
│   │   │       └── route.ts              # Generate shopping lists
│   │   ├── workouts/
│   │   │   ├── route.ts                  # Workout CRUD
│   │   │   └── log/
│   │   │       └── route.ts              # Log workout completion
│   │   ├── books/
│   │   │   ├── route.ts                  # Book CRUD
│   │   │   └── sessions/
│   │   │       └── route.ts              # Reading session tracking
│   │   ├── goals/
│   │   │   └── route.ts                  # Goal management
│   │   ├── schedule/
│   │   │   └── route.ts                  # User schedule management
│   │   └── export/
│   │       └── route.ts                  # Data export
│   ├── dashboard/
│   │   └── page.tsx                      # Main daily dashboard
│   ├── chat/
│   │   └── page.tsx                      # Chat interface
│   ├── profile/
│   │   └── page.tsx                      # User profile & measurements
│   ├── progress/
│   │   └── page.tsx                      # Progress charts & analytics
│   ├── nutrition/
│   │   ├── page.tsx                      # Nutrition dashboard
│   │   └── meal-plan/
│   │       └── page.tsx                  # 3-day meal plan view
│   ├── fitness/
│   │   └── page.tsx                      # Workout plans & logs
│   ├── reading/
│   │   └── page.tsx                      # Book tracker & reading sessions
│   ├── settings/
│   │   └── page.tsx                      # Settings & export
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Global styles
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx          # Multi-step onboarding
│   │   ├── PersonalInfoStep.tsx
│   │   ├── HealthGoalsStep.tsx
│   │   ├── NutritionStep.tsx
│   │   ├── ReadingStep.tsx
│   │   ├── ScheduleStep.tsx
│   │   └── SummaryStep.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx             # Main chat component
│   │   ├── ManagerSelector.tsx           # Sidebar with 4 managers
│   │   ├── MessageList.tsx               # Message display
│   │   ├── MessageInput.tsx              # Input box with send
│   │   ├── ManagerConversationLog.tsx    # Expandable coordination log
│   │   └── TypingIndicator.tsx
│   ├── dashboard/
│   │   ├── DailyDashboard.tsx            # Main dashboard
│   │   ├── WorkoutCard.tsx               # Today's workout display
│   │   ├── MealsCard.tsx                 # Today's meals
│   │   ├── ReadingCard.tsx               # Today's reading goal
│   │   ├── AtlasMessageCard.tsx          # Morning message from Atlas
│   │   └── QuickStats.tsx                # Quick overview stats
│   ├── profile/
│   │   ├── ProfileDashboard.tsx          # Profile overview
│   │   ├── UserInfoCard.tsx
│   │   ├── MeasurementsCard.tsx
│   │   ├── GoalsOverview.tsx
│   │   ├── MeasurementForm.tsx           # Log measurements
│   │   └── ScheduleCalendar.tsx          # 2-week schedule view
│   ├── nutrition/
│   │   ├── NutritionDashboard.tsx        # Nutrition overview
│   │   ├── MacroBar.tsx                  # Progress bar for macros
│   │   ├── MicronutrientGrid.tsx         # Vitamin/mineral status
│   │   ├── OrganHealthCard.tsx           # Organ-specific health
│   │   ├── MealPlanningInterface.tsx     # 3-day meal plan
│   │   ├── MealCard.tsx                  # Individual meal display
│   │   ├── ShoppingList.tsx              # Shopping list component
│   │   └── MealSwapModal.tsx             # Meal swap dialog
│   ├── fitness/
│   │   ├── WorkoutPlanner.tsx            # Workout overview
│   │   ├── WorkoutCard.tsx               # Workout display
│   │   ├── WorkoutLogger.tsx             # Log workout completion
│   │   ├── ExerciseList.tsx              # List of exercises
│   │   ├── MuscleBalanceCard.tsx         # Muscle balance visualization
│   │   └── WorkoutHistory.tsx            # Past workouts
│   ├── reading/
│   │   ├── BookTracker.tsx               # Main reading component
│   │   ├── CurrentBookCard.tsx           # Current book display
│   │   ├── ReadingSessionLogger.tsx      # Log reading sessions
│   │   ├── BookList.tsx                  # Backlog display
│   │   ├── ReadingNotesModal.tsx         # Add/view notes
│   │   └── ReadingStreakCalendar.tsx     # Heatmap calendar
│   ├── analytics/
│   │   ├── AnalyticsDashboard.tsx        # Advanced analytics
│   │   ├── ProgressCharts.tsx            # Multi-metric line charts
│   │   ├── WorkoutHeatmap.tsx            # Intensity heatmap
│   │   ├── NutritionCompliance.tsx       # Compliance charts
│   │   ├── InsightCard.tsx               # AI-generated insights
│   │   └── StatCard.tsx                  # Reusable stat display
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   ├── ExportData.tsx                # Data export UI
│   │   ├── NotificationSettings.tsx
│   │   └── AccountSettings.tsx
│   └── ui/
│       ├── button.tsx                    # shadcn/ui button
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── dialog.tsx
│       ├── progress.tsx
│       ├── calendar.tsx
│       └── ...                           # Other shadcn components
├── lib/
│   ├── ai/
│   │   ├── atlas.ts                      # Atlas AI logic
│   │   ├── forge.ts                      # Forge AI logic
│   │   ├── olive.ts                      # Olive AI logic
│   │   ├── lexicon.ts                    # Lexicon AI logic
│   │   ├── conversation-manager.ts       # Conversation storage/retrieval
│   │   ├── embeddings.ts                 # Vector embedding functions
│   │   ├── context-builder.ts            # Build AI context from data
│   │   └── proactive-checks.ts           # Proactive message logic
│   ├── db/
│   │   ├── supabase.ts                   # Supabase client
│   │   ├── queries/
│   │   │   ├── users.ts                  # User queries
│   │   │   ├── measurements.ts           # Measurement queries
│   │   │   ├── meals.ts                  # Meal queries
│   │   │   ├── workouts.ts               # Workout queries
│   │   │   ├── books.ts                  # Book queries
│   │   │   ├── goals.ts                  # Goal queries
│   │   │   └── schedules.ts              # Schedule queries
│   │   └── mutations/
│   │       ├── create-user.ts
│   │       ├── log-measurement.ts
│   │       ├── commit-meal-plan.ts
│   │       └── ...                       # Other mutations
│   ├── nutrition/
│   │   ├── food-api.ts                   # Spoonacular/Edamam integration
│   │   ├── macro-calculator.ts           # Macro calculations
│   │   ├── shopping-list.ts              # Shopping list generation
│   │   └── deficiency-checker.ts         # Nutrient deficiency detection
│   ├── fitness/
│   │   ├── ideal-measurements.ts         # Calculate ideal body measurements
│   │   ├── muscle-balance.ts             # Muscle balance assessment
│   │   └── workout-generator.ts          # Workout generation logic
│   ├── reading/
│   │   ├── book-api.ts                   # Open Library/Google Books
│   │   ├── reading-speed.ts              # Calculate reading speed
│   │   └── streak-calculator.ts          # Reading streak logic
│   ├── scheduling/
│   │   ├── auto-reschedule.ts            # Auto-reschedule logic
│   │   ├── time-windows.ts               # Find available time windows
│   │   └── conflict-detector.ts          # Detect schedule conflicts
│   ├── goals/
│   │   ├── auto-adjust.ts                # Goal auto-adjustment
│   │   ├── progress-calculator.ts        # Calculate goal progress
│   │   └── milestone-detector.ts         # Detect milestone achievements
│   ├── email/
│   │   ├── resend-client.ts              # Resend email client
│   │   └── templates.tsx                 # Email templates
│   ├── export/
│   │   ├── data-export.ts                # Export functions
│   │   └── pdf-generator.ts              # PDF generation
│   ├── utils/
│   │   ├── date.ts                       # Date utilities
│   │   ├── timezone.ts                   # Timezone conversions
│   │   ├── format.ts                     # Formatting helpers
│   │   └── validators.ts                 # Validation functions
│   └── constants.ts                      # App-wide constants
├── types/
│   ├── user.ts                           # User type definitions
│   ├── measurement.ts                    # Measurement types
│   ├── meal.ts                           # Meal types
│   ├── workout.ts                        # Workout types
│   ├── book.ts                           # Book types
│   ├── goal.ts                           # Goal types
│   ├── schedule.ts                       # Schedule types
│   └── ai.ts                             # AI-related types
├── hooks/
│   ├── useChat.ts                        # Chat management hook
│   ├── useMeasurements.ts                # Measurements hook
│   ├── useWorkouts.ts                    # Workouts hook
│   ├── useMeals.ts                       # Meals hook
│   ├── useBooks.ts                       # Books hook
│   └── useUser.ts                        # User data hook
├── styles/
│   └── globals.css                       # Global styles
├── public/
│   ├── icon-192.png                      # PWA icon
│   ├── icon-512.png
│   └── manifest.json                     # PWA manifest
├── .env.local                            # Environment variables
├── next.config.js                        # Next.js config
├── tsconfig.json                         # TypeScript config
├── tailwind.config.js                    # Tailwind config
├── package.json
├── vercel.json                           # Vercel cron config
└── README.md                             # THIS FILE!
```


***

## **CODING BEST PRACTICES**

### **1. DRY (Don't Repeat Yourself)**

**Problem**: Repeating database queries across multiple files

**BAD**:

```typescript
// In meals.ts
const meals = await supabase.from('meals').select('*').eq('user_id', userId);

// In workouts.ts
const meals = await supabase.from('meals').select('*').eq('user_id', userId);

// In nutrition.ts
const meals = await supabase.from('meals').select('*').eq('user_id', userId);
```

**GOOD**: Create reusable query function

```typescript
// lib/db/queries/meals.ts
export async function getUserMeals(userId: string, options?: {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
}) {
  let query = supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId);
  
  if (options?.startDate) {
    query = query.gte('scheduled_date', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('scheduled_date', options.endDate);
  }
  if (options?.mealType) {
    query = query.eq('meal_type', options.mealType);
  }
  
  return await query;
}

// Usage everywhere
import { getUserMeals } from '@/lib/db/queries/meals';
const meals = await getUserMeals(userId, { startDate: yesterday });
```


***

### **2. Separation of Concerns**

**Principle**: Keep logic layers separate:

- **Components**: Only UI rendering and user interactions
- **Hooks**: State management and data fetching
- **API Routes**: HTTP handling and validation
- **Lib functions**: Business logic
- **DB queries**: Database operations

**EXAMPLE**: Logging a workout

**BAD** (everything in component):

```typescript
// components/fitness/WorkoutLogger.tsx
function WorkoutLogger() {
  async function handleComplete() {
    // ❌ Database logic in component
    await supabase.from('workout_plans').update({ completed: true }).eq('id', workoutId);
    
    // ❌ AI logic in component
    const response = await fetch('/api/ai/forge', {
      method: 'POST',
      body: JSON.stringify({ message: 'Workout completed' })
    });
  }
  
  return <button onClick={handleComplete}>Complete</button>;
}
```

**GOOD** (separated layers):

```typescript
// lib/db/mutations/workouts.ts
export async function completeWorkout(workoutId: string, feedback: string) {
  const { data } = await supabase
    .from('workout_plans')
    .update({ completed: true, user_feedback: feedback })
    .eq('id', workoutId)
    .select()
    .single();
  
  return data;
}

// lib/ai/forge.ts
export async function notifyForgeWorkoutComplete(userId: string, workout: Workout) {
  await saveMessage({
    userId,
    manager: 'forge',
    role: 'system',
    content: `Workout completed: ${workout.workout_type}. User feedback: ${workout.user_feedback}`
  });
}

// hooks/useWorkouts.ts
export function useWorkouts(userId: string) {
  const completeWorkoutMutation = useMutation({
    mutationFn: async ({ workoutId, feedback }: CompleteWorkoutParams) => {
      const workout = await completeWorkout(workoutId, feedback);
      await notifyForgeWorkoutComplete(userId, workout);
      return workout;
    }
  });
  
  return { completeWorkout: completeWorkoutMutation };
}

// components/fitness/WorkoutLogger.tsx
function WorkoutLogger() {
  const { completeWorkout } = useWorkouts(userId);
  
  async function handleComplete() {
    await completeWorkout.mutateAsync({ workoutId, feedback });
  }
  
  return <button onClick={handleComplete}>Complete</button>;
}
```

**Benefits**:

- ✅ Component is simple and focused on UI
- ✅ Database logic is reusable across app
- ✅ AI logic is centralized
- ✅ Easy to test each layer independently
- ✅ Easy to change implementation (switch from Supabase to different DB)

***

### **3. TypeScript Strict Mode**

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Define clear types**:

```typescript
// types/meal.ts
export interface Meal {
  id: string;
  user_id: string;
  meal_plan_id: string;
  meal_type: MealType;
  scheduled_date: string;
  scheduled_time: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  logged_at: string | null;
  actually_eaten: boolean;
  user_rating: number | null;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface CreateMealParams {
  user_id: string;
  meal_plan_id: string;
  meal_type: MealType;
  scheduled_date: string;
  scheduled_time: string;
  name: string;
  ingredients: Ingredient[];
  // ... other required fields
}

// Function signature with types
export async function createMeal(params: CreateMealParams): Promise<Meal> {
  const { data, error } = await supabase
    .from('meals')
    .insert(params)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data as Meal;
}
```

**Benefits**:

- ✅ Catch errors at compile-time, not runtime
- ✅ Auto-complete in IDE
- ✅ Self-documenting code
- ✅ Easier refactoring

***

### **4. Error Handling**

**Pattern**: Consistent error handling across app

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// API route error handler
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  return Response.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

// Usage in API route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw new ValidationError('userId is required');
    }
    
    const meals = await getUserMeals(userId);
    
    if (!meals || meals.length === 0) {
      throw new NotFoundError('Meals');
    }
    
    return Response.json(meals);
  } catch (error) {
    return handleApiError(error);
  }
}
```


***

### **5. Reusable Component Patterns**

**Create composable, reusable components**:

```typescript
// components/ui/stat-card.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  percentage?: number;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, unit, trend, percentage, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        {trend && percentage && (
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {percentage}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Usage
<StatCard 
  title="Weight" 
  value={78.5} 
  unit="kg" 
  trend="down" 
  percentage={3.2}
  icon={<ScaleIcon />}
/>
```


***

### **6. Custom Hooks for Data Fetching**

**Pattern**: Use React Query (TanStack Query) for server state

```typescript
// hooks/useMeals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMeals(userId: string, date?: Date) {
  return useQuery({
    queryKey: ['meals', userId, date],
    queryFn: async () => {
      const response = await fetch(`/api/meals?userId=${userId}&date=${date?.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch meals');
      return response.json() as Promise<Meal[]>;
    }
  });
}

export function useLogMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: LogMealParams) => {
      const response = await fetch('/api/meals/log', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate meals query to refetch
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    }
  });
}

// Component usage
function MealCard({ meal }: { meal: Meal }) {
  const { mutate: logMeal, isPending } = useLogMeal();
  
  return (
    <Card>
      <h3>{meal.name}</h3>
      <button 
        onClick={() => logMeal({ mealId: meal.id, eaten: true })}
        disabled={isPending}
      >
        {isPending ? 'Logging...' : 'Log as Eaten'}
      </button>
    </Card>
  );
}
```


***

### **7. Environment Variables**

**.env.local**:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=...
MOONSHOT_API_KEY=...

# External APIs
SPOONACULAR_API_KEY=...
EDAMAM_APP_ID=...
EDAMAM_APP_KEY=...

# Email
RESEND_API_KEY=re_...

# Cron Security
CRON_SECRET=your-random-secret

# App URL
NEXT_PUBLIC_APP_URL=https://supermentor.app
```

**Usage**:

```typescript
// lib/ai/atlas.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // ✅ Server-side only
});

// components/chat/ChatInterface.tsx
const appUrl = process.env.NEXT_PUBLIC_APP_URL; // ✅ Available client-side
```


***

## **API ROUTE ORGANIZATION**

### **Consistent API Route Pattern**

**Example**: `/app/api/meals/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { handleApiError, ValidationError } from '@/lib/utils/errors';
import { getUserMeals, createMeal } from '@/lib/db/queries/meals';

// GET /api/meals?userId=xxx&date=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const dateStr = searchParams.get('date');
    
    if (!userId) {
      throw new ValidationError('userId is required');
    }
    
    const date = dateStr ? new Date(dateStr) : undefined;
    const meals = await getUserMeals(userId, { date });
    
    return Response.json(meals);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/meals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate
    if (!body.user_id || !body.name || !body.meal_type) {
      throw new ValidationError('Missing required fields');
    }
    
    const meal = await createMeal(body);
    
    return Response.json(meal, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```


***

## **DEPLOYMENT CHECKLIST**

### **1. Pre-Deployment**

**Environment Setup**:

```bash
# Vercel Environment Variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add MOONSHOT_API_KEY
vercel env add SPOONACULAR_API_KEY
vercel env add EDAMAM_APP_ID
vercel env add EDAMAM_APP_KEY
vercel env add RESEND_API_KEY
vercel env add CRON_SECRET
```

**Database Setup**:

```sql
-- Run in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create all tables (from Part 2 schema)
-- ... (users, goals, measurements, conversations, embeddings, etc.)

-- Create vector similarity search function (from Phase 2)
CREATE FUNCTION match_embeddings(...);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_manager ON conversations(user_id, manager);
CREATE INDEX idx_measurements_user_date ON measurements(user_id, measured_at DESC);
CREATE INDEX idx_meals_user_date ON meals(user_id, scheduled_date);
CREATE INDEX idx_workouts_user_date ON workout_plans(user_id, scheduled_date);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
-- ... enable for all user-specific tables

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ... create policies for all tables
```


***

### **2. Vercel Deployment**

**Install Vercel CLI**:

```bash
npm install -g vercel
```

**Deploy**:

```bash
# Login
vercel login

# Deploy to production
vercel --prod

# Set up cron jobs
# (Already configured in vercel.json)
```

**Verify Cron Jobs**:

- Go to Vercel Dashboard → Project → Settings → Cron Jobs
- Verify:
    - `/api/cron/daily-planning` runs at 6:00 AM UTC daily
    - `/api/cron/proactive-checks` runs every 30 minutes
    - `/api/cron/send-emails` runs every 15 minutes

***

### **3. Post-Deployment Verification**

**Test Checklist**:

- [ ] Onboarding flow works
- [ ] Chat with all 4 managers
- [ ] Daily plan generated correctly (check at 6 AM)
- [ ] Measurements logging
- [ ] Meal plan creation \& swapping
- [ ] Workout logging
- [ ] Book tracking
- [ ] Email notifications sent
- [ ] Proactive check-ins trigger
- [ ] Data export works
- [ ] Charts render correctly

**Monitor**:

```bash
# Check Vercel logs
vercel logs

# Monitor Supabase
# Go to Supabase Dashboard → Logs → API logs

# Monitor AI API usage
# OpenAI Dashboard → Usage
# DeepSeek Dashboard → Usage
# Moonshot Dashboard → Usage
```


***

## **TESTING STRATEGY**

### **Unit Tests** (Jest + React Testing Library)

```typescript
// __tests__/lib/goals/progress-calculator.test.ts
import { calculateProgress } from '@/lib/goals/progress-calculator';

describe('calculateProgress', () => {
  it('should calculate progress correctly', () => {
    const goal = {
      starting_measurements: { belly_cm: 100 },
      target_measurements: { belly: 88 }
    };
    const current = { belly_cm: 94 };
    
    const progress = calculateProgress(goal, current);
    
    expect(progress).toBe(50); // 6cm out of 12cm = 50%
  });
});
```


### **Integration Tests** (Playwright)

```typescript
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('complete onboarding flow', async ({ page }) => {
  await page.goto('/onboarding');
  
  // Step 1: Personal Info
  await page.fill('[name="age"]', '30');
  await page.fill('[name="height"]', '180');
  await page.fill('[name="weight"]', '82');
  await page.click('button:has-text("Next")');
  
  // Step 2: Goals
  await page.check('text=Lose belly fat');
  await page.check('text=Build muscle');
  await page.click('button:has-text("Next")');
  
  // ... continue through all steps
  
  // Final step
  await page.click('button:has-text("Complete Onboarding")');
  
  await expect(page).toHaveURL('/dashboard');
});
```


***

## **PERFORMANCE OPTIMIZATION**

### **1. Database Query Optimization**

```typescript
// ❌ BAD: N+1 query problem
async function getDailyPlanWithMeals(planId: string) {
  const plan = await supabase.from('daily_plans').select('*').eq('id', planId).single();
  
  // This runs a separate query for EACH meal
  for (const mealId of plan.meal_ids) {
    const meal = await supabase.from('meals').select('*').eq('id', mealId).single();
    plan.meals.push(meal.data);
  }
  
  return plan;
}

// ✅ GOOD: Single query with join
async function getDailyPlanWithMeals(planId: string) {
  const { data } = await supabase
    .from('daily_plans')
    .select(`
      *,
      meals:meal_plan_id (*)
    `)
    .eq('id', planId)
    .single();
  
  return data;
}
```


***

### **2. React Performance**

```typescript
// Use React.memo for expensive components
export const MealCard = React.memo(function MealCard({ meal }: MealCardProps) {
  return (
    <Card>
      <h3>{meal.name}</h3>
      <p>{meal.calories} cal</p>
    </Card>
  );
});

// Use useMemo for expensive calculations
function ProgressChart({ measurements }: { measurements: Measurement[] }) {
  const chartData = useMemo(() => {
    return measurements.map(m => ({
      date: m.measured_at,
      weight: m.weight_kg,
      belly: m.belly_cm
    }));
  }, [measurements]);
  
  return <LineChart data={chartData} />;
}

// Use useCallback for event handlers passed to child components
function DashboardPage() {
  const handleMealLog = useCallback((mealId: string) => {
    logMeal(mealId);
  }, []);
  
  return <MealCard onLog={handleMealLog} />;
}
```


***

### **3. Image Optimization**

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image 
  src="/profile-photo.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority // for above-the-fold images
/>
```


***

## **FINAL IMPLEMENTATION NOTES**

### **Phase 1 Priority (Build First)**

Focus on getting these working end-to-end:

1. ✅ Onboarding wizard
2. ✅ 4-manager chat system
3. ✅ Basic profile \& measurements
4. ✅ Daily planning (6 AM cron)
5. ✅ Simple dashboard showing today's plan

**Estimate**: 2-3 weeks of focused development

### **Iterate \& Add Features**

Once Phase 1 is stable:

- Add Phase 2 features (semantic search, proactive checks)
- Then Phase 3 (food APIs, charts)
- Then Phase 4 (notifications, auto-adjustments)
- Then Phase 5+ (analytics, PWA)


### **AI Model Costs (Monthly Estimate)**

**Assumptions**: 1 active user, 50 messages/day

**Atlas (GPT-5.2)**:

- ~500K tokens/month (input + output)
- Cost: ~\$15-20/month

**Forge (DeepSeek-V3.1)**:

- ~300K tokens/month
- Cost: ~\$0.50/month

**Olive (Kimi K2-0905)**:

- ~400K tokens/month
- Cost: ~\$2/month

**Lexicon (Kimi K2-0905)**:

- ~300K tokens/month
- Cost: ~\$1.50/month

**Embeddings (OpenAI)**:

- ~100K tokens/month
- Cost: ~\$0.10/month

**Total AI Cost**: ~\$20-25/month per active user

**Scaling**: With 100 users = \$2,000-2,500/month AI costs

***

## **SUCCESS METRICS**

Track these KPIs:

- **User Engagement**: Daily active users, messages per day
- **Goal Achievement**: % of users hitting milestones
- **Completion Rates**: Workouts logged, meals tracked, reading sessions
- **Retention**: 7-day, 30-day, 90-day retention
- **Manager Utilization**: Which managers are used most
- **Satisfaction**: User ratings, feedback sentiment

***

## **CONCLUSION**

**You now have a complete, production-ready blueprint for Super Mentor!**

**This README includes**:
✅ Complete architecture (4-manager multi-agent system)
✅ Full database schema (20+ tables)
✅ Detailed feature specifications (Phases 1-6)
✅ AI system prompts (Atlas, Forge, Olive, Lexicon)
✅ Complete file structure (100+ files organized)
✅ Coding best practices (DRY, separation of concerns, TypeScript)
✅ Deployment guide (Vercel + Supabase)
✅ Testing strategy
✅ Performance optimization tips
✅ Cost estimates

**Next Steps**:

1. Save this README to your project root
2. Share with your AI coding assistant (Claude, Cursor, etc.)
3. Start with Phase 1 MVP
4. Iterate and add features progressively
5. Deploy to Vercel when Phase 1 is stable

**Good luck building Super Mentor!** 🚀

This will be an incredible, transformative app for helping you (and future users) achieve holistic health and wellness goals. The multi-agent AI architecture is cutting-edge, the integration of fitness, nutrition, and reading is unique, and the level of personalization will feel truly human.

***

**END OF COMPLETE README** ✅
