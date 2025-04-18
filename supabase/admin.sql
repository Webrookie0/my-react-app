-- IMPORTANT: Run this in your Supabase SQL Editor FIRST!
-- This creates a function that allows our app to execute SQL statements

-- Create an admin function to execute SQL
-- Only for development use! Remove in production!
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable email confirmation for easier development
-- Run this to disable email confirmation
UPDATE auth.config
SET confirm_email_through_signup = false
WHERE confirm_email_through_signup = true; 