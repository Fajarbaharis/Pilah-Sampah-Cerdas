/**
 * Project: BERSEKA
 * Branding & Logo Assets with Cache Busting
 * Copyright (c) 2026 BERSEKA
 */

const LOGO_VERSION = "20261022_v2";

export const BERSEKA_LOGOS = {
  // Official Full Horizontal Logo (Emblem + Black BERSEKA + Green .ID)
  fullWebp: `/logos/berseka/berseka-logo-full.webp?v=${LOGO_VERSION}`,
  fullPng: `/logos/berseka/berseka-logo-full.png?v=${LOGO_VERSION}`,
  fullSvg: `/logos/berseka/berseka-logo-full.svg?v=${LOGO_VERSION}`,

  // Circular Transparent Emblem Icon (Used in Sidebar Mini, Shell, Favicons)
  emblemPng: `/logos/berseka/berseka-logo-bg-transparent.png?v=${LOGO_VERSION}`,
  appLogo: `/app-logo.png?v=${LOGO_VERSION}`,
  appIcon: `/app-icon.png?v=${LOGO_VERSION}`,

  // White Background Variants
  fullWhitePng: `/logos/berseka/berseka-logo-text-bg-white.png?v=${LOGO_VERSION}`,
  emblemWhitePng: `/logos/berseka/berseka-logo-bg-white.png?v=${LOGO_VERSION}`,
};

export default BERSEKA_LOGOS;
