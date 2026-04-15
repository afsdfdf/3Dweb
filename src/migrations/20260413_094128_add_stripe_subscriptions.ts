export async function up(): Promise<void> {
  // SQLite schema was patched manually in local development.
  // Keep this migration as a no-op so Payload's generated index stays valid.
}

export async function down(): Promise<void> {
  // Intentionally left empty.
}
