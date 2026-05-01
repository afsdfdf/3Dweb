export const topNavigationUserLabelMaxCharacters = 12;

type TopNavigationUserLabelSource = {
  displayName?: null | string;
  email?: null | string;
  name?: null | string;
};

const userLabelEllipsis = "...";

const normalizeUserLabel = (value?: null | string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const getTopNavigationUserLabel = (user: TopNavigationUserLabelSource, fallback?: null | string) => {
  return (
    normalizeUserLabel(user.displayName) ??
    normalizeUserLabel(user.name) ??
    normalizeUserLabel(user.email) ??
    normalizeUserLabel(fallback) ??
    "Account"
  );
};

export const formatTopNavigationUserLabel = (
  label: string,
  maxCharacters = topNavigationUserLabelMaxCharacters,
) => {
  const normalized = normalizeUserLabel(label) ?? "Account";
  const characters = Array.from(normalized);

  if (characters.length <= maxCharacters) {
    return normalized;
  }

  const visibleCharacters = Math.max(1, maxCharacters - userLabelEllipsis.length);
  return `${characters.slice(0, visibleCharacters).join("")}${userLabelEllipsis}`;
};
