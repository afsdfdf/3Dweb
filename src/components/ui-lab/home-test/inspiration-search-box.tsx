"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./inspiration-search-box.module.css";

type InspirationPagerProps = {
  basePath?: string;
  page?: number;
  query?: string;
  totalPages?: number;
};

type InspirationSearchBoxProps = InspirationPagerProps & {
  pageSize?: number;
};

const INSPIRATION_SECTION_ID = "inspiration";

function normalizeBasePath(basePath = "/") {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildPageHref(page: number, query = "", basePath = "/") {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  const normalizedBasePath = normalizeBasePath(basePath);
  return `${normalizedBasePath}${search ? `?${search}` : ""}#${INSPIRATION_SECTION_ID}`;
}

function getPagerItems(page: number, totalPages: number) {
  const normalizedTotal = Math.max(1, totalPages);
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotal);
  const pages = new Set([1, normalizedTotal, normalizedPage - 1, normalizedPage, normalizedPage + 1]);

  return Array.from(pages)
    .filter((item) => item >= 1 && item <= normalizedTotal)
    .sort((a, b) => a - b);
}

export function InspirationPager({ basePath = "/", page = 1, query = "", totalPages = 1 }: InspirationPagerProps) {
  const normalizedTotal = Math.max(1, totalPages);
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotal);
  const pageItems = getPagerItems(normalizedPage, normalizedTotal);
  const previousPage = Math.max(1, normalizedPage - 1);
  const nextPage = Math.min(normalizedTotal, normalizedPage + 1);

  return (
    <nav aria-label="Inspiration pages" className={styles.pager}>
      <a aria-disabled={normalizedPage <= 1} aria-label="Previous page" href={buildPageHref(previousPage, query, basePath)}>
        <span className={[styles.pagerIcon, styles.pagerIconPrevious].join(" ")} aria-hidden="true" />
      </a>
      {pageItems.map((item, index) => (
        <span className={styles.pageGroup} key={item}>
          {index > 0 && item - pageItems[index - 1] > 1 ? <span className={styles.ellipsis}>...</span> : null}
          <a
            aria-current={item === normalizedPage ? "page" : undefined}
            className={item === normalizedPage ? styles.currentPage : undefined}
            href={buildPageHref(item, query, basePath)}
          >
            <span className={styles.pageNumber}>{item}</span>
          </a>
        </span>
      ))}
      <a aria-disabled={normalizedPage >= normalizedTotal} aria-label="Next page" href={buildPageHref(nextPage, query, basePath)}>
        <span className={[styles.pagerIcon, styles.pagerIconNext].join(" ")} aria-hidden="true" />
      </a>
    </nav>
  );
}

export function InspirationSearchBox({ basePath = "/", page = 1, pageSize = 24, query = "", totalPages = 1 }: InspirationSearchBoxProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(query);

  useEffect(() => {
    if (query.trim().length === 0 || searchText.trim().length > 0) return;

    router.replace(`${normalizeBasePath(basePath)}#${INSPIRATION_SECTION_ID}`);
  }, [basePath, query, router, searchText]);

  return (
    <div className={styles.toolbar}>
      <form action={`${normalizeBasePath(basePath)}#${INSPIRATION_SECTION_ID}`} className={styles.searchBox} method="get" role="search">
        <label className={styles.inputShell}>
          <span className={styles.icon} aria-hidden="true" />
          <input
            aria-label="Search inspiration"
            className={styles.input}
            name="q"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Please enter keyword"
            type="search"
            value={searchText}
          />
        </label>
        <button className={styles.button} type="submit">
          <span className={styles.buttonLabel}>Search</span>
        </button>
      </form>
      <InspirationPager basePath={basePath} page={page} query={query} totalPages={totalPages} />
      <button className={styles.pageSize} type="button">
        <span>{pageSize} Items / Page</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
    </div>
  );
}
