"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type WorkbenchDraftMode = "image3d" | "text3d";

export type WorkbenchSourceImageAsset = {
  bucket: string;
  contentType: string;
  fileName: string;
  path: string;
  publicUrl: string;
};

export type WorkbenchDraft = {
  mode: WorkbenchDraftMode;
  prompt: string;
  sourceImageAssets: WorkbenchSourceImageAsset[];
};

export const workbenchDraftStorageKey = "thornstavern.workbenchDraft.v1";
export const workbenchDefaultPrompt =
  "A blue monk character with wooden beads, broad shoulders, and hand-painted fantasy style.";

const configuredMaxUploadBytes = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES);

export const workbenchMaxUploadBytes =
  Number.isFinite(configuredMaxUploadBytes) && configuredMaxUploadBytes > 0
    ? configuredMaxUploadBytes
    : 8 * 1024 * 1024;

export const workbenchAllowedImageTypes = new Set(["image/jpeg", "image/png"]);

export function getWorkbenchUploadAccept() {
  return Array.from(workbenchAllowedImageTypes).join(",");
}

export function validateWorkbenchSourceImage(file: File) {
  if (!workbenchAllowedImageTypes.has(file.type)) {
    throw new Error("Only JPEG or PNG reference images are supported.");
  }

  if (file.size <= 0 || file.size > workbenchMaxUploadBytes) {
    throw new Error(`Reference image must be smaller than ${Math.round(workbenchMaxUploadBytes / (1024 * 1024))}MB.`);
  }
}

export async function uploadWorkbenchSourceImage(file: File): Promise<WorkbenchSourceImageAsset> {
  validateWorkbenchSourceImage(file);

  const configResp = await fetch("/api/media/upload-url", {
    body: JSON.stringify({
      contentType: file.type || "application/octet-stream",
      filename: file.name || "reference-image",
      purpose: "input",
      size: file.size,
    }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!configResp.ok) {
    const payload = await configResp.json().catch(() => ({}));
    throw new Error(payload.message || "Image upload failed. Please log in and try again.");
  }

  const config = await configResp.json();
  const supabase = getSupabaseBrowserClient();
  const uploadResp = await supabase.storage.from(config.bucket).uploadToSignedUrl(config.path, config.token, file, {
    contentType: file.type || config.contentType || "application/octet-stream",
  });

  if (uploadResp.error) {
    throw new Error(uploadResp.error.message || "Image upload failed.");
  }

  return {
    bucket: config.bucket,
    contentType: file.type || config.contentType || "application/octet-stream",
    fileName: file.name || "reference-image",
    path: config.path,
    publicUrl: config.publicUrl,
  };
}

export function saveWorkbenchDraft(draft: WorkbenchDraft) {
  window.sessionStorage.setItem(workbenchDraftStorageKey, JSON.stringify(draft));
}

export function readWorkbenchDraft(): WorkbenchDraft | null {
  const raw = window.sessionStorage.getItem(workbenchDraftStorageKey);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<WorkbenchDraft>;
  if (parsed.mode !== "image3d" && parsed.mode !== "text3d") return null;
  if (!Array.isArray(parsed.sourceImageAssets)) return null;

  return {
    mode: parsed.mode,
    prompt: typeof parsed.prompt === "string" ? parsed.prompt : "",
    sourceImageAssets: parsed.sourceImageAssets.filter(
      (asset): asset is WorkbenchSourceImageAsset =>
        Boolean(asset) &&
        typeof asset === "object" &&
        typeof asset.bucket === "string" &&
        typeof asset.contentType === "string" &&
        typeof asset.fileName === "string" &&
        typeof asset.path === "string" &&
        typeof asset.publicUrl === "string",
    ),
  };
}

export function clearWorkbenchDraft() {
  window.sessionStorage.removeItem(workbenchDraftStorageKey);
}
