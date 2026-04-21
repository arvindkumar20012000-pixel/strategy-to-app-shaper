

## Add 6 New Features (No AI)

I'll integrate six fully-functional features that fill real gaps in the app, all reusing existing tables where possible.

### 1. Referral Program (uses existing `referrals` + `wallets` tables)
A new **`/refer`** page accessible from the side drawer:
- Auto-generates the user's unique referral code on first visit (via `generate_referral_code` DB function — already exists)
- Shows shareable link: `https://<app>/auth?ref=CODE` with copy + native share
- Lists referred friends with status (pending / completed) and ₹ bonus earned
- On signup (in `Auth.tsx`), if `?ref=CODE` is present, insert a row into `referrals` linking referrer ↔ new user
- Once the referred user completes their first mock test, mark referral `completed` and credit ₹10 to the referrer's wallet (via DB trigger on `test_attempts`)

### 2. Leaderboard (`/leaderboard`)
Public rank board built from `test_attempts`:
- Tabs: **Today / This Week / All-Time**
- Ranked by total score / tests taken
- Highlights current user's row
- Top 3 get gold/silver/bronze styling
- Requires a `SECURITY DEFINER` function `get_leaderboard(period)` so users can see aggregated scores of others without exposing private rows

### 3. Daily Streak & Study Goal Tracker
- New table `user_streaks` (user_id, current_streak, longest_streak, last_active_date, daily_goal)
- Auto-increments when user completes a test or reads ≥3 articles in a day
- Streak card on **Profile** page with flame icon + "X day streak"
- Daily goal progress bar on **Home** page header (e.g. "2/5 articles today")

### 4. Performance Analytics Dashboard (`/analytics`)
Visual breakdown built from existing `test_attempts` + `user_answers` + `questions`:
- Score-over-time line chart (recharts — already installed)
- Subject-wise accuracy bar chart
- Strong/weak topics list
- Total time studied
- Linked from Profile → "View Detailed Analytics"

### 5. Achievements / Badges
- New table `achievements` (key, title, description, icon, criteria_type, threshold) seeded with ~12 badges:
  - First Test, 10 Tests, 50 Tests, Perfect Score, 7-Day Streak, 30-Day Streak, First Referral, 5 Referrals, Bookmark Collector, Subject Master (per subject), Early Bird, Night Owl
- New table `user_achievements` (user_id, achievement_id, earned_at)
- Trigger after `test_attempts` insert and `user_streaks` update awards matching badges
- Achievements grid section on Profile page with locked/unlocked state and toast on unlock

### 6. Global Search (`/search`)
Single search box (already in Header) routes to a unified results page:
- Searches across articles, NCERT chapters, previous papers, mock tests
- Grouped tabs per content type with deep-links to each
- Replaces the current filter-only behavior (Home search keeps working as before)

### Side Drawer Updates
Add menu entries: **Refer & Earn**, **Leaderboard**, **Analytics**, **Achievements**.

### Database Changes (one migration)
```text
- table user_streaks
- table achievements (seeded)
- table user_achievements
- function get_leaderboard(period text) returns table(...)
- function award_referral_bonus()  + trigger on test_attempts
- function update_user_streak()    + trigger on test_attempts
- function check_achievements()    + trigger on test_attempts and user_achievements
- RLS: users read own streak/achievements; everyone reads achievements catalog; leaderboard via SECURITY DEFINER fn only
```

### Files to Create
- `src/pages/Referrals.tsx`
- `src/pages/Leaderboard.tsx`
- `src/pages/Analytics.tsx`
- `src/pages/Achievements.tsx`
- `src/pages/SearchResults.tsx`
- `src/components/StreakBadge.tsx`
- `src/components/DailyGoalProgress.tsx`

### Files to Modify
- `src/App.tsx` — add 5 new routes
- `src/components/SideDrawer.tsx` — add 4 menu entries
- `src/pages/Auth.tsx` — capture `?ref=` on signup
- `src/pages/Profile.tsx` — embed Streak + Achievements preview + Analytics link
- `src/pages/Index.tsx` — show Daily Goal progress
- `src/components/Header.tsx` — global search submits to `/search?q=`

### Out of Scope
No AI features (per request). No push notifications (browser permission UX). No payments changes.

