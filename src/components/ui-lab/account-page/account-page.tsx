/* eslint-disable @next/next/no-img-element */
import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";

import styles from "./account-page.module.css";

export type AccountTestPageRow = {
  balanceAfter: string;
  date: string;
  id: number;
  item: string;
  operation: string;
  points: string;
};

export type AccountTestPageData = {
  avatarFrame?: null | string;
  avatarFrameStyles?: {
    key: string;
    thumbnailUrl?: null | string;
    title: string;
  }[];
  avatarUrl?: null | string;
  backgroundUrl?: null | string;
  creditsBalance?: number;
  displayName?: null | string;
  email?: null | string;
  rows?: AccountTestPageRow[];
};

function EditButton({ label }: { label: string }) {
  return (
    <button className={styles.editButton} type="button">
      <span aria-hidden="true">/</span>
      {label}
    </button>
  );
}

type AccountTestPageProps = {
  accountData?: AccountTestPageData;
  navUser?: null | TopNavigationUser;
};

const formatCredits = (value: unknown) => {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

export function AccountTestPage({ accountData, navUser = null }: AccountTestPageProps) {
  const avatarUrl =
    accountData?.avatarUrl ||
    navUser?.avatarUrl ||
    "/ui-lab/model-detail-uicut/images/face.png";
  const displayName = accountData?.displayName || navUser?.displayName || navUser?.email || "Account";
  const email = accountData?.email || navUser?.email || "";
  const creditsBalance = accountData?.creditsBalance ?? navUser?.creditsBalance ?? navUser?.credits ?? 0;
  const avatarFrame = accountData?.avatarFrame || "none";
  const avatarFrameStyles = accountData?.avatarFrameStyles ?? [];
  const backgroundUrl =
    accountData?.backgroundUrl ||
    "/ui-lab/model-detail-uicut/images/detail-side-banner.png";
  const rows = accountData?.rows ?? [];

  return (
    <main className={styles.pageShell}>
      <div className={styles.stageViewport}>
        <TopNavigation
          active="ACCOUNT"
          className={styles.boundTopNavigation}
          items={migrationTestNavItems}
          user={navUser}
        />
        <section aria-label="Account profile page" className={styles.stage}>
          <div className={styles.accountSurface}>
            <BorderComboFrame2
              aria-hidden="true"
              className={styles.comboFrameRotated}
              style={{ width: 924, height: 1857 }}
            />

            <aside className={styles.profilePanel}>
              <div className={styles.panelFrameContent}>
                <form className={styles.profileForm}>
                  <section className={styles.avatarBlock} aria-labelledby="avatar-title">
                    <h2 id="avatar-title">Avatar</h2>
                    <div className={styles.avatarRow}>
                      <div className={styles.avatarRing}>
                        <img alt="Current account avatar" decoding="async" src={avatarUrl} />
                      </div>
                      <EditButton label="EDIT" />
                    </div>
                    {avatarFrameStyles.length > 0 ? (
                      <div className={styles.avatarFrameList} aria-label="Avatar frame styles">
                        {avatarFrameStyles.slice(0, 4).map((style) => (
                          <span
                            className={style.key === avatarFrame ? styles.avatarFrameActive : ""}
                            key={style.key}
                            title={style.title}
                          >
                            {style.thumbnailUrl ? <img alt="" decoding="async" src={style.thumbnailUrl} /> : null}
                            {style.title}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <label className={styles.field}>
                    <span className={styles.fieldTitle}>Account Name</span>
                    <span className={styles.fieldHint}>
                      Please enter 4-32 valid characters (letters, numbers or hyphens)
                    </span>
                    <span className={styles.inputAction}>
                      <input defaultValue={displayName} maxLength={32} minLength={4} name="accountName" />
                      <EditButton label="EDIT" />
                    </span>
                  </label>

                  <section className={styles.backgroundField} aria-labelledby="background-title">
                    <h2 id="background-title">Background</h2>
                    <p>Supported image formats: JPEG, JPG, PNG, WEBP. Maximum file size: 5MB</p>
                    <div className={styles.backgroundPreview}>
                      <img
                        alt="Current profile background"
                        decoding="async"
                        src={backgroundUrl}
                      />
                      <strong>Hello World</strong>
                      <EditButton label="EDIT" />
                    </div>
                  </section>

                  <label className={styles.field}>
                    <span className={styles.fieldTitle}>Email</span>
                    <span className={styles.fieldHint}>Email used for registration</span>
                    <span className={styles.inputAction}>
                      <input defaultValue={email} name="email" type="email" />
                      <EditButton label="EDIT" />
                    </span>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldTitle}>Password</span>
                    <span className={styles.fieldHint}>Change your password</span>
                    <span className={styles.inputAction}>
                      <input defaultValue="********" name="password" type="password" />
                      <EditButton label="EDIT" />
                    </span>
                  </label>
                </form>
              </div>
            </aside>

            <section className={styles.accountPanel}>
              <div className={styles.accountFrameContent}>
                <div className={styles.balanceCard}>
                  <img alt="" decoding="async" src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png" />
                  <div className={styles.balanceValue}>
                    <strong>{formatCredits(creditsBalance)}</strong>
                    <span>POINTS</span>
                  </div>
                  <div className={styles.balanceLabel}>BALANCE</div>
                  <button className={styles.rechargeButton} type="button">
                    RECHARGE
                  </button>
                  <div className={styles.balanceChevron} aria-hidden="true" />
                </div>

                <h2 className={styles.historyTitle}>Points History</h2>

                <table className={styles.pointsTable}>
                  <thead>
                    <tr>
                      <th>NO.</th>
                      <th>OPERATION</th>
                      <th>ITEM</th>
                      <th>POINTS</th>
                      <th>POINTS</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.operation}</td>
                        <td>{row.item}</td>
                        <td className={styles.spent}>{row.points}</td>
                        <td>{row.balanceAfter}</td>
                        <td>{row.date}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6}>No point history yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <nav aria-label="Points history pages" className={styles.pagination}>
                  {["<", "1", "2", "3", "4", "5", "...", "99", ">"].map((item) => (
                    <button className={item === "1" ? styles.pageActive : ""} key={item} type="button">
                      {item}
                    </button>
                  ))}
                  <button className={styles.pageSize} type="button">
                    10 Items / Page
                    <span aria-hidden="true">v</span>
                  </button>
                </nav>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
