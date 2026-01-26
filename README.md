# Sales Support System

A production-ready internal web application for mobile phone retail sales support. This portal helps store employees access phone model catalogues, prices, offers, and sales pitch information.

## Features

- 🔐 **Secure Authentication** - Login-only access with role-based permissions (SALES, ADMIN)
- 📱 **Product Catalogue** - Browse phones with search, filters, and sorting
- 🔄 **Google Sheets Integration** - Real-time data sync from Google Sheets
- 💼 **Admin Panel** - User management and cache control
- 🎨 **Modern UI** - Responsive design optimized for tablets and mobile
- ⚡ **High Performance** - Server-side caching with 2-minute refresh
- 🐳 **Docker Ready** - Complete containerized deployment setup

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Google Sheets API
- **Database**: PostgreSQL (users only), Google Sheets (products)
- **Auth**: NextAuth.js with JWT sessions
- **Cache**: In-memory cache (optional Redis)
- **Deployment**: Docker, Docker Compose, Nginx

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Setup database
npx prisma generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000 and login with:
- **Admin**: admin@example.com / Admin@123
- **Sales**: sales@example.com / Sales@123

## Full Documentation

See the complete README with deployment instructions in the repository.

## License

Private/Internal Use Only
