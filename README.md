# Sports Booking SaaS

Multi-tenant sports facility booking platform with WhatsApp AI bot integration.

## Tech Stack

- **Backend**: NestJS + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js 14 + Tailwind + shadcn/ui + Zustand
- **Bot**: Separate worker with Gemini + Whisper
- **Real-time**: Socket.io
- **Payments**: Mercado Pago

## Project Structure

```
sports-booking-saas/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── bot/          # WhatsApp bot worker
└── packages/
    ├── database/     # Prisma schema & client
    └── shared/       # Shared types & utilities
```

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Run Development Server

```bash
# Start all apps in development mode
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps |
| `npm run lint` | Run linting |
| `npm run test` | Run tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

See `.env.example` for all required environment variables.

## User Roles

- **SUPER_ADMIN**: Platform owner (Santiago)
- **OWNER**: Facility owner (pays subscription)
- **STAFF**: Facility employee (limited access)
- **Customer**: End users (WhatsApp only)

## License

Private - All rights reserved.
