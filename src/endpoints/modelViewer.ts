import type { PayloadRequest } from "payload";

import { rejectRateLimitedEndpoint } from "@/lib/endpointRateLimit";
import { getModelGLBSourceURL } from "@/lib/modelAssetURL";
import { queryPostgres } from "@/lib/postgres";
import { isAllowedRemoteAssetURL } from "@/lib/remoteAssetSecurity";
import { getMediaAccessURL } from "@/lib/s3SignedURL";

const defaultMimeTypeByFormat: Record<string, string> = {
  glb: "model/gltf-binary",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const isPublicSupabaseStorageURL = (value: string) => {
  try {
    const parsed = new URL(value);
    return (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
};

const isConfiguredPublicSupabaseStorageURL = (value: string) => {
  try {
    const parsed = new URL(value);
    const configuredSupabaseURL = normalizeText(process.env.SUPABASE_URL);
    if (!configuredSupabaseURL) return false;

    const configured = new URL(configuredSupabaseURL);
    return (
      parsed.hostname === configured.hostname &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
};

const isPublicModel = (model: unknown) => {
  return isRecord(model) && model.visibility === "public";
};

const getRequestOrigin = (req: PayloadRequest) => {
  if (typeof req.url !== "string") {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost || req.headers.get("host");
    if (!host) return null;

    const forwardedProto = req.headers.get("x-forwarded-proto");
    const protocol = forwardedProto || "http";

    return `${protocol}://${host}`;
  }

  try {
    return new URL(req.url).origin;
  } catch {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost || req.headers.get("host");
    if (!host) return null;

    const forwardedProto = req.headers.get("x-forwarded-proto");
    const protocol = forwardedProto || "http";

    return `${protocol}://${host}`;
  }
};

const resolveFetchURL = (req: PayloadRequest, value: string) => {
  if (value.startsWith("/")) {
    const requestOrigin = getRequestOrigin(req);
    const baseURL = requestOrigin || "http://localhost:3000";

    return new URL(value, baseURL).toString();
  }

  return value;
};

const buildUpstreamHeaders = (req: PayloadRequest, value: string) => {
  if (!value.startsWith("/")) {
    return undefined;
  }

  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  const authorization = req.headers.get("authorization");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (authorization) {
    headers.set("authorization", authorization);
  }

  return headers;
};

const getMimeType = (fileRelation: unknown, format: string) => {
  if (
    fileRelation &&
    typeof fileRelation === "object" &&
    "mimeType" in fileRelation &&
    typeof fileRelation.mimeType === "string"
  ) {
    return fileRelation.mimeType;
  }

  return defaultMimeTypeByFormat[format] || "application/octet-stream";
};

async function fetchModelAsset(
  req: PayloadRequest,
  url: string,
  accessURL: string,
) {
  const fetchImpl = modelViewerEndpointTestHooks?.fetch || fetch;

  const response = await fetchImpl(url, {
    headers: buildUpstreamHeaders(req, accessURL),
  });

  if (response.ok && response.body) {
    return response;
  }

  throw new Error(`ASSET_FETCH_FAILED:${response.status}`);
}

type ResolvedModelFormatAsset = {
  fileId: number | null;
  mimeType: null | string;
  url: null | string;
};

async function resolvePublicModelFormatAsset(
  modelId: number,
  format: string,
): Promise<ResolvedModelFormatAsset | null> {
  const result = await queryPostgres<{
    fileId: number | null;
    mimeType: string | null;
    url: string | null;
  }>(
    `
      select
        mf.file_id as "fileId",
        media.mime_type as "mimeType",
        media.url
      from models
      inner join models_formats mf on mf._parent_id = models.id
      left join media on media.id = mf.file_id
      where models.id = $1
        and models.visibility = 'public'
        and lower(mf.format::text) = $2
      order by mf._order asc
      limit 1
    `,
    [modelId, format],
  );

  return result.rows[0] ?? null;
}

async function resolveModelFormatAsset(
  modelId: number,
  format: string,
): Promise<ResolvedModelFormatAsset | null> {
  const result = await queryPostgres<{
    fileId: number | null;
    mimeType: string | null;
    url: string | null;
  }>(
    `
      select
        mf.file_id as "fileId",
        media.mime_type as "mimeType",
        media.url
      from models_formats mf
      left join media on media.id = mf.file_id
      where mf._parent_id = $1
        and lower(mf.format::text) = $2
      order by mf._order asc
      limit 1
    `,
    [modelId, format],
  );

  return result.rows[0] ?? null;
}

const getSelectedFormat = (model: unknown, format: string) => {
  if (!isRecord(model) || !Array.isArray(model.formats)) return null;

  return (
    model.formats.find(
      (item) =>
        isRecord(item) && String(item.format || "").toLowerCase() === format,
    ) || null
  );
};

const getMediaURLFromFormatFile = async (
  req: PayloadRequest,
  file: unknown,
) => {
  if (isRecord(file)) {
    return normalizeText(file.url);
  }

  const mediaId =
    typeof file === "number" || typeof file === "string" ? Number(file) : 0;
  if (!Number.isFinite(mediaId) || mediaId <= 0) return null;

  try {
    const media = await req.payload.findByID({
      collection: "media",
      depth: 0,
      id: mediaId,
      overrideAccess: true,
      req,
    });

    return normalizeText(media.url);
  } catch {
    return null;
  }
};

type ModelViewerEndpointTestHooks = {
  fetch?: typeof fetch;
  getMediaAccessURL?: typeof getMediaAccessURL;
  isAllowedRemoteAssetURL?: typeof isAllowedRemoteAssetURL;
  resolvePublicModelFormatAsset?: typeof resolvePublicModelFormatAsset;
  resolveModelFormatAsset?: typeof resolveModelFormatAsset;
};

let modelViewerEndpointTestHooks: ModelViewerEndpointTestHooks | null = null;

export function __setModelViewerEndpointTestHooks(
  hooks: ModelViewerEndpointTestHooks | null,
) {
  modelViewerEndpointTestHooks = hooks;
}

export const modelViewerEndpoint = {
  handler: async (req: PayloadRequest) => {
    const modelId = Number(String(req.routeParams?.modelId ?? "0"));
    const format = String(req.query?.format ?? "glb").toLowerCase();
    const deliveryMode = String(
      req.query?.delivery ?? "redirect",
    ).toLowerCase();

    if (!Number.isFinite(modelId) || modelId <= 0) {
      return Response.json({ message: "Invalid model id." }, { status: 400 });
    }

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "model-preview",
    });

    if (rateLimited) {
      return rateLimited;
    }

    if (format !== "glb") {
      return Response.json(
        { message: "Only GLB viewer assets are supported." },
        { status: 400 },
      );
    }

    if (!req.user) {
      let publicFormatAsset: ResolvedModelFormatAsset | null = null;

      try {
        publicFormatAsset = await (
          modelViewerEndpointTestHooks?.resolvePublicModelFormatAsset ||
          resolvePublicModelFormatAsset
        )(modelId, format);
      } catch (error) {
        req.payload.logger.warn({
          error: error instanceof Error ? error.message : String(error),
          modelId,
          msg: "Model viewer public fast-path lookup failed.",
        });
      }

      const publicSourceURL = normalizeText(publicFormatAsset?.url);
      if (publicSourceURL) {
        const allowedPublicSource =
          publicSourceURL.startsWith("/") ||
          isConfiguredPublicSupabaseStorageURL(publicSourceURL) ||
          (await (
            modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL ||
            isAllowedRemoteAssetURL
          )({
            payload: req.payload,
            url: publicSourceURL,
          }));

        if (!allowedPublicSource) {
          req.payload.logger.warn({
            modelId,
            msg: "Blocked model viewer public fast path because host is not on the allowlist.",
            sourceURL: publicSourceURL,
          });

          return Response.json(
            { message: "The model asset source is not allowed for viewing." },
            { status: 403 },
          );
        }

        const accessURL = isPublicSupabaseStorageURL(publicSourceURL)
          ? publicSourceURL
          : (await (
              modelViewerEndpointTestHooks?.getMediaAccessURL ||
              getMediaAccessURL
            )({
              payload: req.payload,
              ttlSeconds: 3600,
              url: publicSourceURL,
            })) || publicSourceURL;

        const fetchURL = resolveFetchURL(req, accessURL);
        const allowedFetchTarget =
          accessURL.startsWith("/") ||
          isConfiguredPublicSupabaseStorageURL(fetchURL) ||
          (await (
            modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL ||
            isAllowedRemoteAssetURL
          )({
            payload: req.payload,
            url: fetchURL,
          }));

        if (!allowedFetchTarget) {
          return Response.json(
            { message: "The model asset source is not allowed for viewing." },
            { status: 403 },
          );
        }

        if (deliveryMode === "proxy") {
          let upstream: Response;
          try {
            upstream = await fetchModelAsset(req, fetchURL, accessURL);
          } catch (error) {
            req.payload.logger.warn({
              error: error instanceof Error ? error.message : String(error),
              modelId,
              msg: "Model viewer public fast-path proxy fetch failed before a response was available.",
            });

            return Response.json(
              { message: "The model asset is temporarily unavailable." },
              { status: 502 },
            );
          }

          return new Response(upstream.body, {
            headers: {
              "Cache-Control": "public, max-age=300",
              ...(upstream.headers.get("Content-Length")
                ? {
                    "Content-Length": upstream.headers.get(
                      "Content-Length",
                    ) as string,
                  }
                : {}),
              "Content-Type":
                publicFormatAsset?.mimeType ||
                defaultMimeTypeByFormat[format] ||
                "application/octet-stream",
            },
            status: 200,
          });
        }

        return new Response(null, {
          headers: {
            "Cache-Control": isPublicSupabaseStorageURL(accessURL)
              ? "public, max-age=300"
              : "private, no-store",
            Location: fetchURL,
          },
          status: 302,
        });
      }
    }

    let accessCheckedModel: unknown = null;
    try {
      accessCheckedModel = await req.payload.findByID({
        collection: "models",
        depth: 0,
        id: modelId,
        overrideAccess: false,
        req,
        ...(req.user ? { user: req.user } : {}),
      });
    } catch {
      return Response.json(
        {
          message:
            "Model not found or you do not have access to this resource.",
        },
        { status: 404 },
      );
    }

    let model = accessCheckedModel;
    let resolvedFormatAsset: Awaited<
      ReturnType<typeof resolveModelFormatAsset>
    > | null = null;
    let selectedFormat: unknown = null;
    let sourceURL: null | string = null;

    try {
      model = await req.payload.findByID({
        collection: "models",
        depth: 2,
        id: modelId,
        overrideAccess: true,
        req,
      });
    } catch {
      model = accessCheckedModel;
    }

    selectedFormat = getSelectedFormat(model, format);
    const payloadFormatFileURL = await getMediaURLFromFormatFile(
      req,
      isRecord(selectedFormat) ? selectedFormat.file : null,
    );
    sourceURL =
      payloadFormatFileURL ||
      getModelGLBSourceURL({ model }) ||
      getModelGLBSourceURL({ model: accessCheckedModel });

    if (!sourceURL) {
      try {
        resolvedFormatAsset = await (
          modelViewerEndpointTestHooks?.resolveModelFormatAsset ||
          resolveModelFormatAsset
        )(modelId, format);
        sourceURL = resolvedFormatAsset?.url || null;
      } catch (error) {
        req.payload.logger.warn({
          error: error instanceof Error ? error.message : String(error),
          modelId,
          msg: "Model viewer direct format asset lookup failed.",
        });
      }
    }

    if (!sourceURL) {
      return Response.json(
        { message: "No renderable GLB asset is available for this model." },
        { status: 404 },
      );
    }

    const allowedSource = await (
      modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL ||
      isAllowedRemoteAssetURL
    )({
      payload: req.payload,
      url: sourceURL,
    });

    if (!allowedSource) {
      req.payload.logger.warn({
        modelId,
        msg: "Blocked model viewer fetch because host is not on the allowlist.",
        sourceURL,
      });

      return Response.json(
        { message: "The model asset source is not allowed for viewing." },
        { status: 403 },
      );
    }

    const accessURL =
      isPublicModel(model) && isPublicSupabaseStorageURL(sourceURL)
        ? sourceURL
        : (await (
            modelViewerEndpointTestHooks?.getMediaAccessURL || getMediaAccessURL
          )({
            payload: req.payload,
            ttlSeconds: 3600,
            url: sourceURL,
          })) || sourceURL;

    const fetchURL = resolveFetchURL(req, accessURL);
    const allowedFetchTarget =
      accessURL.startsWith("/") ||
      (await (
        modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL ||
        isAllowedRemoteAssetURL
      )({
        payload: req.payload,
        url: fetchURL,
      }));

    if (!allowedFetchTarget) {
      return Response.json(
        { message: "The model asset source is not allowed for viewing." },
        { status: 403 },
      );
    }

    if (deliveryMode === "proxy") {
      let upstream: Response;
      try {
        upstream = await fetchModelAsset(req, fetchURL, accessURL);
      } catch (error) {
        req.payload.logger.warn({
          error: error instanceof Error ? error.message : String(error),
          modelId,
          msg: "Model viewer proxy fetch failed before a response was available.",
        });

        return Response.json(
          { message: "The model asset is temporarily unavailable." },
          { status: 502 },
        );
      }

      const mimeType =
        resolvedFormatAsset?.mimeType ||
        getMimeType(
          isRecord(selectedFormat) ? selectedFormat.file : null,
          format,
        );

      return new Response(upstream.body, {
        headers: {
          "Cache-Control": "private, max-age=300",
          ...(upstream.headers.get("Content-Length")
            ? {
                "Content-Length": upstream.headers.get(
                  "Content-Length",
                ) as string,
              }
            : {}),
          "Content-Type": mimeType,
          Vary: "Cookie, Authorization",
        },
        status: 200,
      });
    }

    return new Response(null, {
      headers: {
        "Cache-Control":
          isPublicModel(model) && isPublicSupabaseStorageURL(accessURL)
            ? "public, max-age=300"
            : "private, no-store",
        Location: fetchURL,
        Vary: "Cookie, Authorization",
      },
      status: 302,
    });
  },
  method: "get" as const,
  path: "/platform/models/:modelId/viewer",
};
