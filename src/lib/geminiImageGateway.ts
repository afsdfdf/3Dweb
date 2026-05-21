import type { PayloadRequest } from "payload";

import { getCanonicalAppURL } from "@/lib/getCanonicalAppURL";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import { createSupabaseStorageSignedUrl } from "@/lib/supabase/storage";

export type ImageGenerationProvider =
  | "gemini-official"
  | "gemini-third-party"
  | "openai-compatible";

type GeminiInlineImage = {
  data: string;
  mimeType: string;
};

type SourceImageData = GeminiInlineImage & {
  buffer: Buffer;
};

type GeminiImageSettings = {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: Exclude<ImageGenerationProvider, "openai-compatible">;
  timeoutSeconds: number;
};

type OpenAICompatibleImageSettings = {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: "openai-compatible";
  size: string;
  timeoutSeconds: number;
};

type GenerateProviderImageArgs = {
  inputMode: "image" | "text";
  prompt: string;
  req: PayloadRequest;
  sourceImage?: number;
  sourceImageAsset?: Record<string, unknown>;
  provider?: ImageGenerationProvider;
};

type ImageProviderSettings =
  | GeminiImageSettings
  | OpenAICompatibleImageSettings;

const DEFAULT_OFFICIAL_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_OFFICIAL_MODEL = "gemini-2.5-flash-image-preview";
const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_COMPATIBLE_MODEL = "gpt-image-1";
const DEFAULT_OPENAI_COMPATIBLE_SIZE = "1024x1024";
const DEFAULT_IMAGE_PROVIDER_TIMEOUT_SECONDS = 600;
const GPT_IMAGE_2_MODEL = "gpt-image-2";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeBaseURL = (value: string) => value.trim().replace(/\/+$/, "");

const readString = (value: unknown) => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "";
};

const readFirstString = (values: unknown[]) => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }

  return "";
};

const readConfiguredString = (args: {
  defaultValue?: string;
  envValues?: unknown[];
  storedValue: unknown;
}) => {
  const defaultValue = args.defaultValue || "";
  const storedValue = readString(args.storedValue);
  const envValue = readFirstString(args.envValues || []);

  if (storedValue && storedValue !== defaultValue) return storedValue;
  return envValue || storedValue || defaultValue;
};

const readImageProviderTimeoutSeconds = (value: unknown) => {
  const configuredValue = Number(value || DEFAULT_IMAGE_PROVIDER_TIMEOUT_SECONDS);
  return Number.isFinite(configuredValue)
    ? Math.max(DEFAULT_IMAGE_PROVIDER_TIMEOUT_SECONDS, configuredValue)
    : DEFAULT_IMAGE_PROVIDER_TIMEOUT_SECONDS;
};

const readSourceImageAssetUrl = (value: unknown) => {
  if (!isRecord(value)) return "";
  return readString(value.publicUrl);
};

const readSourceImageAssetStorage = (value: unknown) => {
  if (!isRecord(value)) return null;

  const bucket = readString(value.bucket);
  const path = readString(value.path);
  if (!bucket || !path) return null;

  return { bucket, path };
};

const readSourceImageAssetMediaId = (value: unknown) => {
  if (!isRecord(value)) return 0;
  const id =
    typeof value.mediaId === "number" ? value.mediaId : Number(value.mediaId);
  return Number.isFinite(id) && id > 0 ? id : 0;
};

async function parseGeminiError(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const error = isRecord(payload.error) ? payload.error : null;
    const message = readString(error?.message) || readString(payload.message);
    return message || JSON.stringify(payload);
  } catch {
    return await response.text();
  }
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    /aborted due to timeout|operation was aborted|timeout/i.test(error.message)
  );
}

async function fetchWithProviderTimeout(args: {
  input: string;
  init: RequestInit;
  provider: ImageGenerationProvider;
  timeoutSeconds: number;
}) {
  try {
    return await fetch(args.input, args.init);
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        `The ${args.provider} image provider timed out after ${args.timeoutSeconds} seconds. Increase Image generation > Provider timeout seconds or use a faster provider/model.`,
      );
    }

    throw error;
  }
}

const readImageGenerationDefaultProvider = (
  value: unknown,
): ImageGenerationProvider => {
  if (value === "gemini-third-party" || value === "openai-compatible") {
    return value;
  }

  return "gemini-official";
};

const readPreferredProvider = (
  value: unknown,
): ImageGenerationProvider | undefined => {
  if (
    value === "gemini-official" ||
    value === "gemini-third-party" ||
    value === "openai-compatible"
  ) {
    return value;
  }

  return undefined;
};

export async function resolveImageGenerationProvider(args: {
  preferredProvider?: ImageGenerationProvider;
  req: PayloadRequest;
}): Promise<ImageGenerationProvider> {
  if (args.preferredProvider) {
    return args.preferredProvider;
  }

  const config = await args.req.payload
    .findGlobal({
      slug: "ai-provider-settings",
      overrideAccess: true,
    })
    .catch(() => null);

  const imageGeneration = isRecord(config?.imageGeneration)
    ? config.imageGeneration
    : {};
  return readImageGenerationDefaultProvider(imageGeneration.defaultProvider);
}

async function readImageSettings(args: {
  preferredProvider?: ImageGenerationProvider;
  req: PayloadRequest;
}): Promise<ImageProviderSettings> {
  const config = await args.req.payload
    .findGlobal({
      slug: "ai-provider-settings",
      overrideAccess: true,
    })
    .catch(() => null);

  const imageGeneration = isRecord(config?.imageGeneration)
    ? config.imageGeneration
    : {};
  const defaultProvider = readImageGenerationDefaultProvider(
    imageGeneration.defaultProvider,
  );
  const provider =
    readPreferredProvider(args.preferredProvider) || defaultProvider;
  const timeoutSeconds = readImageProviderTimeoutSeconds(
    imageGeneration.timeoutSeconds,
  );
  const official = isRecord(imageGeneration.official)
    ? imageGeneration.official
    : {};
  const thirdParty = isRecord(imageGeneration.thirdParty)
    ? imageGeneration.thirdParty
    : {};
  const openAICompatible = isRecord(imageGeneration.openAICompatible)
    ? imageGeneration.openAICompatible
    : {};

  if (provider === "gemini-third-party") {
    return {
      apiKey:
        readString(thirdParty.apiKey) ||
        readString(process.env.GEMINI_IMAGE_THIRD_PARTY_API_KEY),
      baseURL: normalizeBaseURL(
        readConfiguredString({
          envValues: [process.env.GEMINI_IMAGE_THIRD_PARTY_BASE_URL],
          storedValue: thirdParty.baseURL,
        }),
      ),
      model: readConfiguredString({
        envValues: [process.env.GEMINI_IMAGE_THIRD_PARTY_MODEL],
        storedValue: thirdParty.model,
      }),
      provider,
      timeoutSeconds,
    };
  }

  if (provider === "openai-compatible") {
    return {
      apiKey:
        readString(openAICompatible.apiKey) ||
        readString(process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY) ||
        readString(process.env.OPENAI_API_KEY),
      baseURL: normalizeBaseURL(
        readConfiguredString({
          defaultValue: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
          envValues: [
            process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL,
            process.env.OPENAI_BASE_URL,
          ],
          storedValue: openAICompatible.baseURL,
        }),
      ),
      model: readConfiguredString({
        defaultValue: DEFAULT_OPENAI_COMPATIBLE_MODEL,
        envValues: [
          process.env.OPENAI_IMAGE_COMPATIBLE_MODEL,
          process.env.OPENAI_IMAGE_MODEL,
        ],
        storedValue: openAICompatible.model,
      }),
      provider,
      size: readConfiguredString({
        defaultValue: DEFAULT_OPENAI_COMPATIBLE_SIZE,
        envValues: [process.env.OPENAI_IMAGE_COMPATIBLE_SIZE],
        storedValue: openAICompatible.size,
      }),
      timeoutSeconds,
    };
  }

  return {
    apiKey:
      readString(official.apiKey) ||
      readString(process.env.GEMINI_IMAGE_API_KEY),
    baseURL: normalizeBaseURL(
      readConfiguredString({
        defaultValue: DEFAULT_OFFICIAL_BASE_URL,
        envValues: [process.env.GEMINI_IMAGE_API_BASE_URL],
        storedValue: official.baseURL,
      }),
    ),
    model: readConfiguredString({
      defaultValue: DEFAULT_OFFICIAL_MODEL,
      envValues: [process.env.GEMINI_IMAGE_MODEL],
      storedValue: official.model,
    }),
    provider,
    timeoutSeconds,
  };
}

async function resolveSourceImageDownloadURL(args: {
  req: PayloadRequest;
  sourceImage?: number;
  sourceImageAsset?: Record<string, unknown>;
}) {
  const storage = readSourceImageAssetStorage(args.sourceImageAsset);
  if (storage) {
    try {
      return await createSupabaseStorageSignedUrl({
        bucket: storage.bucket,
        expiresIn: 3600,
        path: storage.path,
      });
    } catch (error) {
      args.req.payload.logger.warn({
        error: error instanceof Error ? error.message : String(error),
        msg: "Image generation source image signed URL creation failed; falling back to public URL.",
      });
    }
  }

  const sourceImageAssetUrl = readSourceImageAssetUrl(args.sourceImageAsset);

  if (sourceImageAssetUrl) {
    return sourceImageAssetUrl;
  }

  const sourceImage =
    args.sourceImage || readSourceImageAssetMediaId(args.sourceImageAsset);

  if (!sourceImage) {
    throw new Error("Image-to-image generation requires a source image.");
  }

  const media = await args.req.payload.findByID({
    collection: "media",
    depth: 0,
    id: sourceImage,
    overrideAccess: false,
    req: args.req,
  });

  const mediaURL = readString(media.url);
  if (!mediaURL) {
    throw new Error(
      "The selected source image does not have an accessible URL.",
    );
  }

  const absoluteURL = mediaURL.startsWith("http")
    ? mediaURL
    : `${getCanonicalAppURL()}${mediaURL}`;
  const accessURL = await getMediaAccessURL({
    payload: args.req.payload,
    ttlSeconds: 3600,
    url: absoluteURL,
  });

  return accessURL || absoluteURL;
}

async function readSourceImageInlineData(args: {
  req: PayloadRequest;
  sourceImage?: number;
  sourceImageAsset?: Record<string, unknown>;
}): Promise<SourceImageData> {
  const downloadURL = await resolveSourceImageDownloadURL(args);
  const response = await fetch(downloadURL);

  if (!response.ok) {
    throw new Error(`Source image fetch failed with ${response.status}.`);
  }

  const mimeType =
    readString(response.headers.get("content-type")) || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength === 0) {
    throw new Error("Source image fetch returned an empty file.");
  }

  return {
    buffer,
    data: buffer.toString("base64"),
    mimeType,
  } satisfies SourceImageData;
}

function extractInlineImage(
  payload: Record<string, unknown>,
): GeminiInlineImage {
  const candidates = Array.isArray(payload.candidates)
    ? payload.candidates
    : [];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const content = isRecord(candidate.content) ? candidate.content : null;
    const parts = Array.isArray(content?.parts) ? content.parts : [];

    for (const part of parts) {
      if (!isRecord(part)) continue;
      const inlineData = isRecord(part.inlineData) ? part.inlineData : null;
      const data = readString(inlineData?.data);
      const mimeType = readString(inlineData?.mimeType) || "image/png";

      if (data) {
        return { data, mimeType };
      }
    }
  }

  throw new Error("Gemini did not return an image payload.");
}

const getMimeTypeFromImageFormat = (value: unknown) => {
  const format = readString(value).toLowerCase();
  if (format === "jpg" || format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  if (format === "png") return "image/png";
  return "";
};

const looksLikeBase64Image = (value: string) => {
  return value.length > 100 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
};

const sanitizeOpenAICompatibleDetail = (value: string) => {
  const redacted = value
    .replace(
      /("(?:result|b64_json|partial_image_b64)"\s*:\s*")[A-Za-z0-9+/=]{120,}(")/g,
      "$1[redacted-base64-image]$2",
    )
    .replace(
      /(\\\"(?:result|b64_json|partial_image_b64)\\\"\s*:\s*\\\")[A-Za-z0-9+/=]{120,}(\\\")/g,
      "$1[redacted-base64-image]$2",
    )
    .replace(
      /(data:image\/[a-zA-Z0-9.+-]+;base64,)[A-Za-z0-9+/=]{120,}/g,
      "$1[redacted-base64-image]",
    );

  return redacted.length > 1200 ? `${redacted.slice(0, 1200)}...` : redacted;
};

const tryParseOpenAICompatibleJSON = (value: string): unknown => {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string" && parsed !== value) {
      return tryParseOpenAICompatibleJSON(parsed);
    }

    return parsed;
  } catch {
    return null;
  }
};

const pushParsedOpenAICompatiblePayload = (
  payloads: unknown[],
  value: string,
) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "[DONE]") return;

  const parsed = tryParseOpenAICompatibleJSON(trimmed);
  if (parsed) {
    payloads.push(parsed);
    return;
  }

  const unescaped = trimmed.replace(/\\"/g, '"');
  if (unescaped !== trimmed) {
    const parsedUnescaped = tryParseOpenAICompatibleJSON(unescaped);
    if (parsedUnescaped) payloads.push(parsedUnescaped);
  }
};

const extractOpenAICompatiblePayloadsFromText = (text: string) => {
  const payloads: unknown[] = [];
  const trimmed = text.trim();

  pushParsedOpenAICompatiblePayload(payloads, trimmed);

  const eventBlocks = trimmed.split(/\r?\n\r?\n/);
  for (const block of eventBlocks) {
    const dataLines = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""));

    for (const dataLine of dataLines) {
      pushParsedOpenAICompatiblePayload(payloads, dataLine);
    }

    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""))
      .join("\n");

    pushParsedOpenAICompatiblePayload(payloads, data);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    pushParsedOpenAICompatiblePayload(
      payloads,
      trimmed.slice(firstBrace, lastBrace + 1),
    );
  }

  return payloads.filter(isRecord);
};

const readOpenAICompatibleErrorDetail = (text: string) => {
  const payloads = extractOpenAICompatiblePayloadsFromText(text);

  for (const payload of payloads) {
    const error = isRecord(payload.error) ? payload.error : null;
    const message = readString(error?.message) || readString(payload.message);
    const code = readString(error?.code) || readString(payload.code);
    const type = readString(error?.type) || readString(payload.type);
    if (!message && !code) continue;

    const detail = [message, type, code].filter(Boolean).join(" ");

    if (detail) return detail;
  }

  return sanitizeOpenAICompatibleDetail(text);
};

const findOpenAICompatibleImageRecord = (payload: unknown) => {
  const stack: Array<{ depth: number; value: unknown }> = [
    { depth: 0, value: payload },
  ];
  const visited = new Set<unknown>();

  while (stack.length > 0) {
    const { depth, value } = stack.shift() as { depth: number; value: unknown };
    if (depth > 8 || !value || visited.has(value)) continue;
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        stack.push({ depth: depth + 1, value: item });
      }
      continue;
    }

    if (!isRecord(value)) continue;

    const b64Json = readString(value.b64_json);
    const result = readString(value.result);
    const partialImage = readString(value.partial_image_b64);
    const url = readString(value.url);
    const type = readString(value.type);

    if (
      b64Json ||
      url ||
      (type === "image_generation_call" && looksLikeBase64Image(result)) ||
      partialImage
    ) {
      return value;
    }

    for (const child of Object.values(value)) {
      if (child && (typeof child === "object" || Array.isArray(child))) {
        stack.push({ depth: depth + 1, value: child });
      }
    }
  }

  return null;
};

async function extractOpenAICompatibleImage(payload: Record<string, unknown>) {
  const image = findOpenAICompatibleImageRecord(payload);

  if (!image) {
    throw new Error(
      "OpenAI-compatible provider did not return an image payload.",
    );
  }

  const b64Json = readString(image.b64_json);
  const result = readString(image.result);
  const partialImage = readString(image.partial_image_b64);
  const mimeType =
    readString(image.mime_type) ||
    readString(image.mimeType) ||
    getMimeTypeFromImageFormat(image.output_format) ||
    getMimeTypeFromImageFormat(image.outputFormat) ||
    "image/png";

  if (b64Json) {
    return { data: b64Json, mimeType } satisfies GeminiInlineImage;
  }

  if (looksLikeBase64Image(result)) {
    return { data: result, mimeType } satisfies GeminiInlineImage;
  }

  if (partialImage) {
    return { data: partialImage, mimeType } satisfies GeminiInlineImage;
  }

  const url = readString(image.url);
  if (!url) {
    throw new Error(
      "OpenAI-compatible provider response did not include b64_json or url.",
    );
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `OpenAI-compatible image URL fetch failed with ${response.status}.`,
    );
  }

  const responseMimeType =
    readString(response.headers.get("content-type")) || mimeType;
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength === 0) {
    throw new Error("OpenAI-compatible image URL returned an empty image.");
  }

  return {
    data: buffer.toString("base64"),
    mimeType: responseMimeType,
  } satisfies GeminiInlineImage;
}

async function extractOpenAICompatibleImageFromText(text: string) {
  const payloads = extractOpenAICompatiblePayloadsFromText(text);

  for (let index = payloads.length - 1; index >= 0; index -= 1) {
    const payload = payloads[index];
    try {
      return await extractOpenAICompatibleImage(payload);
    } catch {
      continue;
    }
  }

  return null;
}

async function readOpenAICompatibleImageResponse(response: Response) {
  const text = await response.text();

  if (!response.ok) {
    const recoveredImage = await extractOpenAICompatibleImageFromText(text);
    if (recoveredImage) return recoveredImage;

    throw new Error(
      `OpenAI-compatible image generation failed: ${readOpenAICompatibleErrorDetail(text)}`,
    );
  }

  const image = await extractOpenAICompatibleImageFromText(text);
  if (image) return image;

  throw new Error(
    "OpenAI-compatible provider did not return a readable image payload.",
  );
}

const isOpenAICompatibleEditFormatError = (
  responseStatus: number,
  detail: string,
) => {
  if (![400, 415, 422].includes(responseStatus)) return false;

  return /content-type|multipart|form-?data|json|image|images|image_url|unsupported|invalid|required|unknown|unrecognized/i.test(
    detail,
  );
};

const shouldTryOpenAICompatibleMultipartImageEdit = (
  responseStatus: number,
  detail: string,
) => {
  return isOpenAICompatibleEditFormatError(responseStatus, detail);
};

const isGPTImage2Model = (model: string) =>
  model.trim().toLowerCase() === GPT_IMAGE_2_MODEL;

const getOpenAICompatibleImageOptions = (args: {
  settings: OpenAICompatibleImageSettings;
}) => {
  const options: Record<string, string> = {};

  if (args.settings.size) {
    options.size = args.settings.size;
  }

  if (isGPTImage2Model(args.settings.model)) {
    options.quality = "auto";
    options.output_format = "png";
    options.response_format = "url";
  }

  return options;
};

function getSourceImageFilename(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpeg") return "source.jpg";
  if (normalized === "image/webp") return "source.webp";
  return "source.png";
}

async function requestOpenAICompatibleTextImage(
  args: GenerateProviderImageArgs & {
    headers: Record<string, string>;
    settings: OpenAICompatibleImageSettings;
  },
) {
  return fetchWithProviderTimeout({
    input: `${args.settings.baseURL}/images/generations`,
    init: {
      body: JSON.stringify({
        model: args.settings.model,
        n: 1,
        prompt: args.prompt.trim(),
        ...getOpenAICompatibleImageOptions({ settings: args.settings }),
      }),
      headers: {
        ...args.headers,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(args.settings.timeoutSeconds * 1000),
    },
    provider: args.settings.provider,
    timeoutSeconds: args.settings.timeoutSeconds,
  });
}

async function requestOpenAICompatibleJSONImageEdit(
  args: GenerateProviderImageArgs & {
    headers: Record<string, string>;
    settings: OpenAICompatibleImageSettings;
    sourceImageURL: string;
  },
) {
  return fetchWithProviderTimeout({
    input: `${args.settings.baseURL}/images/edits`,
    init: {
      body: JSON.stringify({
        images: [
          {
            image_url: args.sourceImageURL,
          },
        ],
        model: args.settings.model,
        n: 1,
        prompt: args.prompt.trim(),
        ...getOpenAICompatibleImageOptions({ settings: args.settings }),
      }),
      headers: {
        ...args.headers,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(args.settings.timeoutSeconds * 1000),
    },
    provider: args.settings.provider,
    timeoutSeconds: args.settings.timeoutSeconds,
  });
}

async function requestOpenAICompatibleMultipartImageEdit(
  args: GenerateProviderImageArgs & {
    headers: Record<string, string>;
    settings: OpenAICompatibleImageSettings;
  },
) {
  const sourceImage = await readSourceImageInlineData({
    req: args.req,
    sourceImage: args.sourceImage,
    sourceImageAsset: args.sourceImageAsset,
  });
  const formData = new FormData();
  const sourceFile = new Blob([new Uint8Array(sourceImage.buffer)], {
    type: sourceImage.mimeType,
  });

  formData.set("model", args.settings.model);
  formData.set("prompt", args.prompt.trim());
  formData.set(
    "image",
    sourceFile,
    getSourceImageFilename(sourceImage.mimeType),
  );
  formData.set("n", "1");
  for (const [key, value] of Object.entries(
    getOpenAICompatibleImageOptions({ settings: args.settings }),
  )) {
    formData.set(key, value);
  }

  return fetchWithProviderTimeout({
    input: `${args.settings.baseURL}/images/edits`,
    init: {
      body: formData,
      headers: args.headers,
      method: "POST",
      signal: AbortSignal.timeout(args.settings.timeoutSeconds * 1000),
    },
    provider: args.settings.provider,
    timeoutSeconds: args.settings.timeoutSeconds,
  });
}

async function generateOpenAICompatibleImage(
  args: GenerateProviderImageArgs & {
    settings: OpenAICompatibleImageSettings;
  },
) {
  const { settings } = args;
  const prompt = args.prompt.trim();
  const headers = {
    Authorization: `Bearer ${settings.apiKey}`,
  };

  let response: Response;

  if (args.inputMode === "image") {
    if (!prompt) {
      throw new Error("Image-to-image generation requires an effective prompt.");
    }

    const sourceImageURL = await resolveSourceImageDownloadURL({
      req: args.req,
      sourceImage: args.sourceImage,
      sourceImageAsset: args.sourceImageAsset,
    });

    response = await requestOpenAICompatibleJSONImageEdit({
      ...args,
      headers,
      settings,
      sourceImageURL,
    });

    if (!response.ok) {
      const detail = await response.clone().text();
      if (
        shouldTryOpenAICompatibleMultipartImageEdit(response.status, detail)
      ) {
        args.req.payload.logger?.warn?.({
          detail: readOpenAICompatibleErrorDetail(detail),
          msg: "OpenAI-compatible image_url edit request failed; retrying with multipart image edit.",
          provider: settings.provider,
          providerModel: settings.model,
        });

        response = await requestOpenAICompatibleMultipartImageEdit({
          ...args,
          headers,
          settings,
        });
      }
    }

    const image = await readOpenAICompatibleImageResponse(response);

    return {
      image,
      provider: settings.provider,
      providerModel: settings.model,
    };
  } else {
    response = await requestOpenAICompatibleTextImage({
      ...args,
      headers,
      settings,
    });
  }

  const image = await readOpenAICompatibleImageResponse(response);

  return {
    image,
    provider: settings.provider,
    providerModel: settings.model,
  };
}

export async function generateProviderImage(args: GenerateProviderImageArgs) {
  const settings = await readImageSettings({
    preferredProvider: args.provider,
    req: args.req,
  });

  if (!settings.apiKey) {
    throw new Error(`The ${settings.provider} API key is not configured.`);
  }

  if (!settings.baseURL) {
    throw new Error(`The ${settings.provider} base URL is not configured.`);
  }

  if (!settings.model) {
    throw new Error(`The ${settings.provider} model is not configured.`);
  }

  if (settings.provider === "openai-compatible") {
    return generateOpenAICompatibleImage({
      ...args,
      settings,
    });
  }

  const parts: Array<Record<string, unknown>> = [{ text: args.prompt.trim() }];

  if (args.inputMode === "image") {
    const inlineImage = await readSourceImageInlineData({
      req: args.req,
      sourceImage: args.sourceImage,
      sourceImageAsset: args.sourceImageAsset,
    });

    parts.unshift({
      inlineData: {
        data: inlineImage.data,
        mimeType: inlineImage.mimeType,
      },
    });
  }

  const response = await fetchWithProviderTimeout({
    input: `${settings.baseURL}/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`,
    init: {
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.apiKey,
      },
      method: "POST",
      signal: AbortSignal.timeout(settings.timeoutSeconds * 1000),
    },
    provider: settings.provider,
    timeoutSeconds: settings.timeoutSeconds,
  });

  if (!response.ok) {
    const detail = await parseGeminiError(response);
    throw new Error(`Gemini image generation failed: ${detail}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const image = extractInlineImage(payload);

  return {
    image,
    provider: settings.provider,
    providerModel: settings.model,
  };
}
