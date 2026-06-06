"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Zap } from "lucide-react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";

import styles from "./formal-components-registry.module.css";

const languageOptions = ["En", "Ar", "Zh-CN", "Cs", "Da"] as const;
const profileMenuIcons = {
  account: "/ui-lab/top-navigation/profile-menu-icon-account@2x.png",
  assetLibrary: "/ui-lab/top-navigation/profile-menu-icon-asset-library@2x.png",
  check: "/ui-lab/top-navigation/profile-menu-icon-check@2x.png",
  chevronDown: "/ui-lab/top-navigation/profile-menu-icon-chevron-down@2x.png",
  language: "/ui-lab/top-navigation/profile-menu-icon-language@2x.png",
  logout: "/ui-lab/top-navigation/profile-menu-icon-logout@2x.png",
  models: "/ui-lab/top-navigation/profile-menu-icon-models@2x.png",
  users: "/ui-lab/top-navigation/profile-menu-icon-users@2x.png",
} as const;

export function ProfileMenuReferencePreview() {
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof languageOptions)[number]>("En");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  return (
    <div className={styles.profileMenuReferenceStage}>
      <ButtonBoxFrame
        className={styles.profileMenuReferenceFrame}
        contentClassName={styles.profileMenuReferenceFrameContent}
        style={{ height: 414, width: 320 }}
      >
        <div className={styles.profileMenuReferencePanel}>
          <div className={styles.profileMenuHero}>
            <span className={styles.profileMenuAvatar}>
              <span className={styles.profileMenuAvatarInner}>
                <img alt="" src="/ui/workbench/model-detail/sketch-assets/creator-avatar.jpg" />
              </span>
            </span>

            <div className={styles.profileMenuNamePlate}>
              <strong>Xing Mu</strong>
              <span>Is an outstanding anime...</span>
            </div>
          </div>

          <div className={styles.profileMenuStats}>
            <div className={styles.profileMenuCreditPill}>
              <img alt="" src="/ui-lab/top-navigation/icon-coin-badge.png" />
              <strong>560</strong>
            </div>
            <div className={styles.profileMenuStat}>
              <img alt="" className={styles.profileMenuStatIcon} src={profileMenuIcons.users} />
              <span>560</span>
            </div>
            <div className={styles.profileMenuStat}>
              <img alt="" className={styles.profileMenuStatIcon} src={profileMenuIcons.models} />
              <span>23</span>
            </div>
          </div>

          <div className={styles.profileMenuDivider} />

          <nav className={styles.profileMenuLinks} aria-label="Profile menu reference">
            <a className={styles.profileMenuLink} href="#asset-library">
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.assetLibrary} />
              <span className={styles.profileMenuLinkText}>Asset Library</span>
            </a>
            <a className={styles.profileMenuLink} href="#personal-center">
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.account} />
              <span className={styles.profileMenuLinkText}>Personal Center</span>
            </a>
            <a className={styles.profileMenuLink} href="#point-redemption">
              <span className={styles.profileMenuPointIcon} aria-hidden="true">
                <Zap size={16} strokeWidth={2.3} />
              </span>
              <span className={styles.profileMenuLinkText}>Point Redemption</span>
            </a>
            <div className={styles.profileMenuLanguageRow}>
              <span className={styles.profileMenuLanguageLabel}>
                <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.language} />
                <span className={styles.profileMenuLinkText}>Language</span>
              </span>
              <button
                aria-controls="profile-menu-reference-language-list"
                aria-expanded={isLanguageOpen}
                aria-haspopup="listbox"
                className={styles.profileMenuLanguageButton}
                onClick={() => setIsLanguageOpen((current) => !current)}
                type="button"
              >
                <span>{selectedLanguage}</span>
                <img alt="" className={styles.profileMenuArrowIcon} src={profileMenuIcons.chevronDown} />
              </button>
            </div>
            <button className={styles.profileMenuLink} type="button">
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.logout} />
              <span className={styles.profileMenuLinkText}>Log Out</span>
            </button>
          </nav>

          {isLanguageOpen ? (
            <div
              aria-label="Language"
              className={styles.profileMenuLanguageMenu}
              id="profile-menu-reference-language-list"
              role="listbox"
            >
              {languageOptions.map((option) => {
                const isSelected = selectedLanguage === option;

                return (
                  <button
                    aria-selected={isSelected}
                    className={isSelected ? styles.profileMenuLanguageOptionActive : styles.profileMenuLanguageOption}
                    key={option}
                    onClick={() => {
                      setSelectedLanguage(option);
                      setIsLanguageOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <span>{option}</span>
                    {isSelected ? <img alt="" className={styles.profileMenuTickIcon} src={profileMenuIcons.check} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </ButtonBoxFrame>
    </div>
  );
}
