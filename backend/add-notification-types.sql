-- Agregar nuevos tipos de notificaciones al enum NotificationType
-- Ejecutar este script en Supabase SQL Editor

-- Agregar NEW_LIKE si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'NEW_LIKE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'NEW_LIKE';
    END IF;
END$$;

-- Agregar NEW_REPLY si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'NEW_REPLY' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'NEW_REPLY';
    END IF;
END$$;

-- Agregar NEW_FOLLOW si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'NEW_FOLLOW' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'NEW_FOLLOW';
    END IF;
END$$;

-- Verificar que se agregaron correctamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
ORDER BY enumsortorder;

