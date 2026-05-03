# Zeo — AI Agent for Building Web Apps
## Complete Setup Guide

**Zeo** is a modern AI agent platform for designing, planning, and shipping web applications. This project consists of:

- **Frontend**: Next.js React app (deployed on Vercel at `https://zekron.codes`)
- **Backend**: PHP 8.1+ REST API (deployed on Linux server at `https://agent.zekron.codes`)
- **Database**: MySQL/MariaDB (on backend server)

---

## 🚀 Quick Start

### Backend Setup (PHP)

#### 1. Prerequisites
- PHP 8.1+ with extensions: `pdo_mysql`, `curl`, `openssl`, `json`
- MySQL 8.0+ or MariaDB 10.4+
- Linux/Unix server (supports Apache or Nginx)

#### 2. Database Setup
```bash
# Connect to your MySQL server
mysql -u root -p

# Create database and user
CREATE DATABASE zekron_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zekron'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON zekron_agent.* TO 'zekron'@'localhost';
FLUSH PRIVILEGES;

# Import schema
USE zekron_agent;
SOURCE schema.sql;
```

#### 3. Environment Configuration
```bash
# Copy .env.example to .env
cp backend/.env.example backend/.env

# Edit and fill in real values
nano backend/.env
```

**Required environment variables:**
```ini
APP_ENV=production
APP_DEBUG=0
APP_URL=https://agent.zekron.codes
FRONTEND_URL=https://zekron.codes

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=zekron_agent
DB_USER=zekron
DB_PASSWORD=your-strong-password

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your-32-char-random-string
JWT_TTL_HOURS=720
APP_KEY=another-32-char-random-string

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://agent.zekron.codes/api/auth/google/callback

# Anthropic (fallback, also manageable via admin panel)
ANTHROPIC_API_KEY=sk-ant-...

# CORS
CORS_ALLOWED_ORIGINS=https://zekron.codes,https://www.zekron.codes,http://localhost:3000
```

#### 4. Web Server Configuration

**For Apache:**
```bash
# Enable mod_rewrite
a2enmod rewrite

# Point DocumentRoot to /backend/public
# The .htaccess file handles routing automatically
```

**For Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name agent.zekron.codes;
    
    root /var/www/zekron/backend/public;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

#### 5. Test Backend
```bash
# Health check
curl https://agent.zekron.codes/api/health
# Should return: {"ok":true}
```

---

### Frontend Setup (Next.js)

#### 1. Prerequisites
- Node.js 18+ and npm/pnpm/yarn

#### 2. Installation
```bash
cd /path/to/frontend
pnpm install  # or npm install
```

#### 3. Environment Configuration
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit if needed (optional, defaults should work)
nano .env.local
```

**Key environment variable:**
```
NEXT_PUBLIC_BACKEND_URL=https://agent.zekron.codes
```

#### 4. Development
```bash
# Start dev server (http://localhost:3000)
pnpm dev

# In another terminal, seed initial data (optional)
curl -X POST https://agent.zekron.codes/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"12345678","name":"Your Name"}'
```

#### 5. Production Build & Deploy to Vercel
```bash
# Build locally to test
pnpm build
pnpm start

# Or push to git and Vercel will auto-deploy
git push origin main
```

---

## 🔐 Authentication

### Email + Password
1. User registers: `POST /api/auth/register`
2. System returns JWT token (valid 30 days)
3. Token stored in localStorage
4. Sent in `Authorization: Bearer {token}` header

### Google OAuth
1. User clicks "Sign in with Google"
2. Redirected to: `GET /api/auth/google`
3. Google redirects back to callback with code
4. Backend exchanges code for profile → creates/updates user
5. Frontend receives token in URL: `?token=...`
6. Token stored and user logged in

---

## 💰 Billing & Subscriptions

### User Balance System
- Users have a `balance_usd` account balance
- Each AI completion deducts cost from balance
- Cost = (input_tokens / 1M) × input_price + (output_tokens / 1M) × output_price
- Admins can add credits via admin panel
- Plans provide monthly credit allocation

### Subscription Plans (Free, Pro, Team)
- Free: 2.00 USD/month, 50 messages/month
- Pro: 20.00 USD/month, 2000 messages/month, $25 credit
- Team: 80.00 USD/month, 10000 messages/month, $120 credit

---

## 🤖 AI Models

### Adding a Model
1. Go to Admin Panel → Models
2. Click "New Model"
3. Fill in:
   - Display Name: "Zeo 1" (what users see)
   - Provider Model: "claude-opus-4-20250514" (actual model)
   - Made By: "Claude"
   - Input Price: 0.000015 per million tokens
   - Output Price: 0.000075 per million tokens
4. Save

### Model Pricing
Prices set in the admin panel apply when:
- Users send a message
- Cost calculated and deducted from balance
- Logged to `usage_logs` table

---

## 🔑 API Keys Management

### Adding Provider API Keys
1. Go to Admin Panel → API Keys
2. Click "Add Key"
3. Select provider (Anthropic)
4. Enter label and API key
5. Save (encrypted at rest with AES-256-GCM)

### How It Works
- When user sends a message, backend retrieves active API key
- Key decrypted and used for provider API call
- Can rotate keys without downtime
- Fallback to environment variable if no key in DB

---

## 📊 Admin Panel Features

### Dashboard
- Real-time stats (users, chats, revenue, token usage)
- Quick overview of system health

### Users Management
- List all users
- Promote/demote to admin
- Adjust user balance
- Disable/enable accounts

### Models Management
- Add/edit/delete AI models
- Set pricing per token
- Control visibility and defaults
- Manage model logos and branding

### API Keys
- Store provider keys securely
- Rotate keys without downtime
- Track last usage

### Subscription Plans
- Define plan tiers
- Set pricing and credit allocation
- Features list

### Usage Logs
- Track every AI call
- Monitor costs and token usage
- Filter by user
- Debug failed requests

### Settings
- Customize app name, tagline
- Enable/disable features
- Set URLs for frontend/backend

---

## 🧪 Testing

### Test Registration
```bash
curl -X POST https://agent.zekron.codes/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@zekron.codes",
    "password":"TestPass123",
    "name":"Test User"
  }'
```

### Test Chat Message
```bash
curl -X POST https://agent.zekron.codes/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model_id": 1,
    "messages": [
      {"role": "user", "content": "Hello, build me a React component for a todo app."}
    ]
  }'
```

---

## 🐛 Troubleshooting

### "Cannot reach backend"
- Check backend URL in .env.local
- Verify CORS_ALLOWED_ORIGINS includes frontend URL
- Check backend is running and accessible

### "Database connection failed"
- Verify DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in backend/.env
- Ensure MySQL is running
- Check user permissions: `SHOW GRANTS FOR 'zekron'@'localhost';`

### "No active models configured"
- Admin must add at least one model via Admin Panel
- Check `ai_models` table: `SELECT * FROM ai_models WHERE is_active = 1;`

### "No active API key configured"
- Add Anthropic API key via Admin Panel or set ANTHROPIC_API_KEY

### JWT token expired
- Default TTL is 720 hours (30 days), configurable via JWT_TTL_HOURS

---

## 📁 Project Structure

```
.
├── app/                           # Next.js app directory
│   ├── chat/                      # Chat interface
│   ├── admin/                     # Admin panel (protected)
│   ├── (auth)/                    # Auth pages (login, register, Google callback)
│   ├── oauth/callback/            # Google OAuth callback
│   └── layout.tsx & page.tsx      # Root layout and home redirect
├── components/
│   ├── chat/                      # Chat UI components
│   ├── ui/                        # Headless UI components (Radix UI)
│   └── brand.tsx                  # Logo and branding
├── lib/
│   ├── auth.tsx                   # Auth context and hooks
│   ├── api.ts                     # API client
│   ├── hooks.ts                   # SWR data fetching hooks
│   ├── types.ts                   # TypeScript types
│   └── utils.ts                   # Utility functions
├── public/                        # Static assets
└── backend/
    ├── public/
    │   └── index.php              # Front controller
    ├── src/
    │   ├── bootstrap.php          # Initialization
    │   ├── routes.php             # API routes
    │   ├── Controllers/           # Request handlers
    │   ├── Services/              # Business logic (Anthropic, Google OAuth)
    │   ├── Database/              # DB connection and queries
    │   ├── Http/                  # HTTP utilities (Router, Request, Response, CORS)
    │   ├── Security/              # JWT, Crypto
    │   └── Support/               # Helpers (Env)
    ├── schema.sql                 # Database schema
    ├── .env.example               # Environment template
    └── README.md                  # Backend docs
```

---

## 🔄 Deployment Checklist

- [ ] Backend .env configured with production values
- [ ] Database migrated and seeded
- [ ] SSL certificate configured (Let's Encrypt)
- [ ] Google OAuth credentials created
- [ ] Anthropic API key obtained
- [ ] Initial admin user created
- [ ] Frontend .env.local updated with backend URL
- [ ] Frontend built and deployed to Vercel
- [ ] Email domain configured (if sending emails)
- [ ] Backups configured for database
- [ ] Monitoring set up for errors and performance

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `tail -f /var/log/php-fpm.log`
3. Check database: `SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10;`
4. Verify environment variables are loaded

---

## 📄 License

Copyright © 2024 ZekronAI. All rights reserved.
