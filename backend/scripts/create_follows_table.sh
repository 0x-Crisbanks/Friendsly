#!/bin/bash

# Script para crear la tabla follows usando psql
# Uso: ./scripts/create_follows_table.sh

set -e  # Exit on error

echo "🚀 Creando tabla 'follows'..."

# Verificar que estamos en el directorio correcto
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio 'backend'"
    exit 1
fi

# Cargar variables de entorno
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "⚠️  Advertencia: No se encontró archivo .env"
fi

# Verificar que existe DIRECT_URL o DATABASE_URL
if [ -z "$DIRECT_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DIRECT_URL o DATABASE_URL debe estar definido en .env"
    exit 1
fi

# Preferir DIRECT_URL sobre DATABASE_URL para migraciones
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "📝 Ejecutando script SQL..."

# Ejecutar el script SQL
psql "$DB_URL" <<EOF
-- Crear tabla follows
CREATE TABLE IF NOT EXISTS "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- Crear unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "follows_followerId_followingId_key" 
ON "follows"("followerId", "followingId");

-- Crear indexes
CREATE INDEX IF NOT EXISTS "follows_followerId_idx" 
ON "follows"("followerId");

CREATE INDEX IF NOT EXISTS "follows_followingId_idx" 
ON "follows"("followingId");

CREATE INDEX IF NOT EXISTS "follows_createdAt_idx" 
ON "follows"("createdAt");

-- Agregar foreign keys
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'follows_followerId_fkey'
    ) THEN
        ALTER TABLE "follows" 
        ADD CONSTRAINT "follows_followerId_fkey" 
        FOREIGN KEY ("followerId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'follows_followingId_fkey'
    ) THEN
        ALTER TABLE "follows" 
        ADD CONSTRAINT "follows_followingId_fkey" 
        FOREIGN KEY ("followingId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END
\$\$;

COMMENT ON TABLE "follows" IS 'Stores follow relationships between users';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tabla 'follows' creada exitosamente"
    
    # Regenerar Prisma Client
    echo "🔄 Regenerando Prisma Client..."
    npx prisma generate
    
    echo "✅ ¡Todo listo! La tabla 'follows' está creada y Prisma Client regenerado."
else
    echo "❌ Error al crear la tabla"
    exit 1
fi

