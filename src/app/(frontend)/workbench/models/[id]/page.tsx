import Link from "next/link";

import { notFound } from "next/navigation";
import {
  Box,
  ChevronLeft,
  Download,
  Eye,
  Heart,
  MoreHorizontal,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

import { FrameButton } from "@/components/ui/frame-button";
import { LineFrame } from "@/components/ui/line-frame";

import { ModelViewer } from "../../../_components/ModelViewer";
import { SiteShell } from "../../../_components/SiteShell";
import { TopNavBar } from "../../../_components/shell/TopNavBar";
import { getCurrentLocale } from "../../../_lib/locale-server";
import { getCurrentNavUser, requireUser } from "../../../_lib/session";
import { SketchExactPreview } from "./SketchExactPreview";
import {
  formatStatusBadge,
  formatVisibilityBadge,
  formatWorkbenchDate,
  getWorkbenchModels,
  type WorkbenchModel,
} from "../../_lib/workbenchData";

const ORNAMENT_STRIP_SRC = "/ui/workbench/model-detail/ornament-strip.png";
const TOP_DIVIDER_SRC = "/ui/workbench/model-detail/top-divider.png";

function buildPreviewModel(): WorkbenchModel {
  return {
    commentsCount: 23,
    createdAt: "2026-02-25T10:25:36.000Z",
    description:
      "A high-fantasy fox sorcerer built for display and print. The detail page preview focuses on strong hierarchy, game-like framing, and room for creator/community metadata.",
    dimensions: {
      depthMm: 48,
      heightMm: 92,
      widthMm: 55,
    },
    favoritesCount: 267,
    formats: [
      { downloadCredits: 15, fileSizeMb: 34.2, format: "glb" },
      { downloadCredits: 15, fileSizeMb: 41.8, format: "stl" },
      { downloadCredits: 18, fileSizeMb: 28.1, format: "fbx" },
    ],
    id: 0,
    isOwnedByCurrentUser: true,
    likesCount: 56,
    ownerId: 1,
    ownerName: "Xing Mu",
    ownerProfile: {
      avatarFrame: "ember",
      avatarUrl: null,
      backgroundUrl: "/ui/frames/hello.png",
      bio: "An anime and tabletop miniature creator focused on expressive silhouettes, clean printability, and cinematic hero pieces.",
      displayName: "Xing Mu",
      followersCount: 560,
      followingCount: 23,
      profileViewCount: 2300,
      profileVisibility: "public",
    },
    previewURL: "/ui/frames/products3.png",
    printReady: true,
    sourceTaskCode: "TASK-FOX-001",
    status: "ready",
    tags: ["game", "Titan Tribe", "Monk"],
    title: "Fox Sorcerer",
    updatedAt: "2026-02-25T10:25:36.000Z",
    viewCount: 2300,
    viewerURL: null,
    visibility: "public",
  };
}

function buildPreviewGallery(): WorkbenchModel[] {
  const preview = buildPreviewModel();

  return [
    preview,
    {
      ...preview,
      id: 101,
      previewURL: "/ui/frames/products2.png",
      title: "Azure Knight",
    },
    {
      ...preview,
      id: 102,
      previewURL: "/ui/frames/products5.png",
      title: "Dusk Sentinel",
      visibility: "private",
    },
    {
      ...preview,
      id: 103,
      previewURL: "/ui/frames/new product4.png",
      title: "Tavern Bard",
      visibility: "team",
    },
    {
      ...preview,
      id: 104,
      previewURL: "/ui/frames/new product2.png",
      title: "Forge Champion",
    },
    {
      ...preview,
      id: 105,
      previewURL: "/ui/frames/new product3.png",
      title: "Shadow Pugilist",
    },
  ];
}

function formatCompactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

function formatDownloadCredits(model: WorkbenchModel) {
  const values = model.formats
    .map((item) => item.downloadCredits)
    .filter(
      (item): item is number =>
        typeof item === "number" && Number.isFinite(item),
    );

  if (values.length === 0) return "Free";

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (minimum === maximum) return minimum.toFixed(2);
  return `${minimum.toFixed(2)} - ${maximum.toFixed(2)}`;
}

function formatDimensions(model: WorkbenchModel) {
  const width = model.dimensions?.widthMm;
  const height = model.dimensions?.heightMm;
  const depth = model.dimensions?.depthMm;

  if (![width, height, depth].some((value) => typeof value === "number"))
    return "Not specified";

  return [width ?? "--", height ?? "--", depth ?? "--"].join(" x ");
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[132px] flex-1 items-center gap-3 rounded-[6px] border border-[#312f36] bg-[#121215]/90 px-4 py-3 text-[#efe6d7]">
      <div className="flex size-11 items-center justify-center rounded-full border border-[#4d473d] bg-[#17130f] text-[#efc77d]">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#837d73]">
          {label}
        </div>
        <div className="mt-1 text-2xl font-black leading-none text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function SidebarMetric({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[#d4ccbf]">
      <span className="text-[#7e7784]">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function RelatedModelCard({ model }: { model: WorkbenchModel }) {
  return (
    <Link className="group block" href={`/workbench/models/${model.id}`}>
      <LineFrame
        className="h-full bg-[linear-gradient(180deg,#0b0b0d_0%,#15161a_100%)] shadow-[0_16px_24px_rgba(0,0,0,0.36)] transition-transform duration-200 group-hover:-translate-y-1"
        contentClassName="h-full"
        contentPadding={12}
        frameSize={84}
      >
        <article className="flex h-full flex-col gap-3">
          <div className="overflow-hidden rounded-[4px] border border-[#2f2c33] bg-[linear-gradient(180deg,#18191d_0%,#0b0b0d_100%)]">
            {model.previewURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={model.title}
                className="aspect-[0.82] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                src={model.previewURL}
              />
            ) : (
              <div className="flex aspect-[0.82] items-center justify-center text-[#645e68]">
                <Box className="size-9" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#f3ecdf]">
              {model.title}
            </div>
            <div className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-[#807a84]">
              {formatVisibilityBadge(model.visibility)}
            </div>
          </div>
        </article>
      </LineFrame>
    </Link>
  );
}

function GalleryCard({ model }: { model: WorkbenchModel }) {
  return (
    <Link
      className="group block h-[160px] w-[92px]"
      href={`/workbench/models/${model.id}`}
    >
      <LineFrame
        className="h-full bg-[linear-gradient(180deg,#0b0b0d_0%,#15161a_100%)] shadow-[0_10px_18px_rgba(0,0,0,0.34)]"
        contentClassName="h-full"
        contentPadding={8}
        frameSize={72}
      >
        <div className="h-full overflow-hidden rounded-[2px] border border-[#2f2c33] bg-[linear-gradient(180deg,#18191d_0%,#0b0b0d_100%)]">
          {model.previewURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={model.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              src={model.previewURL}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#645e68]">
              <Box className="size-8" />
            </div>
          )}
        </div>
      </LineFrame>
    </Link>
  );
}

export default async function WorkbenchModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const previewMode = String(id).toLowerCase() === "preview";
  if (previewMode && process.env.NODE_ENV === "production") {
    notFound();
  }

  const user = previewMode ? null : await requireUser();
  const fetchedModels = await getWorkbenchModels(user);
  const models = previewMode ? buildPreviewGallery() : fetchedModels;
  const selectedModel = previewMode
    ? (models[0] ?? buildPreviewModel())
    : models.find((item) => String(item.id) === String(id));

  if (!selectedModel) {
    notFound();
  }

  const sidebarModels = models
    .filter(
      (item) =>
        item.id !== selectedModel.id &&
        (selectedModel.ownerId ? item.ownerId === selectedModel.ownerId : true),
    )
    .slice(0, 6);
  const fallbackModels = models
    .filter((item) => item.id !== selectedModel.id)
    .slice(0, 6);
  const galleryModels =
    sidebarModels.length > 0 ? sidebarModels : fallbackModels;
  const downloadCredits = formatDownloadCredits(selectedModel);
  const ownerProfile = selectedModel.ownerProfile;
  const heroBanner =
    ownerProfile?.backgroundUrl ||
    selectedModel.previewURL ||
    "/ui/frames/hello.png";
  const downloadFormat =
    selectedModel.formats.find((item) => item.format.toLowerCase() === "glb")
      ?.format ||
    selectedModel.formats[0]?.format ||
    "glb";
  const creatorBio =
    ownerProfile?.bio ||
    (selectedModel.isOwnedByCurrentUser
      ? "You can review metadata, download packages, and move this model into the next production step."
      : "A polished creator profile, model notes, and interaction history can live in this rail without competing with the 3D stage.");
  const visibleGalleryModels = galleryModels.slice(0, 5);

  if (previewMode) {
    const [locale, navUser] = await Promise.all([
      getCurrentLocale(),
      getCurrentNavUser(),
    ]);
    const previewViewportStyle = {
      "--preview-stage-width": "min(100vw, calc(100vh * 16 / 9))",
      "--preview-stage-height": "min(100vh, calc(100vw * 9 / 16))",
      "--preview-scale": "calc(var(--preview-stage-width) / 1920px)",
    } as CSSProperties;

    return (
      <div
        className="grid h-screen w-screen place-items-center overflow-hidden bg-[#181818]"
        style={previewViewportStyle}
      >
        <div
          className="relative overflow-hidden bg-[#181818] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          style={{
            aspectRatio: "16 / 9",
            height: "var(--preview-stage-height)",
            width: "var(--preview-stage-width)",
          }}
        >
          <div
            className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
            style={{ transform: "scale(var(--preview-scale))" }}
          >
            <div className="flex h-full flex-col">
              <TopNavBar
                currentPath="/generate"
                locale={locale}
                navigation={[
                  { href: "/", label: "Home" },
                  { href: "/generate", label: "Workbench" },
                  { href: "/dashboard", label: "Account" },
                  { href: "/admin", label: "Admin" },
                ]}
                user={navUser}
              />
              <SketchExactPreview
                creatorBio={creatorBio}
                downloadCredits={downloadCredits}
                downloadFormat={downloadFormat}
                models={visibleGalleryModels}
                selectedModel={selectedModel}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SiteShell
      currentPath="/generate"
      showFooter={false}
      showUtilityNav={false}
      user={user}
    >
      <section className="h-[calc(100vh-76px)] overflow-hidden bg-[radial-gradient(circle_at_18%_24%,rgba(77,89,102,0.18),transparent_26%),radial-gradient(circle_at_62%_18%,rgba(113,73,34,0.18),transparent_24%),linear-gradient(180deg,#050506_0%,#111215_46%,#1a1b20_100%)] px-4 py-3 text-[#e9e2d6] sm:px-6">
        <div className="mx-auto grid h-full max-w-[1720px] gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_92px] gap-3">
            <div className="relative min-h-0 overflow-hidden rounded-[4px] bg-[radial-gradient(circle_at_18%_78%,rgba(106,124,144,0.34),transparent_36%),radial-gradient(circle_at_78%_18%,rgba(121,78,34,0.26),transparent_28%),linear-gradient(180deg,#060607_0%,#121418_58%,#26282d_100%)] shadow-[0_30px_56px_rgba(0,0,0,0.48)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[148px] bg-[linear-gradient(180deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.56)_58%,transparent_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[148px] bg-[linear-gradient(180deg,transparent_0%,rgba(7,7,9,0.24)_44%,rgba(7,7,9,0.9)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_75%,rgba(155,175,198,0.18),transparent_26%),radial-gradient(circle_at_74%_20%,rgba(165,98,48,0.16),transparent_22%)]" />

              <div className="absolute inset-0">
                <ModelViewer
                  className="h-full w-full"
                  label={selectedModel.title}
                  src={selectedModel.viewerURL}
                />
              </div>

              <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-6 px-8 pt-6">
                <div className="max-w-[520px]">
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#8d8790]">
                    <Link
                      className="inline-flex items-center gap-2 text-[#d8d0c3] transition hover:text-white"
                      href="/workbench"
                    >
                      <span className="inline-flex size-7 items-center justify-center rounded-[4px] border border-[#4a454d] bg-[#17171a]/90 text-[#f0eadc]">
                        <ChevronLeft className="size-4" />
                      </span>
                      Home
                    </Link>
                    <span className="text-[#5f5962]">/</span>
                    <span className="text-white">Model Details</span>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    aria-hidden="true"
                    className="mt-5 h-[2px] w-full max-w-[380px] object-cover opacity-55"
                    src={TOP_DIVIDER_SRC}
                  />
                  <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[#8b8590]">
                    Model Name
                  </div>
                  <h1 className="mt-3 text-[58px] font-black leading-[0.95] tracking-tight text-white">
                    {selectedModel.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-[4px] border border-[#5b575f] bg-[#1b1c20]/88 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#efe7da]">
                      {formatVisibilityBadge(selectedModel.visibility)}
                    </span>
                  </div>
                </div>

                <div className="grid min-w-[208px] gap-3 rounded-[4px] border border-[#35333a] bg-[#09090c]/84 px-4 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
                  {[
                    { label: "Topology", value: "Triangle" },
                    { label: "Face Count", value: "16,101" },
                    { label: "Vertex Count", value: "25,981" },
                  ].map((item) => (
                    <div
                      className="flex items-center justify-between gap-4"
                      key={item.label}
                    >
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#7f7983]">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-[#f1ebdf]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                aria-label="Previous model"
                className="absolute left-2 top-1/2 z-10 flex size-16 -translate-y-1/2 items-center justify-center opacity-90 transition hover:opacity-100"
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-16 w-16"
                  src="/ui/frames/dark-3d-arrow-left.png"
                />
              </button>

              <button
                aria-label="Next model"
                className="absolute right-2 top-1/2 z-10 flex size-16 -translate-y-1/2 items-center justify-center opacity-90 transition hover:opacity-100"
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-16 w-16"
                  src="/ui/frames/dark-3d-arrow-right.png"
                />
              </button>

              <div className="absolute bottom-5 left-8 z-10 w-[312px]">
                <form
                  action="/workbench"
                  className="flex h-14 items-center overflow-hidden rounded-[4px] border border-[#5b585f] bg-[#17181c]/92 shadow-[0_16px_34px_rgba(0,0,0,0.38)]"
                >
                  <div className="flex flex-1 items-center gap-3 px-4">
                    <Search className="size-4 text-[#8e8891]" />
                    <input
                      className="h-full w-full bg-transparent text-sm text-[#efe7da] outline-none placeholder:text-[#7f7983]"
                      name="q"
                      placeholder="Please enter keywords"
                      type="search"
                    />
                  </div>
                  <FrameButton
                    height={42}
                    size="compact"
                    type="submit"
                    variant="slate"
                    width={98}
                  >
                    Search
                  </FrameButton>
                </form>
              </div>

              <div className="absolute bottom-14 right-[12%] z-10 hidden w-[380px] lg:block">
                <LineFrame
                  className="bg-[linear-gradient(180deg,rgba(7,7,9,0.98)_0%,rgba(10,10,13,0.98)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.48)]"
                  contentPadding={18}
                  frameSize={84}
                >
                  <div>
                    <div className="text-center text-[13px] font-semibold tracking-[0.02em] text-[#f0d08c]">
                      Model Download Confirmation
                    </div>
                    <p className="mt-3 text-center text-sm leading-6 text-[#beb6aa]">
                      Downloading the current model will cost 1 to 2 points.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <FrameButton height={52} variant="slate">
                        Cancel
                      </FrameButton>
                      <FrameButton asChild height={52} variant="gold">
                        <a
                          href={`/api/platform/models/${selectedModel.id}/download?format=${downloadFormat}`}
                        >
                          OK
                        </a>
                      </FrameButton>
                    </div>
                  </div>
                </LineFrame>
              </div>
            </div>

            <LineFrame
              className="bg-[linear-gradient(180deg,#171719_0%,#101012_100%)] shadow-[0_20px_40px_rgba(0,0,0,0.42)]"
              contentPadding={14}
              frameSize={92}
            >
              <div className="grid h-full grid-cols-[320px_1fr_auto] items-center gap-5">
                <div className="flex h-full items-center rounded-[4px] bg-[linear-gradient(90deg,rgba(31,31,34,0.96),rgba(18,18,20,0.96))] px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full border border-[#8d6830] bg-[#21160b] text-[#efc77d] shadow-[0_0_0_4px_rgba(239,199,125,0.08)]">
                      <Sparkles className="size-6" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#8c8578]">
                        Points
                      </div>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-[34px] font-black leading-none text-[#f7d38d]">
                          {downloadCredits}
                        </span>
                        <span className="text-xl text-[#6f685e] line-through">
                          27.00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <MetricTile
                    icon={<Eye className="size-4" />}
                    label="Views"
                    value={formatCompactNumber(selectedModel.viewCount)}
                  />
                  <MetricTile
                    icon={<Heart className="size-4" />}
                    label="Likes"
                    value={formatCompactNumber(selectedModel.likesCount)}
                  />
                  <MetricTile
                    icon={<Star className="size-4" />}
                    label="Favorites"
                    value={formatCompactNumber(selectedModel.favoritesCount)}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <FrameButton asChild height={58} variant="gold" width={262}>
                    <a
                      href={`/api/platform/models/${selectedModel.id}/download?format=${downloadFormat}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Download className="size-4" />
                        Add To Cart
                      </span>
                    </a>
                  </FrameButton>
                  <FrameButton asChild height={58} variant="slate" width={232}>
                    <Link
                      href={
                        selectedModel.printReady
                          ? `/workbench?model=${selectedModel.id}&intent=print`
                          : `/workbench/models/${selectedModel.id}`
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <Printer className="size-4" />
                        Print Now
                      </span>
                    </Link>
                  </FrameButton>
                  <FrameButton
                    height={58}
                    size="compact"
                    variant="slate"
                    width={70}
                  >
                    <MoreHorizontal className="size-5" />
                  </FrameButton>
                </div>
              </div>
            </LineFrame>
          </div>

          <LineFrame
            className="h-[min(972px,calc(100vh-100px))] w-full justify-self-end overflow-hidden bg-[linear-gradient(180deg,#0d0d10_0%,#08080a_100%)] shadow-[0_24px_50px_rgba(0,0,0,0.46)]"
            contentClassName="h-full"
            contentPadding={18}
            frameSize={96}
          >
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_1px_499px]">
              <div className="grid min-h-0 grid-rows-[90px_116px_90px_74px_17px] gap-[10px] overflow-hidden">
                <div className="mx-auto w-[320px] overflow-hidden rounded-[4px] border border-[#2e2b31] bg-[#111216]">
                  <div className="relative h-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`${selectedModel.ownerName} banner`}
                      className="h-full w-full object-cover"
                      src={heroBanner}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,10,0.42)_0%,rgba(8,8,10,0.12)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="relative inline-flex min-h-[34px] min-w-[188px] items-center justify-center px-7">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-fill"
                          src={ORNAMENT_STRIP_SRC}
                        />
                        <span className="relative text-[11px] uppercase tracking-[0.18em] text-[#f0d08c]">
                          {selectedModel.isOwnedByCurrentUser
                            ? "My Model"
                            : "Creator Archive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-[320px] rounded-[4px] border border-[#2e2b31] bg-[#111216] px-4 py-3">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0 rounded-full border-[5px] border-[#d69d57] bg-[#2b1612] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                        <div className="flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#fff3e0_0%,#d0c4c7_100%)] text-3xl font-black text-[#2a272d]">
                          {(
                            ownerProfile?.displayName || selectedModel.ownerName
                          )
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-[16px] font-semibold text-[#f3ecdf]">
                            {ownerProfile?.displayName ||
                              selectedModel.ownerName}
                          </div>
                          <span className="rounded-[4px] border border-[#4a454c] bg-[#17171a] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f0eadc]">
                            {selectedModel.isOwnedByCurrentUser
                              ? "Owner"
                              : "Creator"}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#a9a29a]">
                          {creatorBio}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-[#28252b] pt-4">
                      <SidebarMetric
                        icon={<Users className="size-4" />}
                        value={formatCompactNumber(
                          ownerProfile?.followersCount || 0,
                        )}
                      />
                      <SidebarMetric
                        icon={<Box className="size-4" />}
                        value={`${ownerProfile?.followingCount || 23}`}
                      />
                      <div className="text-sm text-[#a8a1ab]">
                        {
                          formatWorkbenchDate(
                            selectedModel.updatedAt || selectedModel.createdAt,
                          ).split(" ")[0]
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-[320px] rounded-[4px] border border-[#2f2c33] bg-[#0d0d10] p-4">
                  <div className="flex items-start gap-4">
                    <div className="overflow-hidden rounded-[4px] border border-[#312e35] bg-[#18191d]">
                      {selectedModel.previewURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={selectedModel.title}
                          className="size-16 object-cover"
                          src={selectedModel.previewURL}
                        />
                      ) : (
                        <div className="flex size-16 items-center justify-center text-[#67616a]">
                          <Box className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#8c8690]">
                        Image Input
                      </div>
                      <div className="mt-2 text-sm text-[#9e97a3]">
                        {formatWorkbenchDate(
                          selectedModel.updatedAt || selectedModel.createdAt,
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedModel.tags.slice(0, 3).map((tag) => (
                          <span
                            className="rounded-[4px] border border-[#3a373f] bg-[#151519] px-2 py-1 text-[11px] text-[#e7dece]"
                            key={tag}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-[320px] rounded-[4px] border border-[#2f2c33] bg-[#0d0d10] p-[1px]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="sr-only">Comments</div>
                    <div className="text-sm text-[#a7a0ab]">0 / 500</div>
                  </div>
                  <div className="mt-[2px] flex gap-3">
                    <textarea
                      className="h-[74px] flex-1 rounded-[2px] border border-white/20 bg-transparent px-4 py-3 text-sm text-[#efe7da] outline-none placeholder:text-[#706b76]"
                      placeholder="Please enter your comment."
                    />
                    <FrameButton height={42} variant="slate" width={92}>
                      Comment
                    </FrameButton>
                  </div>
                  <div className="mt-2 text-sm text-[#f1eadc]">0 Comments</div>
                </div>

                <div className="mx-auto h-[17px] w-[320px] border-t border-[#28252b] pt-1 text-sm text-[#f1eadc]">
                  <span className="text-sm text-[#f1eadc]">0 Comments</span>
                </div>
              </div>

              <div className="mx-1 bg-[linear-gradient(90deg,transparent,rgba(122,118,128,0.7),transparent)]" />

              <div className="grid min-h-0 grid-rows-[34px_1fr] gap-[10px] overflow-hidden pt-[10px]">
                <div className="flex items-center justify-center">
                  <div className="relative inline-flex h-[34px] w-[256px] items-center justify-center px-7">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-fill"
                      src={ORNAMENT_STRIP_SRC}
                    />
                    <span className="relative text-[11px] uppercase tracking-[0.18em] text-[#f0d08c]">
                      {selectedModel.isOwnedByCurrentUser
                        ? "My Model"
                        : "Creator Library"}
                    </span>
                  </div>
                </div>

                <div className="min-h-0 overflow-hidden rounded-[4px] border border-[#2f2c33] bg-[#0d0d10] p-3">
                  <div className="mx-auto flex h-full w-[320px] flex-col gap-[13px]">
                    <div className="flex items-start justify-between">
                      {visibleGalleryModels.slice(0, 3).map((model) => (
                        <GalleryCard key={model.id} model={model} />
                      ))}
                    </div>
                    <div className="flex items-start gap-[20px]">
                      {visibleGalleryModels.slice(3, 5).map((model) => (
                        <GalleryCard key={model.id} model={model} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </LineFrame>
        </div>
      </section>
    </SiteShell>
  );
}
