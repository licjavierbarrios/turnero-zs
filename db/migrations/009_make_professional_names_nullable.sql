-- Make first_name and last_name nullable in professional table
-- Since the new architecture uses user_id link, names should come from users table

ALTER TABLE professional
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN professional.first_name IS 'DEPRECATED: Use users.first_name via user_id relationship. Kept for backward compatibility.';
COMMENT ON COLUMN professional.last_name IS 'DEPRECATED: Use users.last_name via user_id relationship. Kept for backward compatibility.';
