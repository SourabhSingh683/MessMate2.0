# MessMate 2.0: Closed-Loop College Meal-Subscription & Kitchen Intelligence

MessMate 2.0 is a full-stack college meal-subscription and mess-management platform designed for the **Zeta Innovate competition**. It synchronizes student advance meal decisions with commercial kitchen operations to reduce food waste, ensure financial fairness through rollover skip credits, and optimize dietary nutrition.

---

## Key Features

1. **Closed-Loop Kitchen Intelligence**:
   - Students skip meals before mess-configured cutoffs.
   - Expected attendance and kitchen portion recommendations update in real time.
   - Chefs record portions prepared, served, leftovers, and discarded quantities with categorized waste reasons.
   - Analytics compare forecast demand against actual attendance.

2. **Auditable Meal Credit Ledger**:
   - Advance skips award ₹50 rollover credits per meal.
   - Guaranteed single-issuance ledger backed by cryptographic idempotency keys (`idempotency_key` unique constraint).
   - Credits can be accumulated and redeemed as renewal discounts.

3. **AI Mess Finder & Nutrition Companion (Gemini 3.8 Flash)**:
   - Budget-conscious, dietary-goal-aligned recommendations grounded strictly in real database listings.
   - Transparent nutritional macro estimation with medical disclaimers and estimation assumptions.
   - Deterministic rule-based fallback when AI key is unavailable or during network variance.

4. **Owner Operational Copilot**:
   - Natural language assistant answering questions regarding attendance forecasts, waste reduction, top wasted dishes, and subscriber counts grounded in real database records.

5. **Multi-Role Tenancy & Demo Switching**:
   - 1-click persona switcher in the top navigation bar to test **Student**, **Mess Owner**, and **Campus Administrator** permissions immediately.

---

## Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express 4, TypeScript (`tsx`)
- **Database**: PostgreSQL (Managed Cloud SQL Developer Edition)
- **ORM & Migrations**: Drizzle ORM & Drizzle Kit
- **AI Integration**: `@google/genai` (Gemini 3.8 Flash) with deterministic fallback
- **Testing**: Vitest automated end-to-end suite

---

## Demo Personas

| Role | Name | Email | Details |
|------|------|-------|---------|
| **Student** | Aarav Sharma | aarav.sharma@campus.edu | Vegetarian, CS 3rd Year, Block B-204 (Subscribed to Annapurna Rasoi) |
| **Student** | Ananya Iyer | ananya.iyer@campus.edu | Eggitarian, BioTech 2nd Year, Block C-108 (Subscribed to Campus Bowl) |
| **Student** | Rohan Verma | rohan.verma@campus.edu | Non-Veg, Mech 4th Year, Block A-312 (Subscribed to Royal Feast) |
| **Mess Owner** | Rajesh Gupta | rajesh@annapurnarasoi.in | Owner of *Annapurna Rasoi* (Pure Veg Homestyle) |
| **Mess Owner** | Gurpreet Singh | gurpreet@royalfeast.in | Owner of *Royal Feast Mess* (Punjabi & Shahi Feasts) |
| **Mess Owner** | Vikram Nair | vikram@campusbowl.in | Owner of *Campus Bowl & Grill* (High-Protein Bowls) |
| **Admin** | Dr. Meenakshi Sundaram | admin.dean@campus.edu | Dean of Student Affairs (Moderation & Audit Trail) |

---

## Quickstart & Commands

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` (Cloud SQL runtime variables)
- `DATABASE_URL` (Standard connection string for external managed PostgreSQL)
- `GEMINI_API_KEY` (Gemini AI API key for intelligent recommendations)

### 2. Seed Demo Data
Populate the PostgreSQL database with the Greenwood Campus demo dataset:
```bash
npm run seed
```

### 3. Start Development Server
Starts the full-stack Express server with Vite middleware on port 3000:
```bash
npm run dev
```

### 4. Run Automated Test Suite
Executes the comprehensive 10-step end-to-end integration test suite:
```bash
npm test
```
