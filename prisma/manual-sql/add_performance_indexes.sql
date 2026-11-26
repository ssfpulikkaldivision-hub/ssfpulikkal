-- Safe, idempotent performance indexes for SSF Pulikkal Division (Cloudflare D1 / SQLite)
CREATE INDEX IF NOT EXISTS "Councillor_isAdmitted_idx" ON "Councillor"("isAdmitted");
CREATE INDEX IF NOT EXISTS "Event_status_createdAt_idx" ON "Event"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_createdAt_idx" ON "Event"("createdAt");
CREATE INDEX IF NOT EXISTS "Gallery_albumId_createdAt_idx" ON "Gallery"("albumId", "createdAt");
CREATE INDEX IF NOT EXISTS "Gallery_createdAt_idx" ON "Gallery"("createdAt");
CREATE INDEX IF NOT EXISTS "GalleryAlbum_createdAt_idx" ON "GalleryAlbum"("createdAt");
CREATE INDEX IF NOT EXISTS "News_status_createdAt_idx" ON "News"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "News_createdAt_idx" ON "News"("createdAt");
CREATE INDEX IF NOT EXISTS "PortalNotice_isPinned_createdAt_idx" ON "PortalNotice"("isPinned", "createdAt");
