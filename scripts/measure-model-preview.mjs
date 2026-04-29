import { chromium } from "playwright";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_IDS = [1, 20, 42];
const DEFAULT_TIMEOUT_MS = 90_000;

function parseArgs(argv) {
  const args = {
    baseURL: DEFAULT_BASE_URL,
    ids: DEFAULT_IDS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--base" && next) {
      args.baseURL = next.replace(/\/$/, "");
      index += 1;
      continue;
    }

    if (arg === "--ids" && next) {
      args.ids = next
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      index += 1;
      continue;
    }

    if (arg === "--timeout-ms" && next) {
      const parsed = Number(next);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.timeoutMs = parsed;
      }
      index += 1;
    }
  }

  if (args.ids.length === 0) {
    throw new Error("No valid model ids were provided.");
  }

  return args;
}

async function timedFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const startedAt = performance.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return {
      elapsedMs: Math.round(performance.now() - startedAt),
      response,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function measureEndpointChain({ baseURL, id, timeoutMs }) {
  const pageURL = `${baseURL}/model-detail?id=${encodeURIComponent(String(id))}&measure=${Date.now()}`;
  const viewerURL = `${baseURL}/api/platform/models/${encodeURIComponent(String(id))}/viewer?format=glb&measure=${Date.now()}`;
  const page = await timedFetch(pageURL, {}, timeoutMs);
  const viewer = await timedFetch(viewerURL, { redirect: "manual" }, timeoutMs);
  const location = viewer.response.headers.get("location");

  let asset = null;
  if (location) {
    const assetURL = new URL(location, baseURL).toString();
    try {
      const assetResult = await timedFetch(
        assetURL,
        {
          headers: {
            range: "bytes=0-0",
          },
        },
        timeoutMs,
      );
      asset = {
        elapsedMs: assetResult.elapsedMs,
        status: assetResult.response.status,
        url: assetURL,
      };
    } catch (error) {
      asset = {
        elapsedMs: null,
        error: error instanceof Error ? error.message : String(error),
        status: null,
        url: assetURL,
      };
    }
  }

  return {
    page: {
      elapsedMs: page.elapsedMs,
      status: page.response.status,
    },
    viewer: {
      elapsedMs: viewer.elapsedMs,
      location,
      status: viewer.response.status,
    },
    asset,
  };
}

async function measureBrowserModel({ baseURL, browser, id, timeoutMs }) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const t0 = performance.now();
  const times = {};
  const requestKinds = new Map();

  const seconds = () => Number(((performance.now() - t0) / 1000).toFixed(3));

  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });

  await page.addInitScript(async () => {
    try {
      if ("caches" in window) {
        await Promise.all(
          (await caches.keys()).map((key) => caches.delete(key)),
        );
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Cache clearing is best-effort for measurement isolation.
    }
  });

  client.on("Network.requestWillBeSent", (event) => {
    const url = event.request.url;
    if (url.includes("/model-detail")) {
      requestKinds.set(event.requestId, "document");
      times.documentRequest ??= seconds();
    } else if (url.includes(`/api/platform/models/${id}/viewer`)) {
      requestKinds.set(event.requestId, "viewer");
      times.viewerRequest ??= seconds();
    } else if (url.includes("/model.glb")) {
      requestKinds.set(event.requestId, "glb");
      times.glbRequest ??= seconds();
    } else if (url.includes("/preview.jpg")) {
      requestKinds.set(event.requestId, "preview");
      times.firstPreviewRequest ??= seconds();
    }
  });

  client.on("Network.responseReceived", (event) => {
    const kind = requestKinds.get(event.requestId);
    if (kind === "document") times.documentResponse ??= seconds();
    if (kind === "viewer") times.viewerResponse ??= seconds();
    if (kind === "glb") {
      times.glbResponse ??= seconds();
      times.glbContentLength =
        event.response.headers["content-length"] ||
        event.response.headers["Content-Length"] ||
        "";
    }
  });

  client.on("Network.loadingFinished", (event) => {
    const kind = requestKinds.get(event.requestId);
    if (kind === "document") times.documentFinished ??= seconds();
    if (kind === "viewer") times.viewerFinished ??= seconds();
    if (kind === "glb") {
      times.glbFinished ??= seconds();
      times.glbBytes = event.encodedDataLength;
    }
  });

  const finalState = {
    canvasCount: 0,
    errorVisible: false,
    loadingText: "",
    relatedRealImages: 0,
  };
  let observedLoading = false;

  try {
    await page.goto(
      `${baseURL}/model-detail?id=${encodeURIComponent(String(id))}&measure=${Date.now()}`,
      {
        timeout: timeoutMs,
        waitUntil: "domcontentloaded",
      },
    );
    times.domContentLoaded = seconds();

    const deadline = performance.now() + timeoutMs;
    while (performance.now() < deadline) {
      await page.waitForTimeout(1000);
      let state;
      try {
        state = await page.evaluate(() => ({
          canvasCount: document.querySelectorAll("canvas").length,
          errorVisible: Boolean(
            document.querySelector(".model-viewer-error-overlay"),
          ),
          loadingText:
            document.querySelector(".model-viewer-loading-overlay")
              ?.textContent || "",
          relatedRealImages: [
            ...document.querySelectorAll(".list2 img"),
          ].filter((img) => img.getAttribute("src")?.startsWith("http")).length,
        }));
      } catch (error) {
        if (
          error instanceof Error &&
          /Execution context was destroyed|navigation/i.test(error.message)
        ) {
          continue;
        }
        throw error;
      }

      Object.assign(finalState, state);
      if (state.loadingText) {
        observedLoading = true;
      }

      if (
        state.errorVisible ||
        (observedLoading && !state.loadingText) ||
        (times.glbFinished && !state.loadingText)
      ) {
        times.viewerReadyOrError = seconds();
        break;
      }
    }
  } finally {
    await context.close();
  }

  return {
    finalState,
    times,
  };
}

function printSummary(results) {
  const rows = results.map((result) => ({
    id: result.id,
    pageFetchSec: (result.endpoint.page.elapsedMs / 1000).toFixed(2),
    viewerFetchSec: (result.endpoint.viewer.elapsedMs / 1000).toFixed(2),
    rangeFetchSec:
      result.endpoint.asset?.elapsedMs === null ||
      result.endpoint.asset?.elapsedMs === undefined
        ? "-"
        : (result.endpoint.asset.elapsedMs / 1000).toFixed(2),
    rangeStatus: result.endpoint.asset?.status ?? "-",
    browserGlbStartSec: result.browser.times.glbRequest ?? "-",
    browserGlbDoneSec: result.browser.times.glbFinished ?? "-",
    browserReadySec: result.browser.times.viewerReadyOrError ?? "-",
    error: result.browser.finalState.errorVisible,
    relatedImages: result.browser.finalState.relatedRealImages,
  }));

  console.table(rows);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  });

  const results = [];

  try {
    for (const id of args.ids) {
      const endpoint = await measureEndpointChain({
        baseURL: args.baseURL,
        id,
        timeoutMs: args.timeoutMs,
      });
      const browserResult = await measureBrowserModel({
        baseURL: args.baseURL,
        browser,
        id,
        timeoutMs: args.timeoutMs,
      });

      results.push({
        browser: browserResult,
        endpoint,
        id,
      });
    }
  } finally {
    await browser.close();
  }

  printSummary(results);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
