# 🚀 Zeo — AI Agent for Building Web Apps

**Zeo** is a full-stack web application that brings enterprise-grade AI assistance to web developers. Built with **Next.js** (frontend) and **PHP** (backend), Zeo helps teams design, plan, and ship production-quality web applications faster.

> **Live**: [https://zekron.codes](https://zekron.codes) | **Backend**: [https://agent.zekron.codes](https://agent.zekron.codes)

---

## ✨ Key Features

### 💬 Intelligent Chat Interface
- Real-time messaging with AI agent powered by Claude Opus
- Persistent chat history per user
- Model selection and switching
- Clean, modern UI with Tailwind CSS

### 👥 Multi-User & Authentication
- Email/password registration and login
- Google OAuth 2.0 integration
- Role-based admin access
- Secure JWT token-based auth

### 💳 Flexible Subscription System
- Multiple pricing tiers (Free, Pro, Team)
- Pay-per-token billing with user balance tracking
- Subscription plans with monthly credits
- Admin control over pricing and features

### 🤖 Model Management
- Support for multiple AI models (Anthropic, extensible)
- Admin panel to add/configure models
- Per-token pricing (input & output)
- Model-specific branding and logos

### 📊 Admin Dashboard
- Real-time analytics (users, chats, revenue)
- User management and balance adjustment
- Model configuration and pricing
- API key management (encrypted storage)
- Usage logging and billing tracking
- System settings management

---

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database and API credentials
mysql < schema.sql
# Deploy to your server (PHP 8.1+, MySQL 8.0+)
```

### Frontend Setup
```bash
pnpm install
cp .env.example .env.local
pnpm dev  # http://localhost:3000
```

**Full setup guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Complete deployment & setup guide
- **[backend/README.md](./backend/README.md)** — Backend architecture
- **[backend/schema.sql](./backend/schema.sql)** — Database schema

---

## 🏗️ Tech Stack

**Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS  
**Backend**: PHP 8.1+, MySQL 8.0+, JWT Auth, AES-256 Encryption  
**AI**: Anthropic Claude API  
**Auth**: Email/Password + Google OAuth 2.0

---

## 🔐 Default Admin

Email: `admin@zekron.codes`  
Password: `ChangeMe!2024` (change immediately)

---

## 📄 License

Copyright © 2024 ZekronAI. All rights reserved.

### Navigate to the project directory

```bash
cd obby-dev
```

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm run dev
```

### Acknowledgment

This project is based on OSS Vibe Coding Project in  [Vercel Examples](https://github.com/vercel/examples).
Big thanks to the Vercel team for providing such great starter template on using Vercel Sanbox