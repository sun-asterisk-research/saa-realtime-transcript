# Google OAuth Setup Guide

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Chọn Application type: **Web application**
6. Cấu hình:
   - **Name**: Soniox Translation App
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (local dev)
     - `http://127.0.0.1:54321` (Supabase local)
   - **Authorized redirect URIs**:
     - `http://127.0.0.1:54321/auth/v1/callback` (Supabase local)
     - Nếu production: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

7. Lưu **Client ID** và **Client Secret**

## Bước 2: Cấu hình Supabase Local

1. Mở file `supabase/config.toml`
2. Thêm Google provider config:

```toml
[auth.external.google]
enabled = true
client_id = "YOUR_GOOGLE_CLIENT_ID"
secret = "YOUR_GOOGLE_CLIENT_SECRET"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

3. Restart Supabase:
```bash
npx supabase stop
npx supabase start
```

## Bước 3: Test OAuth Flow

1. Truy cập `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Chọn Google account
4. Redirect về app và tự động đăng nhập

## Environment Variables

Thêm vào `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from npx supabase status>
```

## Production Setup (Supabase Cloud)

1. Vào Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Nhập Client ID và Secret từ Google Console
4. Update Google Console với production callback URL:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
