# Landlord Review Platform

A web app for finding and reviewing landlords/property managers. Built to help tenants make informed rental decisions.

## What it does

- Search for landlords by name or location
- Read reviews from other tenants  
- Write your own reviews with ratings
- Rate landlords on maintenance, communication, ethics, etc.
- Community contributions for property owner info

## Tech used

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: PostgreSQL with Drizzle ORM
- Payments: Stripe integration
- UI: Tailwind CSS + shadcn/ui components

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up your `.env` with database and API keys
4. Run migrations: `npm run db:push`
5. Start dev server: `npm run dev`

## Environment variables needed

```
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Features

- Real property data integration (RentCast API)
- Property owner lookup via public records
- Review voting system
- Subscription tiers for advanced features
- Responsive design

## Contributing

Feel free to submit issues and pull requests. Still working on making this better.