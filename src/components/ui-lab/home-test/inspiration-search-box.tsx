import styles from "./inspiration-search-box.module.css";

type InspirationPagerProps = {
  page?: number;
  query?: string;
  totalPages?: number;
};

type InspirationSearchBoxProps = InspirationPagerProps & {
  pageSize?: number;
};

function buildPageHref(page: number, query = "") {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `?${search}` : "?";
}

function getPagerItems(page: number, totalPages: number) {
  const normalizedTotal = Math.max(1, totalPages);
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotal);
  const pages = new Set([1, normalizedTotal, normalizedPage - 1, normalizedPage, normalizedPage + 1]);

  return Array.from(pages)
    .filter((item) => item >= 1 && item <= normalizedTotal)
    .sort((a, b) => a - b);
}

export function InspirationPager({ page = 1, query = "", totalPages = 1 }: InspirationPagerProps) {
  const normalizedTotal = Math.max(1, totalPages);
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotal);
  const pageItems = getPagerItems(normalizedPage, normalizedTotal);
  const previousPage = Math.max(1, normalizedPage - 1);
  const nextPage = Math.min(normalizedTotal, normalizedPage + 1);

  return (
    <nav aria-label="Inspiration pages" className={styles.pager}>
      <a aria-disabled={normalizedPage <= 1} href={buildPageHref(previousPage, query)}>
        {"<"}
      </a>
      {pageItems.map((item, index) => (
        <span className={styles.pageGroup} key={item}>
          {index > 0 && item - pageItems[index - 1] > 1 ? <span className={styles.ellipsis}>...</span> : null}
          <a
            aria-current={item === normalizedPage ? "page" : undefined}
            className={item === normalizedPage ? styles.currentPage : undefined}
            href={buildPageHref(item, query)}
          >
            {item}
          </a>
        </span>
      ))}
      <a aria-disabled={normalizedPage >= normalizedTotal} href={buildPageHref(nextPage, query)}>
        {">"}
      </a>
    </nav>
  );
}

export function InspirationSearchBox({ page = 1, pageSize = 24, query = "", totalPages = 1 }: InspirationSearchBoxProps) {
  return (
    <div className={styles.toolbar}>
      <form action="" className={styles.searchBox} method="get" role="search">
        <label className={styles.inputShell}>
          <span className={styles.icon} aria-hidden="true" />
          <input
            aria-label="Search inspiration"
            className={styles.input}
            defaultValue={query}
            name="q"
            placeholder="Please enter keywords"
            type="search"
          />
        </label>
        <button className={styles.button} type="submit">
          Search
        </button>
      </form>
      <InspirationPager page={page} query={query} totalPages={totalPages} />
      <button className={styles.pageSize} type="button">
        <span>{pageSize} Items / Page</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
    </div>
  );
}
