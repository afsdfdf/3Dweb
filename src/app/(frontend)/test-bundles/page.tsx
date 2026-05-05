import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Link2, Shield, Star, Tags } from "lucide-react";

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { TopNavigation } from "@/components/ui-lab/top-navigation";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import { publicNavigationItems } from "@/lib/publicNavigation";

import { getCurrentNavUser } from "../_lib/session";
import styles from "./test-bundles.module.css";

type ImageLike = {
  thumbnailURL?: null | string;
  url?: null | string;
};

type ModelLike = {
  description?: null | string;
  id?: number | string;
  previewImage?: null | number | ImageLike;
  tags?: null | { label?: null | string }[];
  title?: null | string;
  visibility?: null | string;
};

type BundleLike = {
  coverImage?: null | number | ImageLike;
  id?: number | string;
  isFeatured?: null | boolean;
  models?: null | ModelLike[];
  slug?: null | string;
  summary?: null | string;
  tags?: null | { label?: null | string }[];
  title?: null | string;
};

type BundlePreview = {
  anchorId: string;
  coverSrc: null | string;
  href: string;
  id: string;
  isFeatured: boolean;
  modelCount: number;
  models: Array<{
    href: string;
    id: string;
    imageSrc: null | string;
    title: string;
  }>;
  summary: string;
  tags: string[];
  title: string;
};

const isProduction = process.env.NODE_ENV === "production";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeBrowserMediaURL = (value: null | string | undefined) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);

    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      parsed.pathname.startsWith("/api/media/file/")
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

const getImageURL = (value: unknown) => {
  if (!isRecord(value)) return null;

  const thumbnailURL =
    typeof value.thumbnailURL === "string" && value.thumbnailURL
      ? value.thumbnailURL
      : null;
  const url = typeof value.url === "string" && value.url ? value.url : null;

  return thumbnailURL || url;
};

const getText = (value: unknown, fallback: string) => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

async function resolveMediaURL(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  value: unknown,
) {
  const directURL = normalizeBrowserMediaURL(getImageURL(value));
  if (!directURL) return null;
  if (directURL.startsWith("/")) return directURL;

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: directURL }));
}

async function getModelPreview(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  model: ModelLike,
) {
  return {
    href: model.id ? `/model-detail?id=${encodeURIComponent(String(model.id))}` : "/showcase",
    id: String(model.id ?? model.title ?? "model"),
    imageSrc: await resolveMediaURL(payload, model.previewImage),
    title: getText(model.title, `Model ${model.id ?? ""}`.trim()),
  };
}

async function getPayloadBundles() {
  const payload = await getCachedPayload();
  const result = await payload.find({
    collection: "model-bundles",
    depth: 2,
    limit: 6,
    overrideAccess: false,
    pagination: false,
    sort: ["-isFeatured", "sortOrder", "-updatedAt"],
    where: {
      isVisible: {
        equals: true,
      },
    },
  });

  return Promise.all(
    (result.docs as BundleLike[]).map(async (bundle) => {
      const slug = getText(bundle.slug, String(bundle.id ?? "bundle"));
      const anchorId = `bundle-${encodeURIComponent(slug)}`;
      const models = Array.isArray(bundle.models) ? bundle.models.slice(0, 6) : [];
      const modelPreviews = await Promise.all(
        models.filter(isRecord).map((model) => getModelPreview(payload, model as ModelLike)),
      );

      return {
        anchorId,
        coverSrc:
          (await resolveMediaURL(payload, bundle.coverImage)) ??
          modelPreviews.find((model) => model.imageSrc)?.imageSrc ??
          null,
        href: `#${anchorId}`,
        id: String(bundle.id ?? slug),
        isFeatured: bundle.isFeatured === true,
        modelCount: models.length,
        models: modelPreviews,
        summary: getText(bundle.summary, "Curated models grouped for a focused creative path."),
        tags: Array.isArray(bundle.tags)
          ? bundle.tags
              .map((tag) => getText(tag?.label, ""))
              .filter(Boolean)
              .slice(0, 4)
          : [],
        title: getText(bundle.title, "Untitled bundle"),
      } satisfies BundlePreview;
    }),
  );
}

async function getFallbackBundle() {
  const payload = await getCachedPayload();
  const models = await payload.find({
    collection: "models",
    depth: 2,
    limit: 8,
    overrideAccess: false,
    pagination: false,
    sort: "-updatedAt",
    where: {
      visibility: {
        equals: "public",
      },
    },
  });
  const modelPreviews = await Promise.all(
    (models.docs as ModelLike[]).map((model) => getModelPreview(payload, model)),
  );
  const visibleModels = modelPreviews.filter((model) => model.imageSrc).slice(0, 8);

  if (visibleModels.length === 0) return [];

  const packTemplates = [
    {
      id: "adventurer-pack",
      summary: "Hero characters and playable tabletop figures gathered for a fast campaign start.",
      tags: ["Heroes", "Tabletop", "Ready"],
      title: "Adventurer Starter Pack",
    },
    {
      id: "tavern-cast",
      summary: "Companions, rivals, and story NPCs for building a lively fantasy scene.",
      tags: ["NPC", "Story", "Scene"],
      title: "Tavern Cast Collection",
    },
    {
      id: "showcase-set",
      summary: "A compact public showcase set for browsing models before opening full details.",
      tags: ["Showcase", "Public", "Featured"],
      title: "Featured Showcase Set",
    },
  ];

  return packTemplates.map((template, index) => {
    const anchorId = `bundle-${encodeURIComponent(template.id)}`;
    const rotatedModels = visibleModels
      .slice(index)
      .concat(visibleModels.slice(0, index))
      .slice(0, 4);

    return {
      anchorId,
      coverSrc: rotatedModels[0]?.imageSrc ?? visibleModels[0]?.imageSrc ?? null,
      href: `#${anchorId}`,
      id: template.id,
      isFeatured: index === 0,
      modelCount: rotatedModels.length,
      models: rotatedModels,
      summary: template.summary,
      tags: template.tags,
      title: template.title,
    } satisfies BundlePreview;
  });
}

async function getBundlePreviewData() {
  const bundles = await getPayloadBundles();
  if (bundles.length > 0) return bundles;

  return getFallbackBundle();
}

export default async function TestBundlesPage() {
  if (isProduction) notFound();

  const [navUser, bundles] = await Promise.all([
    getCurrentNavUser(),
    getBundlePreviewData(),
  ]);
  const heroBundle = bundles[0] ?? null;
  const detailModels = heroBundle?.models ?? [];
  const featuredCount = bundles.filter((bundle) => bundle.isFeatured).length || (bundles.length > 0 ? 1 : 0);

  return (
    <main className={styles.page}>
      <TopNavigation active="HOME" items={publicNavigationItems} user={navUser} />
      <AuthModalStage fitViewport topOffset={60}>
        <section className={styles.hero}>
          <div className={styles.heroBackdrop} aria-hidden="true" />
          <div className={styles.heroInner}>
            <span className={styles.kicker}>CURATED MODEL PACK</span>
            <h1>{heroBundle?.title ?? "3D Model Bundle"}</h1>
            <div className={styles.titleRule} aria-hidden="true" />
            <p>
              A complete themed set selected by the Tavern team, ready to browse
              as one pack before opening individual model details.
            </p>

            <div className={styles.heroStats} aria-label="Bundle overview">
              <div className={styles.statCard}>
                <Box aria-hidden="true" size={24} strokeWidth={1.7} />
                <strong>{heroBundle ? heroBundle.modelCount : 0}</strong>
                <span>Models Included</span>
              </div>
              <div className={styles.statCard}>
                <Link2 aria-hidden="true" size={24} strokeWidth={1.7} />
                <strong>{bundles.length}</strong>
                <span>Published Packs</span>
              </div>
              <div className={styles.statCard}>
                <Shield aria-hidden="true" size={24} strokeWidth={1.7} />
                <strong>{featuredCount}</strong>
                <span>Featured Picks</span>
              </div>
            </div>

            <div className={styles.bundleFlow} aria-label="How model bundles work">
              <span>Tavern team selects models</span>
              <span>Each pack gets its own cover</span>
              <span>Open any model inside</span>
            </div>
          </div>
        </section>

        <section className={styles.detailStage} id={heroBundle?.anchorId}>
          <div className={styles.ornatePanel}>
            <article className={styles.detailPanel}>
              <div className={styles.detailMedia}>
                {heroBundle?.coverSrc ? (
                  <span className={styles.detailArtwork}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" aria-hidden="true" className={styles.artBackdrop} src={heroBundle.coverSrc} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={heroBundle.title} className={styles.artSubject} src={heroBundle.coverSrc} />
                  </span>
                ) : (
                  <span>No Cover</span>
                )}
              </div>
              <div className={styles.detailContent}>
                <span className={styles.kicker}>SELECTED PACK</span>
                <h2>{heroBundle?.title ?? "No published bundle"}</h2>
                <p>
                  {heroBundle?.summary ??
                    "This pack is built from selected public models and appears here after it is published."}
                </p>
                <p className={styles.detailNote}>
                  This is a curated set. Tags help describe the theme, but the
                  models inside are chosen manually by the Tavern team.
                </p>
                <div className={styles.tags}>
                  {((heroBundle?.tags.length ?? 0) > 0 ? heroBundle?.tags : ["Bundle", "Models", "Preview"])?.map(
                    (tag) => (
                      <span key={tag}>{tag}</span>
                    ),
                  )}
                </div>
                <div className={styles.detailSummaryGrid}>
                  <div>
                    <Star aria-hidden="true" size={24} strokeWidth={1.6} />
                    <strong>{heroBundle ? heroBundle.modelCount : 0}</strong>
                    <span>Models Included</span>
                  </div>
                  <div>
                    <Tags aria-hidden="true" size={24} strokeWidth={1.6} />
                    <strong>{heroBundle?.tags.length ?? 0}</strong>
                    <span>Tags</span>
                  </div>
                  <div>
                    <Shield aria-hidden="true" size={24} strokeWidth={1.6} />
                    <strong>{heroBundle?.isFeatured ? "Yes" : "No"}</strong>
                    <span>Featured</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.modelBoard} aria-label="Bundle model board">
          <div className={styles.ornatePanel}>
            <div className={styles.panelHeader}>
              <span>Models Inside This Pack</span>
              <i aria-hidden="true" />
            </div>

            {bundles.length > 0 ? (
              <div className={styles.modelGrid}>
                {detailModels.map((model) => (
                  <Link className={styles.modelTile} href={model.href} key={model.id}>
                    {model.imageSrc ? (
                      <span className={styles.modelArtwork}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" aria-hidden="true" className={styles.artBackdrop} src={model.imageSrc} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={model.title} className={styles.artSubject} src={model.imageSrc} />
                      </span>
                    ) : (
                      <span />
                    )}
                    <strong>{model.title}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <article className={styles.emptyState}>
                <strong>No model packs are published yet</strong>
                <p>
                  Once the Tavern team publishes a visible pack, its cover,
                  description, and included models will appear here.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className={styles.shelfSection} aria-label="More model bundles">
          <div className={styles.ornatePanel}>
            <div className={styles.panelHeader}>
              <span>More Curated Packs</span>
              <i aria-hidden="true" />
            </div>

            <div className={styles.shelfGrid}>
              {bundles.slice(0, 3).map((bundle, index) => (
                <a
                  className={`${styles.shelfCard} ${index === 0 ? styles.primaryShelfCard : ""}`}
                  href={bundle.href}
                  key={bundle.id}
                  aria-current={index === 0 ? "true" : undefined}
                >
                  {bundle.coverSrc ? (
                    <span className={styles.cardArtwork}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" aria-hidden="true" className={styles.artBackdrop} src={bundle.coverSrc} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={bundle.title} className={styles.artSubject} src={bundle.coverSrc} />
                    </span>
                  ) : (
                    <span className={styles.noImage}>No Cover</span>
                  )}
                  <em>{bundle.isFeatured || index === 0 ? "Featured" : "Curated"}</em>
                  <div>
                    <strong>{bundle.title}</strong>
                    <p>{bundle.summary}</p>
                    <small>
                      <span /> {bundle.modelCount} models <span />
                    </small>
                    <b>View pack</b>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
        <div className={styles.footerMark} aria-hidden="true">
          <span />
          <strong>TT</strong>
          <span />
        </div>
      </AuthModalStage>
    </main>
  );
}
