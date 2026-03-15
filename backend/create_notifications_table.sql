-- ============================================================
-- Tạo bảng notifications
-- Chạy script này trong Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN (
                    'property_approved',
                    'property_rejected',
                    'property_expiring',
                    'new_contact',
                    'system'
                )),
    title               TEXT NOT NULL,
    message             TEXT NOT NULL,
    property_id         UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    property_title      TEXT,
    rejection_reason    TEXT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để truy vấn nhanh theo user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created  ON public.notifications (user_id, created_at DESC);

-- Row Level Security: mỗi user chỉ đọc được thông báo của chính họ
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Cho phép backend service role bypass RLS (service_role key)
-- (các API call từ backend dùng supabase service key nên KHÔNG bị RLS chặn)

-- Policy cho anon/authenticated nếu cần đọc trực tiếp từ client:
CREATE POLICY "Users see own notifications"
    ON public.notifications FOR SELECT
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Service role can manage notifications"
    ON public.notifications FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Kiểm tra bảng đã tạo chưa (optional)
-- ============================================================
-- SELECT * FROM public.notifications LIMIT 5;
