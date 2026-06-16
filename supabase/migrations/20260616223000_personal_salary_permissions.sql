-- 20260616223000_personal_salary_permissions.sql
-- Allow captain, member, and coach to read their own contracts and salary payments

DROP POLICY IF EXISTS "Players can select own contracts" ON player_contracts;
CREATE POLICY "Players can select own contracts" ON player_contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Players can select own payments" ON salary_payments;
CREATE POLICY "Players can select own payments" ON salary_payments
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM player_contracts
      WHERE user_id = auth.uid()
    )
  );
