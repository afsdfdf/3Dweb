import assert from "node:assert/strict";
import test from "node:test";

import { AIProviderSettings } from "../src/globals/AIProviderSettings.ts";
import { generateProviderImage } from "../src/lib/geminiImageGateway.ts";

type TestField = {
  fields?: TestField[];
  name?: string;
  options?: Array<{ value?: string }>;
};

const findField = (fields: TestField[], name: string) => {
  const field = fields.find((item) => item.name === name);
  assert.ok(field, `${name} field should exist`);
  return field;
};

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const makeOpenAICompatibleReq = () =>
  ({
    payload: {
      findGlobal: async () => ({
        imageGeneration: {
          defaultProvider: "openai-compatible",
          openAICompatible: {
            apiKey: "admin-key",
            baseURL: "https://admin.example/v1",
            model: "admin-image-model",
            size: "512x512",
          },
          timeoutSeconds: 30,
        },
      }),
    },
  }) as never;

test("AI Provider Settings exposes provider, polling, credit, and image generation settings", () => {
  const fields = AIProviderSettings.fields as TestField[];
  const fieldNames = fields.map((field) => field.name).filter(Boolean);

  assert.ok(fieldNames.includes("defaultProvider"));
  assert.ok(fieldNames.includes("mockMode"));
  assert.ok(fieldNames.includes("polling"));
  assert.ok(fieldNames.includes("creditRules"));
  assert.ok(fieldNames.includes("meshy"));
  assert.ok(fieldNames.includes("providers"));
  assert.ok(fieldNames.includes("imageGeneration"));
});

test("AI Provider Settings keeps dedicated Meshy and image-generation groups", () => {
  const fields = AIProviderSettings.fields as TestField[];
  const meshyField = findField(fields, "meshy");
  const imageGenerationField = findField(fields, "imageGeneration");
  const meshyFields = meshyField.fields || [];
  const imageGenerationFields = imageGenerationField.fields || [];
  const meshyNames = meshyFields.map((field) => field.name).filter(Boolean);
  const imageGenerationNames = imageGenerationFields
    .map((field) => field.name)
    .filter(Boolean);
  const defaultProviderField = findField(
    imageGenerationFields,
    "defaultProvider",
  );
  const defaultProviderOptions = (defaultProviderField.options || []).map(
    (option) => option.value,
  );

  assert.ok(meshyNames.includes("textTo3DAiModel"));
  assert.ok(meshyNames.includes("imageTo3DAiModel"));
  assert.ok(meshyNames.includes("apiKeyMode"));
  assert.ok(meshyNames.includes("apiKey"));
  assert.ok(meshyNames.includes("multiImageEnabled"));
  assert.ok(meshyNames.includes("maxConcurrentTasks"));
  assert.ok(meshyNames.includes("pricing"));
  assert.ok(meshyNames.includes("targetFormats"));
  assert.ok(imageGenerationNames.includes("maxConcurrentTasks"));
  assert.ok(imageGenerationNames.includes("official"));
  assert.ok(imageGenerationNames.includes("thirdParty"));
  assert.ok(imageGenerationNames.includes("openAICompatible"));
  assert.ok(imageGenerationNames.includes("defaultPrompt"));
  assert.ok(defaultProviderOptions.includes("openai-compatible"));
});

test("OpenAI-compatible image generation uses saved admin override values when provided", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    baseURL: process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL,
    compatibleKey: process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY,
    compatibleModel: process.env.OPENAI_IMAGE_COMPATIBLE_MODEL,
    compatibleSize: process.env.OPENAI_IMAGE_COMPATIBLE_SIZE,
    genericKey: process.env.OPENAI_API_KEY,
  };
  let capturedInput = "";
  let capturedInit: RequestInit | undefined;

  process.env.OPENAI_API_KEY = "env-generic-key";
  process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY = "env-compatible-key";
  process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL = "https://env.example/v1";
  process.env.OPENAI_IMAGE_COMPATIBLE_MODEL = "env-image-model";
  process.env.OPENAI_IMAGE_COMPATIBLE_SIZE = "2048x2048";

  globalThis.fetch = (async (input, init) => {
    capturedInput = String(input);
    capturedInit = init;

    return new Response(
      JSON.stringify({
        data: [
          {
            b64_json: Buffer.from("image-bytes").toString("base64"),
            mime_type: "image/png",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "admin-image-model",
                size: "512x512",
              },
              timeoutSeconds: 30,
            },
          }),
        },
      } as never,
    });

    const headers = capturedInit?.headers as Record<string, string> | undefined;
    const requestBody = JSON.parse(
      typeof capturedInit?.body === "string" ? capturedInit.body : "{}",
    ) as Record<string, unknown>;

    assert.equal(capturedInput, "https://admin.example/v1/images/generations");
    assert.equal(headers?.Authorization, "Bearer admin-key");
    assert.equal(requestBody.model, "admin-image-model");
    assert.equal(requestBody.size, "512x512");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("OPENAI_API_KEY", originalEnv.genericKey);
    restoreEnv("OPENAI_IMAGE_COMPATIBLE_API_KEY", originalEnv.compatibleKey);
    restoreEnv("OPENAI_IMAGE_COMPATIBLE_BASE_URL", originalEnv.baseURL);
    restoreEnv("OPENAI_IMAGE_COMPATIBLE_MODEL", originalEnv.compatibleModel);
    restoreEnv("OPENAI_IMAGE_COMPATIBLE_SIZE", originalEnv.compatibleSize);
  }
});

test("OpenAI-compatible image generation accepts Responses image_generation_call JSON payloads", async () => {
  const originalFetch = globalThis.fetch;
  const imageBase64 = Buffer.alloc(96, 7).toString("base64");
  let capturedInput = "";

  globalThis.fetch = (async (input) => {
    capturedInput = String(input);

    return new Response(
      JSON.stringify({
        output: [
          {
            output_format: "png",
            result: imageBase64,
            type: "image_generation_call",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    const result = await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: makeOpenAICompatibleReq(),
    });

    assert.equal(capturedInput, "https://admin.example/v1/images/generations");
    assert.equal(result.image.data, imageBase64);
    assert.equal(result.image.mimeType, "image/png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image generation accepts Responses SSE image_generation_call payloads", async () => {
  const originalFetch = globalThis.fetch;
  const imageBase64 = Buffer.alloc(96, 9).toString("base64");

  globalThis.fetch = (async () => {
    const event = {
      item: {
        output_format: "webp",
        result: imageBase64,
        type: "image_generation_call",
      },
      type: "response.output_item.done",
    };

    return new Response(
      `event: response.output_item.done\ndata: ${JSON.stringify(event)}\n\n`,
      {
        headers: {
          "content-type": "text/event-stream",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    const result = await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: makeOpenAICompatibleReq(),
    });

    assert.equal(result.image.data, imageBase64);
    assert.equal(result.image.mimeType, "image/webp");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image generation default timeout allows slow provider queues", async () => {
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  let capturedTimeoutMs = 0;

  AbortSignal.timeout = ((ms: number) => {
    capturedTimeoutMs = ms;
    return new AbortController().signal;
  }) as typeof AbortSignal.timeout;

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        data: [
          {
            b64_json: Buffer.alloc(96, 10).toString("base64"),
            mime_type: "image/png",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "admin-image-model",
              },
            },
          }),
        },
      } as never,
    });

    assert.equal(capturedTimeoutMs, 600_000);
  } finally {
    AbortSignal.timeout = originalTimeout;
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image generation lifts the legacy 60 second timeout floor", async () => {
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  let capturedTimeoutMs = 0;

  AbortSignal.timeout = ((ms: number) => {
    capturedTimeoutMs = ms;
    return new AbortController().signal;
  }) as typeof AbortSignal.timeout;

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        data: [
          {
            b64_json: Buffer.alloc(96, 14).toString("base64"),
            mime_type: "image/png",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "admin-image-model",
              },
              timeoutSeconds: 60,
            },
          }),
        },
      } as never,
    });

    assert.equal(capturedTimeoutMs, 600_000);
  } finally {
    AbortSignal.timeout = originalTimeout;
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible gpt-image-2 generation sends documented image options", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: Record<string, unknown> = {};

  globalThis.fetch = (async (_input, init) => {
    capturedBody = JSON.parse(
      typeof init?.body === "string" ? init.body : "{}",
    ) as Record<string, unknown>;

    return new Response(
      JSON.stringify({
        data: [
          {
            b64_json: Buffer.alloc(96, 12).toString("base64"),
            mime_type: "image/png",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    await generateProviderImage({
      inputMode: "text",
      prompt: "Arcane tavern symbol",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "gpt-image-2",
                size: "512x512",
              },
              timeoutSeconds: 30,
            },
          }),
        },
      } as never,
    });

    assert.equal(capturedBody.quality, "auto");
    assert.equal(capturedBody.output_format, "png");
    assert.equal(capturedBody.response_format, "url");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image generation redacts base64 image payloads from provider errors", async () => {
  const originalFetch = globalThis.fetch;
  const leakedBase64 = Buffer.alloc(256, 11).toString("base64");

  globalThis.fetch = (async () => {
    return new Response(
      `invalid SSE data JSON: "{\\"type\\":\\"response.output_item.done\\",\\"item\\":{\\"type\\":\\"not_image\\",\\"result\\":\\"${leakedBase64}\\"}}"`,
      {
        headers: {
          "content-type": "text/plain",
        },
        status: 500,
      },
    );
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generateProviderImage({
          inputMode: "text",
          prompt: "Arcane tavern symbol",
          provider: "openai-compatible",
          req: makeOpenAICompatibleReq(),
        }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.match(
          error.message,
          /OpenAI-compatible image generation failed/,
        );
        assert.match(error.message, /\[redacted-base64-image\]/);
        assert.equal(error.message.includes(leakedBase64), false);
        assert.ok(error.message.length < 1400);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image generation reports concise provider error JSON details", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: "internal_server_error",
          message: "stream disconnected before completion",
          type: "server_error",
        },
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 500,
      },
    );
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generateProviderImage({
          inputMode: "text",
          prompt: "Arcane tavern symbol",
          provider: "openai-compatible",
          req: makeOpenAICompatibleReq(),
        }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "OpenAI-compatible image generation failed: stream disconnected before completion server_error internal_server_error",
        );
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image edits prefer image_url JSON and do not fall back to text", async () => {
  const originalFetch = globalThis.fetch;
  const imageBase64 = Buffer.alloc(96, 17).toString("base64");
  const calls: string[] = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    calls.push(url);

    if (url.endsWith("/images/edits")) {
      if (typeof init?.body === "string") {
        const body = JSON.parse(init.body) as {
          images?: Array<{ image_url?: string }>;
        };

        assert.equal(
          body.images?.[0]?.image_url,
          "https://source.example/reference.jpg",
        );

        return new Response(
          JSON.stringify({
            data: [
              {
                b64_json: imageBase64,
                mime_type: "image/png",
              },
            ],
          }),
          {
            headers: {
              "content-type": "application/json",
            },
            status: 200,
          },
        );
      }

      throw new Error(
        "OpenAI-compatible image edits should prefer JSON image_url requests.",
      );
    }

    throw new Error(`Unexpected fetch URL ${url}`);
  }) as typeof fetch;

  try {
    const result = await generateProviderImage({
      inputMode: "image",
      prompt: "Red mechanical miniature",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "admin-image-model",
                size: "512x512",
              },
              timeoutSeconds: 30,
            },
          }),
          logger: {
            warn: () => undefined,
          },
        },
      } as never,
      sourceImageAsset: {
        publicUrl: "https://source.example/reference.jpg",
      },
    });

    assert.deepEqual(calls, ["https://admin.example/v1/images/edits"]);
    assert.equal(result.image.data, imageBase64);
    assert.equal(result.image.mimeType, "image/png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image edits require a non-empty effective prompt before provider dispatch", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("Image edit requests without an effective prompt must not reach the provider.");
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generateProviderImage({
          inputMode: "image",
          prompt: "   ",
          provider: "openai-compatible",
          req: makeOpenAICompatibleReq(),
          sourceImageAsset: {
            publicUrl: "https://source.example/reference.jpg",
          },
        }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Image-to-image generation requires an effective prompt.",
        );
        return true;
      },
    );

    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible image edits retry multipart when image_url JSON format is rejected", async () => {
  const originalFetch = globalThis.fetch;
  const imageBase64 = Buffer.alloc(96, 13).toString("base64");
  const calls: string[] = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    calls.push(url);

    if (url === "https://source.example/reference.jpg") {
      return new Response(Buffer.from("source-image"), {
        headers: {
          "content-type": "image/jpeg",
        },
        status: 200,
      });
    }

    if (url.endsWith("/images/edits")) {
      if (typeof init?.body === "string") {
        const headers = init?.headers as Record<string, string> | undefined;
        const body = JSON.parse(init.body) as {
          images?: Array<{ image_url?: string }>;
          model?: string;
          prompt?: string;
          size?: string;
        };

        assert.equal(headers?.["Content-Type"], "application/json");
        assert.equal(body.model, "admin-image-model");
        assert.equal(body.prompt, "Red mechanical miniature");
        assert.equal(body.size, "512x512");
        assert.equal(
          body.images?.[0]?.image_url,
          "https://source.example/reference.jpg",
        );

        return new Response(
          JSON.stringify({
            error: {
              message:
                "Unsupported JSON image_url body; send multipart form-data.",
              type: "invalid_request_error",
            },
          }),
          {
            headers: {
              "content-type": "application/json",
            },
            status: 400,
          },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              b64_json: imageBase64,
              mime_type: "image/png",
            },
          ],
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      );
    }

    throw new Error(`Unexpected fetch URL ${url}`);
  }) as typeof fetch;

  try {
    const result = await generateProviderImage({
      inputMode: "image",
      prompt: "Red mechanical miniature",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "admin-image-model",
                size: "512x512",
              },
              timeoutSeconds: 30,
            },
          }),
          logger: {
            warn: () => undefined,
          },
        },
      } as never,
      sourceImageAsset: {
        publicUrl: "https://source.example/reference.jpg",
      },
    });

    assert.deepEqual(calls, [
      "https://admin.example/v1/images/edits",
      "https://source.example/reference.jpg",
      "https://admin.example/v1/images/edits",
    ]);
    assert.equal(result.image.data, imageBase64);
    assert.equal(result.image.mimeType, "image/png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI-compatible gpt-image-2 edits send documented image options", async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody: Record<string, unknown> = {};

  globalThis.fetch = (async (input, init) => {
    const url = String(input);

    if (url.endsWith("/images/edits")) {
      assert.equal(typeof init?.body, "string");
      capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          data: [
            {
              b64_json: Buffer.alloc(96, 19).toString("base64"),
              mime_type: "image/png",
            },
          ],
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      );
    }

    throw new Error(`Unexpected fetch URL ${url}`);
  }) as typeof fetch;

  try {
    await generateProviderImage({
      inputMode: "image",
      prompt: "Red mechanical miniature",
      provider: "openai-compatible",
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: "openai-compatible",
              openAICompatible: {
                apiKey: "admin-key",
                baseURL: "https://admin.example/v1",
                model: "gpt-image-2",
                size: "512x512",
              },
              timeoutSeconds: 30,
            },
          }),
        },
      } as never,
      sourceImageAsset: {
        publicUrl: "https://source.example/reference.jpg",
      },
    });

    const images = capturedBody.images as
      | Array<{ image_url?: string }>
      | undefined;

    assert.equal(capturedBody.quality, "auto");
    assert.equal(capturedBody.output_format, "png");
    assert.equal(capturedBody.response_format, "url");
    assert.equal("input_fidelity" in capturedBody, false);
    assert.equal(
      images?.[0]?.image_url,
      "https://source.example/reference.jpg",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
