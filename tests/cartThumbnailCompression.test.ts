import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const cartClientPath = path.join(rootDir, "src", "app", "(frontend)", "cart", "CartPageClient.tsx");

test("cart model thumbnails use Supabase display image transforms", () => {
  const source = readFileSync(cartClientPath, "utf8");

  assert.match(source, /getSupabasePreviewImageURL/);
  assert.match(source, /src=\{getSupabasePreviewImageURL\(item\.imageSrc,\s*"model-card"\)\}/);
});
