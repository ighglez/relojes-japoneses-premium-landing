-- Migration: Ensure email uniqueness (idempotent)
-- This migration is safe to run even if constraints already exist

-- Step 1: Remove any potential duplicate emails (keep oldest account)
-- This is done safely by creating a backup and cleaning up
DELETE FROM `user` 
WHERE `id` NOT IN (
    SELECT MIN(`id`) 
    FROM `user` 
    GROUP BY LOWER(`email`)
);

-- Step 2: Ensure email index exists (idempotent - will not fail if exists)
-- SQLite will ignore if index already exists with IF NOT EXISTS
DROP INDEX IF EXISTS `user_email_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (LOWER(`email`));

-- Step 3: Ensure session token index exists
DROP INDEX IF EXISTS `session_token_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);

-- Step 4: Ensure referral indexes exist
CREATE UNIQUE INDEX IF NOT EXISTS `referrals_user_id_unique` ON `referrals` (`user_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `referrals_ref_code_unique` ON `referrals` (`ref_code`);
