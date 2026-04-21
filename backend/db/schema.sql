-- ME — Schema de base de datos
-- SQLite + FTS5 para búsqueda full-text

-- Tabla principal de memorias
CREATE TABLE IF NOT EXISTS memories (
    id         TEXT PRIMARY KEY,
    category   TEXT NOT NULL,
    title      TEXT,
    content    TEXT,
    metadata   TEXT,            -- JSON con campos específicos por categoría
    tags       TEXT,            -- JSON array de strings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_memories_category   ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);

-- FTS5: búsqueda full-text sobre título y contenido
-- content=memories → FTS5 sincronizado con la tabla principal
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    title,
    content,
    content=memories,
    content_rowid=rowid
);

-- Trigger: mantiene FTS5 actualizado en INSERT
CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

-- Trigger: mantiene FTS5 actualizado en UPDATE
CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
    INSERT INTO memories_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;

-- Trigger: mantiene FTS5 actualizado en DELETE
CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, content) VALUES('delete', old.rowid, old.title, old.content);
END;

-- Perfil del usuario (creado durante onboarding)
CREATE TABLE IF NOT EXISTS profile (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Historial de chat (multi-turn)
CREATE TABLE IF NOT EXISTS chat_history (
    id         TEXT PRIMARY KEY,
    role       TEXT NOT NULL,   -- 'user' | 'assistant'
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_history(created_at);

-- Skills: registro de skills disponibles y sus ejecuciones
CREATE TABLE IF NOT EXISTS skills (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    endpoint    TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
