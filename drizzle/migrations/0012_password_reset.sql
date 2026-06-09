-- Add password reset token columns to readers and users tables

ALTER TABLE readers
  ADD COLUMN reset_token text,
  ADD COLUMN reset_token_expires_at timestamp;

ALTER TABLE users
  ADD COLUMN reset_token text,
  ADD COLUMN reset_token_expires_at timestamp;
