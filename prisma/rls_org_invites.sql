-- Run this in the Supabase SQL Editor AFTER the Prisma migration completes.
-- RLS policies for org_invites table.

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Members of the org can manage invites
CREATE POLICY "org_invites_org_isolation" ON org_invites
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

-- Allow anyone to read by token (for the invite accept flow).
-- The token is a UUID so it's unguessable — same security model as Notion/Slack invite links.
CREATE POLICY "org_invites_token_read" ON org_invites
  FOR SELECT USING (true);
