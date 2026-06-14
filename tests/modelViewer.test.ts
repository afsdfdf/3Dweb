import assert from "node:assert/strict";
import test from "node:test";

import { Models } from "../src/collections/Models.ts";
import {
  modelViewerEndpoint,
  __setModelViewerEndpointTestHooks,
} from "../src/endpoints/modelViewer.ts";
import { _resetKVStore } from "../src/lib/kvStore.ts";

const createLogger = () => ({
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
});

test("public model viewer endpoint is rate limited for anonymous preview traffic", async () => {
  const previousLimit = process.env.MODEL_PREVIEW_RATE_LIMIT_MAX;
  const previousWindow = process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS;

  process.env.MODEL_PREVIEW_RATE_LIMIT_MAX = "1";
  process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS = "60000";
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async () => "https://assets.example.com/model.glb",
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "https://assets.example.com/model.glb",
    }),
    resolveModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "https://assets.example.com/model.glb",
    }),
  });

  const payload = {
    findByID: async ({ overrideAccess }: { overrideAccess?: boolean }) => {
      if (overrideAccess) {
        return {
          formats: [
            {
              file: {
                mimeType: "model/gltf-binary",
                url: "https://assets.example.com/model.glb",
              },
              format: "glb",
            },
          ],
          id: 5,
          visibility: "public",
        };
      }

      return {
        formats: [
          {
            format: "glb",
          },
        ],
        id: 5,
        visibility: "public",
      };
    },
    logger: createLogger(),
  };

  try {
    const first = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    const second = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    assert.equal(first.status, 302);
    assert.equal(
      first.headers.get("Location"),
      "https://assets.example.com/model.glb",
    );
    assert.equal(second.status, 429);
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();

    if (previousLimit === undefined) {
      delete process.env.MODEL_PREVIEW_RATE_LIMIT_MAX;
    } else {
      process.env.MODEL_PREVIEW_RATE_LIMIT_MAX = previousLimit;
    }

    if (previousWindow === undefined) {
      delete process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  }
});

test("model viewer endpoint redirects relative media URLs against the current local dev origin", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async () => null,
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "/api/media/file/model.glb",
    }),
    resolveModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "/api/media/file/model.glb",
    }),
  });

  const payload = {
    findByID: async ({ overrideAccess }: { overrideAccess?: boolean }) => {
      if (overrideAccess) {
        return {
          formats: [
            {
              file: {
                mimeType: "model/gltf-binary",
                url: "/api/media/file/model.glb",
              },
              format: "glb",
            },
          ],
          id: 5,
          visibility: "public",
        };
      }

      return {
        formats: [
          {
            format: "glb",
          },
        ],
        id: 5,
        visibility: "public",
      };
    },
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
      url: "http://localhost:3005/api/platform/models/5/viewer?format=glb",
    } as never);

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "http://localhost:3005/api/media/file/model.glb",
    );
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("public model viewer endpoint prefers optimized preview assets", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async ({ url }) => String(url),
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      optimizedFileId: 20,
      optimizedMimeType: "model/gltf-binary",
      optimizedUrl: "https://assets.example.com/model.preview.glb",
      url: "https://assets.example.com/model.original.glb",
    }),
  });

  const payload = {
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://assets.example.com/model.preview.glb",
    );
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("public model viewer endpoint supports original quality override", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async ({ url }) => String(url),
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      optimizedFileId: 20,
      optimizedMimeType: "model/gltf-binary",
      optimizedUrl: "https://assets.example.com/model.preview.glb",
      url: "https://assets.example.com/model.original.glb",
    }),
  });

  const payload = {
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
        quality: "original",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://assets.example.com/model.original.glb",
    );
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("public model viewer endpoint falls back when optimized preview is blocked", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async ({ url }) => String(url),
    isAllowedRemoteAssetURL: async ({ url }) =>
      String(url) === "https://assets.example.com/model.original.glb",
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      optimizedFileId: 20,
      optimizedMimeType: "model/gltf-binary",
      optimizedUrl: "https://blocked.example.com/model.preview.glb",
      url: "https://assets.example.com/model.original.glb",
    }),
  });

  const payload = {
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://assets.example.com/model.original.glb",
    );
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("public model viewer endpoint does not fall through to private media for anonymous public models", async () => {
  _resetKVStore();
  let findByIDCalls = 0;

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async () => "https://assets.example.com/private.glb",
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      publicAccess: false,
      purpose: "asset",
      url: "https://assets.example.com/private.glb",
    }),
  });

  const payload = {
    findByID: async () => {
      findByIDCalls += 1;
      return {
        formats: [
          {
            file: {
              mimeType: "model/gltf-binary",
              publicAccess: false,
              url: "https://assets.example.com/private.glb",
            },
            format: "glb",
          },
        ],
        id: 5,
        visibility: "public",
      };
    },
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(findByIDCalls, 0);
    assert.match(body.message, /public.*asset/i);
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("model viewer endpoint supports explicit proxy fallback delivery", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    fetch: async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          "Content-Length": "3",
        },
        status: 200,
      }),
    getMediaAccessURL: async () => "https://assets.example.com/model.glb",
    isAllowedRemoteAssetURL: async () => true,
    resolvePublicModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "https://assets.example.com/model.glb",
    }),
    resolveModelFormatAsset: async () => ({
      fileId: 10,
      mimeType: "model/gltf-binary",
      url: "https://assets.example.com/model.glb",
    }),
  });

  const payload = {
    findByID: async () => ({
      formats: [
        {
          file: {
            mimeType: "model/gltf-binary",
            url: "https://assets.example.com/model.glb",
          },
          format: "glb",
        },
      ],
      id: 5,
      visibility: "public",
    }),
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        delivery: "proxy",
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
    } as never);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Length"), "3");
    assert.equal(response.headers.get("Content-Type"), "model/gltf-binary");
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("authenticated model viewer endpoint prefers optimized preview assets", async () => {
  _resetKVStore();

  __setModelViewerEndpointTestHooks({
    getMediaAccessURL: async ({ url }) => String(url),
    isAllowedRemoteAssetURL: async () => true,
  });

  const payload = {
    findByID: async ({ depth, overrideAccess }: { depth?: number; overrideAccess?: boolean }) => {
      if (overrideAccess && depth === 2) {
        return {
          formats: [
            {
              file: {
                mimeType: "model/gltf-binary",
                url: "https://assets.example.com/model.original.glb",
              },
              format: "glb",
            },
          ],
          id: 5,
          viewerOptimization: {
            previewFile: {
              mimeType: "model/gltf-binary",
              url: "https://assets.example.com/model.preview.glb",
            },
            status: "succeeded",
          },
          visibility: "private",
        };
      }

      return {
        formats: [
          {
            format: "glb",
          },
        ],
        id: 5,
        visibility: "private",
      };
    },
    logger: createLogger(),
  };

  try {
    const response = await modelViewerEndpoint.handler({
      headers: new Headers({
        "user-agent": "viewer-test/1.0",
      }),
      payload,
      query: {
        format: "glb",
      },
      routeParams: {
        modelId: "5",
      },
      user: {
        id: 7,
      },
    } as never);

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://assets.example.com/model.preview.glb",
    );
  } finally {
    __setModelViewerEndpointTestHooks(null);
    _resetKVStore();
  }
});

test("public model docs do not expose sensitive file and viewer URL fields to anonymous readers", () => {
  const formatsField = Models.fields.find(
    (field) => "name" in field && field.name === "formats",
  );
  assert.ok(formatsField && "fields" in formatsField);

  const fileField = formatsField.fields.find(
    (field) => "name" in field && field.name === "file",
  );
  const viewerUrlField = Models.fields.find(
    (field) => "name" in field && field.name === "viewerUrl",
  );

  assert.ok(fileField && "access" in fileField && fileField.access?.read);
  assert.ok(
    viewerUrlField && "access" in viewerUrlField && viewerUrlField.access?.read,
  );

  const anonymousArgs = {
    doc: {
      owner: 9,
    },
    req: {
      user: null,
    },
  } as never;

  assert.equal(fileField.access?.read?.(anonymousArgs), false);
  assert.equal(viewerUrlField.access?.read?.(anonymousArgs), false);
});
