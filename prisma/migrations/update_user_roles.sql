-- Update existing user roles to new schema
-- Map old roles to new roles:
-- DIRECTOR_COMUNICACION stays the same
-- GOBERNADOR -> LIDER
-- SECRETARIO_GOBIERNO -> DIRECTOR_AREA 
-- SUBORDINADO -> ASISTENTE

-- First, update the data
UPDATE users SET role = 'LIDER' WHERE role = 'GOBERNADOR';
UPDATE users SET role = 'DIRECTOR_AREA' WHERE role = 'SECRETARIO_GOBIERNO';
UPDATE users SET role = 'ASISTENTE' WHERE role = 'SUBORDINADO';

-- Then alter the enum type
-- PostgreSQL requires special handling for enum changes
BEGIN;

-- Create new enum type
CREATE TYPE "UserRole_new" AS ENUM ('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA', 'ASISTENTE');

-- Update column to use new enum
ALTER TABLE users ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";

-- Drop old enum
DROP TYPE "UserRole";

-- Rename new enum to original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

COMMIT;