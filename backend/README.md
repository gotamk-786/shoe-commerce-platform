# Backend (Express + Prisma + Clerk)

## Setup
1. Copy `backend/.env.example` to `backend/.env` and fill values.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start dev server:

```bash
npm run dev
```

## Notes
- Public product endpoints never return cost price.
- Admin endpoints require Clerk role `admin` in public/private metadata.
- Profit is calculated server-side only.
