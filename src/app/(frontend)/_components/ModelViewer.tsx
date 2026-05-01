"use client";

import { Bounds, Center, Float, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  getModelLoadPhaseDisplay,
  type ModelLoadPhase,
} from "@/lib/modelLoadProgress";

if (typeof window !== "undefined" && "createImageBitmap" in window) {
  // Force GLTFLoader to use classic image loading instead of ImageBitmap for better
  // compatibility with embedded texture blobs in certain browser/driver combinations.
  Reflect.deleteProperty(globalThis, "createImageBitmap");
}

type ModelViewerProps = {
  accent?: "blue" | "violet";
  className?: string;
  label?: string;
  onError?: () => void;
  onReady?: () => void;
  showGround?: boolean;
  showPlaceholderModel?: boolean;
  src?: string | null;
  transparentBackground?: boolean;
};

type ViewerErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError?: () => void;
};

type ViewerErrorBoundaryState = {
  hasError: boolean;
};

class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  componentDidUpdate(prevProps: ViewerErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function CharacterFigure({
  accent = "violet",
}: {
  accent?: "blue" | "violet";
}) {
  const bodyColor = accent === "blue" ? "#5ca8ff" : "#8b6cff";
  const glowColor = accent === "blue" ? "#7ac4ff" : "#b098ff";

  return (
    <Float floatIntensity={1.2} rotationIntensity={0.35} speed={2}>
      <group position={[0, -0.3, 0]}>
        <mesh castShadow position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.42, 48, 48]} />
          <meshStandardMaterial
            color="#f2f6ff"
            metalness={0.15}
            roughness={0.3}
          />
        </mesh>

        <mesh castShadow position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.5, 1.7, 12, 24]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.2}
            roughness={0.35}
          />
        </mesh>

        <mesh
          castShadow
          position={[-0.95, 0.55, 0.05]}
          rotation={[0.2, 0.15, -0.4]}
        >
          <capsuleGeometry args={[0.16, 1.2, 8, 18]} />
          <meshStandardMaterial
            color="#dce6ff"
            metalness={0.35}
            roughness={0.25}
          />
        </mesh>

        <mesh
          castShadow
          position={[0.92, 0.48, 0.1]}
          rotation={[0.1, -0.1, 0.28]}
        >
          <capsuleGeometry args={[0.15, 1.3, 8, 18]} />
          <meshStandardMaterial
            color="#dce6ff"
            metalness={0.42}
            roughness={0.22}
          />
        </mesh>

        <mesh
          castShadow
          position={[-0.55, 0.35, 0.55]}
          rotation={[0.35, 0.15, -0.18]}
        >
          <cylinderGeometry args={[0.12, 0.12, 1.7, 24]} />
          <meshStandardMaterial
            color="#eef4ff"
            metalness={0.62}
            roughness={0.18}
          />
        </mesh>

        <mesh castShadow position={[-0.52, 1.03, 0.62]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.24, 0.52, 24]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>

        <mesh
          castShadow
          position={[0.8, 0.42, 0.5]}
          rotation={[0.2, -0.25, 0.2]}
        >
          <cylinderGeometry args={[0.52, 0.52, 0.16, 40]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.18}
            metalness={0.28}
            roughness={0.36}
          />
        </mesh>

        <mesh
          position={[0, -0.9, 0]}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1.22, 0.045, 16, 100]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

const sharedDracoLoader = new DRACOLoader();
sharedDracoLoader.setDecoderPath("/three-draco/gltf/");

function configureGLTFLoader(loader: GLTFLoader) {
  loader.setCrossOrigin("anonymous");
  loader.setDRACOLoader(sharedDracoLoader);
}

function LoadedModel({ onReady, src }: { onReady?: () => void; src: string }) {
  const gltf = useLoader(GLTFLoader, src, configureGLTFLoader);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    onReady?.();
  }, [onReady, scene]);

  return (
    <Bounds clip fit margin={1.1} observe>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}

type ModelLoadState = {
  objectURL: null | string;
  phase: ModelLoadPhase;
  progress: number;
  source: null | string;
  status: "error" | "idle" | "loading" | "ready";
};

type CachedModelAsset = {
  byteLength: number;
  lastUsedAt: number;
  objectURL: string;
};

type DiskCachedModelAsset = {
  byteLength: number;
  lastUsedAt: number;
};

const MODEL_ASSET_MEMORY_CACHE_MAX_BYTES = 512 * 1024 * 1024;
const MODEL_ASSET_DISK_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024;
const MODEL_ASSET_DISK_CACHE_MAX_ITEM_BYTES = 128 * 1024 * 1024;
const MODEL_ASSET_FETCH_TIMEOUT_MS = 90000;
const MODEL_ASSET_PROXY_FETCH_TIMEOUT_MS = 120000;
const MODEL_ASSET_DISK_CACHE_NAME = "thornstavern-model-viewer-v2";
const MODEL_ASSET_DISK_CACHE_INDEX_KEY =
  "thornstavern:model-viewer-cache-index:v2";
const modelAssetCache = new Map<string, CachedModelAsset>();

async function isValidGLBBlob(blob: Blob) {
  if (blob.size < 20) return false;

  try {
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    return (
      header[0] === 0x67 &&
      header[1] === 0x6c &&
      header[2] === 0x54 &&
      header[3] === 0x46
    );
  } catch {
    return false;
  }
}

function getCachedModelAsset(src: string) {
  const cached = modelAssetCache.get(src);
  if (!cached) return null;

  cached.lastUsedAt = Date.now();
  return cached;
}

function pruneModelAssetCache() {
  let totalBytes = 0;

  for (const cached of modelAssetCache.values()) {
    totalBytes += cached.byteLength;
  }

  if (totalBytes <= MODEL_ASSET_MEMORY_CACHE_MAX_BYTES) return;

  const entries = Array.from(modelAssetCache.entries()).sort(
    ([, a], [, b]) => a.lastUsedAt - b.lastUsedAt,
  );

  for (const [src, cached] of entries) {
    if (totalBytes <= MODEL_ASSET_MEMORY_CACHE_MAX_BYTES) break;

    URL.revokeObjectURL(cached.objectURL);
    modelAssetCache.delete(src);
    totalBytes -= cached.byteLength;
  }
}

function cacheModelAsset(src: string, objectURL: string, byteLength: number) {
  const previous = modelAssetCache.get(src);
  if (previous) {
    URL.revokeObjectURL(previous.objectURL);
  }

  modelAssetCache.set(src, {
    byteLength,
    lastUsedAt: Date.now(),
    objectURL,
  });
  pruneModelAssetCache();
}

function canUseModelAssetDiskCache() {
  return (
    typeof window !== "undefined" &&
    "caches" in window &&
    window.isSecureContext
  );
}

function getModelAssetDiskCacheKey(src: string) {
  try {
    return new URL(src, window.location.origin).toString();
  } catch {
    return null;
  }
}

function readModelAssetDiskCacheIndex(): Record<string, DiskCachedModelAsset> {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(
      MODEL_ASSET_DISK_CACHE_INDEX_KEY,
    );
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};

    return parsed as Record<string, DiskCachedModelAsset>;
  } catch {
    return {};
  }
}

function writeModelAssetDiskCacheIndex(
  index: Record<string, DiskCachedModelAsset>,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      MODEL_ASSET_DISK_CACHE_INDEX_KEY,
      JSON.stringify(index),
    );
  } catch {
    // Cache metadata is opportunistic; browser quota or privacy settings may block it.
  }
}

async function pruneModelAssetDiskCache() {
  if (!canUseModelAssetDiskCache()) return;

  try {
    const cache = await caches.open(MODEL_ASSET_DISK_CACHE_NAME);
    const index = readModelAssetDiskCacheIndex();
    let totalBytes = Object.values(index).reduce(
      (total, entry) => total + Math.max(0, Number(entry.byteLength) || 0),
      0,
    );

    if (totalBytes <= MODEL_ASSET_DISK_CACHE_MAX_BYTES) return;

    const entries = Object.entries(index).sort(
      ([, a], [, b]) => a.lastUsedAt - b.lastUsedAt,
    );

    for (const [key, entry] of entries) {
      if (totalBytes <= MODEL_ASSET_DISK_CACHE_MAX_BYTES) break;

      await cache.delete(key);
      delete index[key];
      totalBytes -= Math.max(0, Number(entry.byteLength) || 0);
    }

    writeModelAssetDiskCacheIndex(index);
  } catch {
    // Disk cache is a performance layer only. Loading should continue without it.
  }
}

async function getDiskCachedModelAssetBlob(src: string) {
  if (!canUseModelAssetDiskCache()) return null;

  const key = getModelAssetDiskCacheKey(src);
  if (!key) return null;

  try {
    const cache = await caches.open(MODEL_ASSET_DISK_CACHE_NAME);
    const response = await cache.match(key);
    if (!response || !response.ok) return null;

    const blob = await response.blob();
    if (!(await isValidGLBBlob(blob))) {
      await cache.delete(key);
      const index = readModelAssetDiskCacheIndex();
      delete index[key];
      writeModelAssetDiskCacheIndex(index);
      return null;
    }

    const index = readModelAssetDiskCacheIndex();
    index[key] = {
      byteLength: blob.size,
      lastUsedAt: Date.now(),
    };
    writeModelAssetDiskCacheIndex(index);

    return blob;
  } catch {
    return null;
  }
}

async function cacheModelAssetOnDisk(src: string, blob: Blob) {
  if (
    !canUseModelAssetDiskCache() ||
    blob.size <= 0 ||
    blob.size > MODEL_ASSET_DISK_CACHE_MAX_ITEM_BYTES
  )
    return;
  if (!(await isValidGLBBlob(blob))) return;

  const key = getModelAssetDiskCacheKey(src);
  if (!key) return;

  try {
    const storageEstimate = await navigator.storage?.estimate?.();
    const quota = storageEstimate?.quota || 0;
    const usage = storageEstimate?.usage || 0;
    if (quota > 0 && quota - usage < blob.size) {
      await pruneModelAssetDiskCache();
    }

    const cache = await caches.open(MODEL_ASSET_DISK_CACHE_NAME);
    await cache.put(
      key,
      new Response(blob, {
        headers: {
          "Cache-Control": "private, max-age=604800",
          "Content-Type": blob.type || "model/gltf-binary",
          "X-Model-Asset-Byte-Length": String(blob.size),
        },
      }),
    );

    const index = readModelAssetDiskCacheIndex();
    index[key] = {
      byteLength: blob.size,
      lastUsedAt: Date.now(),
    };
    writeModelAssetDiskCacheIndex(index);

    await pruneModelAssetDiskCache();
  } catch {
    // Browser cache writes can fail under quota pressure or private browsing.
  }
}

const idleLoadState: ModelLoadState = {
  objectURL: null,
  phase: "idle",
  progress: 0,
  source: null,
  status: "idle",
};

function ModelLoadingOverlay({
  phase,
  progress,
  status,
}: {
  phase: ModelLoadPhase;
  progress: number;
  status: ModelLoadState["status"];
}) {
  if (status !== "loading") {
    return null;
  }

  const display = getModelLoadPhaseDisplay({
    phase: status === "loading" ? phase : "idle",
    progress,
  });

  return (
    <div className="model-viewer-loading-overlay pointer-events-none absolute inset-x-6 bottom-6 z-20">
      <div className="border border-white/15 bg-black/72 px-4 py-3 shadow-[0_16px_34px_rgba(0,0,0,0.46)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/78">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f3c46d] shadow-[0_0_12px_rgba(243,196,109,0.9)]" />
            {display.label}
          </span>
          <span>{display.progress}%</span>
        </div>
        <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#f3c46d,#ffffff,#9ed2ff)] shadow-[0_0_18px_rgba(243,196,109,0.48)] transition-[width] duration-300 ease-out"
            style={{ width: `${display.progress}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/45">
          {["NETWORK", "VERIFY", "PARSE", "READY"].map((stage) => (
            <span
              className={
                stage === display.stage
                  ? "text-[#f3c46d]"
                  : display.stage === "READY"
                    ? "text-white/65"
                    : ""
              }
              key={stage}
            >
              {stage}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelErrorOverlay({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="model-viewer-error-overlay pointer-events-none absolute inset-x-6 bottom-6 z-20">
      <div className="border border-white/15 bg-black/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70 shadow-[0_12px_26px_rgba(0,0,0,0.42)] backdrop-blur-sm">
        Model Preview Unavailable
      </div>
    </div>
  );
}

function RendererLifecycle() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    return () => {
      try {
        gl.dispose();
        gl.forceContextLoss();
      } catch {
        // Renderer cleanup is best-effort; route transitions should continue normally.
      }
    };
  }, [gl]);

  return null;
}

function getProxyFallbackModelSrc(src: string) {
  try {
    const url = new URL(src, window.location.origin);
    const isModelViewerEndpoint =
      /^\/api\/platform\/models\/[^/]+\/viewer$/.test(url.pathname);

    if (
      !isModelViewerEndpoint ||
      url.searchParams.get("delivery") === "proxy"
    ) {
      return null;
    }

    url.searchParams.set("delivery", "proxy");

    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}`;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function ModelViewer({
  accent = "violet",
  className,
  label,
  onError,
  onReady,
  showGround = true,
  showPlaceholderModel = true,
  src,
  transparentBackground = false,
}: ModelViewerProps) {
  const pointLightColor = accent === "blue" ? "#67b4ff" : "#8b6cff";
  const [loadState, setLoadState] = useState<ModelLoadState>(idleLoadState);
  const activeSrc = loadState.objectURL;
  const frameloop = activeSrc || showPlaceholderModel ? "always" : "demand";
  const fallbackModel = showPlaceholderModel ? (
    <CharacterFigure accent={accent} />
  ) : null;
  const hasSceneModel = Boolean(activeSrc || showPlaceholderModel);
  const handleModelReady = useCallback(() => {
    setLoadState((previous) =>
      previous.objectURL === activeSrc
        ? previous.status === "ready"
          ? previous
          : {
              ...previous,
              phase: "ready",
              progress: 100,
              status: "ready",
            }
        : previous,
    );
    onReady?.();
  }, [activeSrc, onReady]);

  useEffect(() => {
    if (!src) {
      setLoadState(idleLoadState);
      return;
    }

    const modelSrc = src;
    const cached = getCachedModelAsset(modelSrc);
    if (cached) {
      setLoadState({
        objectURL: cached.objectURL,
        phase: "parse",
        progress: 99,
        source: modelSrc,
        status: "loading",
      });
      return;
    }

    let canceled = false;
    const controller = new AbortController();

    setLoadState(() => {
      return {
        objectURL: null,
        phase: "cache",
        progress: 3,
        source: modelSrc,
        status: "loading",
      };
    });

    async function fetchModelBlob(
      fetchSrc: string,
      timeoutMs = MODEL_ASSET_FETCH_TIMEOUT_MS,
    ) {
      const requestController = new AbortController();
      const abortRequest = () => requestController.abort();
      const timeout = window.setTimeout(abortRequest, timeoutMs);

      if (controller.signal.aborted) {
        requestController.abort();
      } else {
        controller.signal.addEventListener("abort", abortRequest, {
          once: true,
        });
      }

      try {
        const response = await fetch(fetchSrc, {
          cache: "force-cache",
          priority: "high",
          signal: requestController.signal,
        } as RequestInit & { priority: "high" });

        if (!response.ok || !response.body) {
          throw new Error(`MODEL_FETCH_FAILED:${response.status}`);
        }

        const contentLength = Number(
          response.headers.get("content-length") || 0,
        );
        const contentType =
          response.headers.get("content-type") || "model/gltf-binary";
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          chunks.push(value);
          receivedLength += value.length;

          if (!canceled) {
            const nextProgress =
              contentLength > 0
                ? Math.max(
                    3,
                    Math.min(
                      98,
                      Math.round((receivedLength / contentLength) * 100),
                    ),
                  )
                : Math.max(
                    3,
                    Math.min(
                      85,
                      3 +
                        Math.round(Math.log2(receivedLength / 65536 + 1) * 12),
                    ),
                  );
            setLoadState((previous) =>
              previous.source === modelSrc && previous.status === "loading"
                ? {
                    ...previous,
                    phase: "download",
                    progress: nextProgress,
                  }
                : previous,
            );
          }
        }

        const blob = new Blob(chunks, { type: contentType });
        if (!canceled) {
          setLoadState((previous) =>
            previous.source === modelSrc && previous.status === "loading"
              ? {
                  ...previous,
                  phase: "validate",
                  progress: 84,
                }
              : previous,
          );
        }
        if (!(await isValidGLBBlob(blob))) {
          throw new Error("MODEL_FETCH_INVALID_GLB");
        }

        return blob;
      } finally {
        window.clearTimeout(timeout);
        controller.signal.removeEventListener("abort", abortRequest);
      }
    }

    async function loadModelAsset() {
      try {
        let blob: Blob;

        const diskCachedBlob = await getDiskCachedModelAssetBlob(modelSrc);
        if (diskCachedBlob) {
          const objectURL = URL.createObjectURL(diskCachedBlob);

          if (canceled) {
            URL.revokeObjectURL(objectURL);
            return;
          }

          cacheModelAsset(modelSrc, objectURL, diskCachedBlob.size);

          setLoadState({
            objectURL,
            phase: "parse",
            progress: 99,
            source: modelSrc,
            status: "loading",
          });
          return;
        }

        try {
          blob = await fetchModelBlob(modelSrc);
        } catch (error) {
          const fallbackSrc = getProxyFallbackModelSrc(modelSrc);
          if (!fallbackSrc || controller.signal.aborted) {
            throw error;
          }

          setLoadState((previous) =>
            previous.source === modelSrc && previous.status === "loading"
              ? {
                  ...previous,
                  phase: "download",
                  progress: 3,
                }
              : previous,
          );
          blob = await fetchModelBlob(
            fallbackSrc,
            MODEL_ASSET_PROXY_FETCH_TIMEOUT_MS,
          );
        }
        const objectURL = URL.createObjectURL(blob);

        if (canceled) {
          URL.revokeObjectURL(objectURL);
          return;
        }

        cacheModelAsset(modelSrc, objectURL, blob.size);
        void cacheModelAssetOnDisk(modelSrc, blob);

        setLoadState({
          objectURL,
          phase: "parse",
          progress: 99,
          source: modelSrc,
          status: "loading",
        });
      } catch {
        if (!canceled) {
          setLoadState({
            objectURL: null,
            phase: "error",
            progress: 0,
            source: modelSrc,
            status: "error",
          });
          onError?.();
        }
      }
    }

    void loadModelAsset();

    return () => {
      canceled = true;
      controller.abort();
    };
  }, [src]);

  useEffect(() => {
    THREE.Cache.enabled = true;

    if (activeSrc) {
      useLoader.preload(GLTFLoader, activeSrc, configureGLTFLoader);
    }
  }, [activeSrc]);

  return (
    <div
      className={className}
      style={{
        contain: "layout paint",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ fov: 36, position: [0, 1.6, 5.4] }}
        dpr={activeSrc ? [1, 1.2] : [1, 1.5]}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: transparentBackground,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          if (transparentBackground) {
            gl.setClearColor(0x000000, 0);
            gl.setClearAlpha(0);
          }
        }}
        style={
          transparentBackground ? { background: "transparent" } : undefined
        }
      >
        <RendererLifecycle />
        {transparentBackground ? null : (
          <color attach="background" args={["#0a101b"]} />
        )}
        {transparentBackground ? null : (
          <fog attach="fog" args={["#0a101b", 8, 14]} />
        )}
        <ambientLight intensity={1.35} />
        <directionalLight intensity={2.1} position={[4, 6, 5]} />
        <pointLight
          color={pointLightColor}
          intensity={6.5}
          position={[-3, 2, 2]}
        />
        <spotLight
          angle={0.45}
          color="#dfe8ff"
          intensity={8}
          penumbra={0.55}
          position={[0, 6, 2]}
        />

        <ViewerErrorBoundary
          fallback={fallbackModel}
          onError={() => {
            setLoadState((previous) => ({
              ...previous,
              objectURL: null,
              status: "error",
            }));
            onError?.();
          }}
        >
          <Suspense fallback={fallbackModel}>
            {activeSrc ? (
              <LoadedModel onReady={handleModelReady} src={activeSrc} />
            ) : (
              fallbackModel
            )}
          </Suspense>
        </ViewerErrorBoundary>

        {hasSceneModel && showGround ? (
          <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3.2, 64]} />
            <meshStandardMaterial color="#0e1728" />
          </mesh>
        ) : null}

        <OrbitControls
          autoRotate={false}
          enableDamping={false}
          enablePan={false}
          enabled={hasSceneModel}
          maxDistance={7}
          minDistance={2.2}
        />
      </Canvas>

      {label ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/10 bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
          {label}
        </div>
      ) : null}
      <ModelLoadingOverlay
        phase={loadState.phase}
        progress={loadState.progress}
        status={loadState.status}
      />
      <ModelErrorOverlay visible={loadState.status === "error"} />
    </div>
  );
}
