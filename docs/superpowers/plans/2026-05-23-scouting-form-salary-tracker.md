# Scouting Form + Salary Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add create/edit form to opponent scouting, and build full player salary tracker (contracts + payment history) for /dashboard and /manage.

**Architecture:** Scouting form — client modal using existing actions/validation, no backend changes. Salary tracker — 2 new DB tables (`player_contracts`, `salary_payments`), new `features/salary/` module, pages at `/dashboard/salaries` and `/manage/salaries`.

**Tech Stack:** Next.js 15 App Router, Supabase (admin client for salary ops), Zod v4, sonner toast (scouting = workspace), useNotify (salary = dashboard/manage), useTransition pattern.

---

## File Map

### Scouting Form
- Create: `features/scouting/components/ScoutingFormModal.tsx`
- Create: `features/scouting/components/ScoutingPageClient.tsx`
- Modify: `features/scouting/components/ScoutingCard.tsx` — add edit button + orgSlug prop
- Modify: `app/[team-slug]/(workspace)/scouting/page.tsx` — use ScoutingPageClient

### Salary Tracker
- Create: `supabase/migrations/20260523110000_player_contracts_salary_payments.sql`
- Modify: `types/database.ts` — add player_contracts + salary_payments types
- Create: `lib/validations/salary.ts`
- Create: `features/salary/queries.ts`
- Create: `features/salary/actions.ts`
- Create: `features/salary/components/SalaryFormModal.tsx`
- Create: `features/salary/components/SalaryCard.tsx`
- Create: `features/salary/components/SalaryPageClient.tsx`
- Create: `app/dashboard/(panel)/salaries/page.tsx`
- Create: `app/manage/salaries/page.tsx`
- Modify: `components/layout/DashboardSidebarNav.tsx` — add Salary link under MANAJEMEN
- Modify: `components/layout/WorkspaceSidebar.tsx` — add Salary link in MANAGER_NAV_GROUP

---

## Task 1: DB Migration

**File:** `supabase/migrations/20260523110000_player_contracts_salary_payments.sql`

```sql
CREATE TABLE player_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_salary BIGINT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','terminated')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager/owner read contracts"
  ON player_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = player_contracts.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','manager')
        AND tm.is_active = true
    )
  );

CREATE POLICY "Manager/owner write contracts"
  ON player_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = player_contracts.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','manager')
        AND tm.is_active = true
    )
  );

CREATE TABLE salary_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES player_contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pay_period DATE NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, pay_period)
);

ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager/owner read payments"
  ON salary_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = salary_payments.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','manager')
        AND tm.is_active = true
    )
  );

CREATE POLICY "Manager/owner write payments"
  ON salary_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = salary_payments.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','manager')
        AND tm.is_active = true
    )
  );
```

Run: `npx supabase db push`

---

## Task 2: TypeScript Types (manual edit types/database.ts)

Insert after `polls` block (before `profiles:`):

```typescript
player_contracts: {
  Row: {
    id: string; organization_id: string; user_id: string
    monthly_salary: number; start_date: string; end_date: string | null
    status: 'active' | 'expired' | 'terminated'; notes: string | null
    created_by: string | null; created_at: string; updated_at: string
  }
  Insert: {
    id?: string; organization_id: string; user_id: string
    monthly_salary: number; start_date: string; end_date?: string | null
    status?: 'active' | 'expired' | 'terminated'; notes?: string | null
    created_by?: string | null; created_at?: string; updated_at?: string
  }
  Update: {
    id?: string; organization_id?: string; user_id?: string
    monthly_salary?: number; start_date?: string; end_date?: string | null
    status?: 'active' | 'expired' | 'terminated'; notes?: string | null
    created_by?: string | null; created_at?: string; updated_at?: string
  }
  Relationships: []
}
salary_payments: {
  Row: {
    id: string; contract_id: string; organization_id: string
    pay_period: string; amount: number; status: 'pending' | 'paid'
    paid_at: string | null; paid_by: string | null; notes: string | null; created_at: string
  }
  Insert: {
    id?: string; contract_id: string; organization_id: string
    pay_period: string; amount: number; status?: 'pending' | 'paid'
    paid_at?: string | null; paid_by?: string | null; notes?: string | null; created_at?: string
  }
  Update: {
    id?: string; contract_id?: string; organization_id?: string
    pay_period?: string; amount?: number; status?: 'pending' | 'paid'
    paid_at?: string | null; paid_by?: string | null; notes?: string | null; created_at?: string
  }
  Relationships: []
}
```

---

## Task 3: Zod Schemas — `lib/validations/salary.ts`

---

## Task 4: Queries — `features/salary/queries.ts`

---

## Task 5: Actions — `features/salary/actions.ts`

---

## Task 6: ScoutingFormModal + ScoutingPageClient

---

## Task 7: Salary UI Components

---

## Task 8: Pages + Nav

---

Commit after each logical group completes.
