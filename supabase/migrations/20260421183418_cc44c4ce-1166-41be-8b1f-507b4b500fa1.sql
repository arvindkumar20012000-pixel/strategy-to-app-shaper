
-- ============ USER STREAKS ============
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  daily_goal INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streak" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- ============ ACHIEVEMENTS CATALOG ============
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Award',
  criteria_type TEXT NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed achievements
INSERT INTO public.achievements (key, title, description, icon, criteria_type, threshold, display_order) VALUES
  ('first_test', 'First Steps', 'Complete your first test', 'Footprints', 'tests_count', 1, 1),
  ('ten_tests', 'Test Taker', 'Complete 10 tests', 'Target', 'tests_count', 10, 2),
  ('fifty_tests', 'Test Master', 'Complete 50 tests', 'Trophy', 'tests_count', 50, 3),
  ('perfect_score', 'Perfectionist', 'Score 100% on any test', 'Star', 'perfect_score', 1, 4),
  ('streak_3', 'Getting Warm', 'Maintain a 3-day streak', 'Flame', 'streak', 3, 5),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak', 7, 6),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', 'Zap', 'streak', 30, 7),
  ('first_referral', 'Influencer', 'Refer your first friend', 'UserPlus', 'referrals', 1, 8),
  ('five_referrals', 'Ambassador', 'Refer 5 friends successfully', 'Users', 'referrals', 5, 9),
  ('bookmark_collector', 'Collector', 'Bookmark 10 articles', 'Bookmark', 'bookmarks', 10, 10),
  ('early_bird', 'Early Bird', 'Take a test before 7 AM', 'Sunrise', 'time_morning', 1, 11),
  ('night_owl', 'Night Owl', 'Take a test after 11 PM', 'Moon', 'time_night', 1, 12);

-- ============ USER ACHIEVEMENTS ============
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ LEADERBOARD FUNCTION ============
CREATE OR REPLACE FUNCTION public.get_leaderboard(_period TEXT DEFAULT 'all')
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_score BIGINT,
  tests_taken BIGINT,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since TIMESTAMPTZ;
BEGIN
  IF _period = 'today' THEN
    _since := CURRENT_DATE;
  ELSIF _period = 'week' THEN
    _since := CURRENT_DATE - INTERVAL '7 days';
  ELSE
    _since := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(p.full_name, split_part(p.email, '@', 1), 'Anonymous') AS full_name,
    p.avatar_url,
    COALESCE(SUM(ta.score), 0)::BIGINT AS total_score,
    COUNT(ta.id)::BIGINT AS tests_taken,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ta.score), 0) DESC, COUNT(ta.id) DESC)::BIGINT AS rank
  FROM public.profiles p
  INNER JOIN public.test_attempts ta ON ta.user_id = p.id AND ta.completed_at IS NOT NULL AND ta.completed_at >= _since
  GROUP BY p.id, p.full_name, p.email, p.avatar_url
  ORDER BY total_score DESC, tests_taken DESC
  LIMIT 100;
END;
$$;

-- ============ STREAK UPDATE FUNCTION ============
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last DATE;
  _current INTEGER;
  _longest INTEGER;
BEGIN
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
  VALUES (NEW.user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_active_date, current_streak, longest_streak
    INTO _last, _current, _longest
  FROM public.user_streaks WHERE user_id = NEW.user_id;

  IF _last = CURRENT_DATE THEN
    RETURN NEW;
  ELSIF _last = CURRENT_DATE - 1 THEN
    _current := _current + 1;
  ELSE
    _current := 1;
  END IF;

  IF _current > _longest THEN
    _longest := _current;
  END IF;

  UPDATE public.user_streaks
  SET current_streak = _current,
      longest_streak = _longest,
      last_active_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- ============ REFERRAL BONUS FUNCTION ============
CREATE OR REPLACE FUNCTION public.award_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ref RECORD;
  _is_first BOOLEAN;
BEGIN
  SELECT COUNT(*) = 1 INTO _is_first
  FROM public.test_attempts
  WHERE user_id = NEW.user_id AND completed_at IS NOT NULL;

  IF NOT _is_first THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _ref FROM public.referrals
  WHERE referred_id = NEW.user_id AND status = 'pending'
  LIMIT 1;

  IF _ref.id IS NOT NULL THEN
    UPDATE public.referrals SET status = 'completed' WHERE id = _ref.id;
    UPDATE public.wallets
    SET balance = balance + COALESCE(_ref.bonus_amount, 10),
        updated_at = now()
    WHERE user_id = _ref.referrer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============ ACHIEVEMENT CHECKER FUNCTION ============
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tests_count INTEGER;
  _streak INTEGER;
  _refs INTEGER;
  _bookmarks INTEGER;
  _hour INTEGER;
  _ach RECORD;
BEGIN
  SELECT COUNT(*) INTO _tests_count FROM public.test_attempts
    WHERE user_id = NEW.user_id AND completed_at IS NOT NULL;
  SELECT COALESCE(current_streak, 0) INTO _streak FROM public.user_streaks WHERE user_id = NEW.user_id;
  SELECT COUNT(*) INTO _refs FROM public.referrals WHERE referrer_id = NEW.user_id AND status = 'completed';
  SELECT COUNT(*) INTO _bookmarks FROM public.bookmarks WHERE user_id = NEW.user_id;
  _hour := EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Kolkata');

  FOR _ach IN SELECT * FROM public.achievements LOOP
    IF (_ach.criteria_type = 'tests_count' AND _tests_count >= _ach.threshold)
       OR (_ach.criteria_type = 'streak' AND _streak >= _ach.threshold)
       OR (_ach.criteria_type = 'referrals' AND _refs >= _ach.threshold)
       OR (_ach.criteria_type = 'bookmarks' AND _bookmarks >= _ach.threshold)
       OR (_ach.criteria_type = 'perfect_score' AND NEW.total_questions > 0 AND NEW.correct_answers = NEW.total_questions)
       OR (_ach.criteria_type = 'time_morning' AND _hour < 7)
       OR (_ach.criteria_type = 'time_night' AND _hour >= 23)
    THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, _ach.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============ TRIGGERS ON test_attempts ============
CREATE TRIGGER trg_streak_on_test
  AFTER INSERT OR UPDATE ON public.test_attempts
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION public.update_user_streak();

CREATE TRIGGER trg_referral_bonus
  AFTER INSERT OR UPDATE ON public.test_attempts
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION public.award_referral_bonus();

CREATE TRIGGER trg_check_achievements
  AFTER INSERT OR UPDATE ON public.test_attempts
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION public.check_achievements();

-- Allow users to insert their own referrals (signup flow)
CREATE POLICY "Users insert own referral row" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id OR auth.uid() = referrer_id);
