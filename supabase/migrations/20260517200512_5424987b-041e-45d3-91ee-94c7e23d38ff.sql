-- Radio Programming Table
CREATE TABLE public.programming (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    host TEXT NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Song Requests Table
CREATE TABLE public.song_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, played, rejected
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prayer Requests Table
CREATE TABLE public.prayer_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, archived
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prayer Comments Table
CREATE TABLE public.prayer_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_request_id UUID REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Programming is viewable by everyone" ON public.programming FOR SELECT USING (true);
CREATE POLICY "Anyone can create song requests" ON public.song_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Approved prayer requests are public" ON public.prayer_requests FOR SELECT USING (status = 'approved' AND is_private = false);
CREATE POLICY "Anyone can view comments" ON public.prayer_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.prayer_comments FOR INSERT WITH CHECK (true);
