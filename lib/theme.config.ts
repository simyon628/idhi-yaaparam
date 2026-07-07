/**
 * lib/theme.config.ts
 *
 * ═══════════════════════════════════════════════════════════════════
 * SINGLE SOURCE OF TRUTH for Idhi Yaaparam brand colors & gradients.
 * ═══════════════════════════════════════════════════════════════════
 *
 * When to change this file:
 *   - Major rebrand (e.g., festival theme, partnership)
 *   - RARE — only 1-2 times per year
 *
 * What NOT to change here (use Owner Panel instead):
 *   - Carousel/banner images → Owner Panel → Manage Banners
 *   - Promotional content → Owner Panel
 *
 * How to change:
 *   1. Edit the colors below
 *   2. Save the file
 *   3. Redeploy (vercel deploy / git push)
 *   4. All homepage components auto-update
 */

export const theme = {
  // ── Brand Identity ─────────────────────────────────────────────
  brand: {
    // Main gradient used on homepage header
    gradient: "linear-gradient(135deg, #0B57D0 0%, #1A73E8 40%, #4285F4 100%)",
    // Vertical gradient for taller header sections
    gradientVertical: "linear-gradient(180deg, #0B57D0 0%, #1A73E8 60%, #4285F4 100%)",
    // Primary brand color (buttons, highlights)
    primary: "#0B57D0",
    primaryMid: "#1A73E8",
    primaryLight: "#4285F4",
    primaryLighter: "#8AB4F8",
    primaryPale: "#E8F0FE",  // Very light blue for backgrounds
    // Accent color for CTAs and highlights
    accent: "#F59E0B",
    accentLight: "#FDE68A",
  },

  // ── Header Section ────────────────────────────────────────────
  header: {
    background: "#F8FAFC",
    textColor: "#111827",
    subtextColor: "#6B7280",
    // Search bar inside the gradient header
    searchBg: "#FFFFFF",
    searchBorder: "rgba(0,0,0,0.1)",
    searchShadow: "0 2px 8px rgba(0,0,0,0.05)",
    searchPlaceholder: "#9CA3AF",
    searchText: "#111827",
  },

  // ── Mode Tabs (Rentals / Writing / Buy & Sell) ────────────────
  tab: {
    activeBg: "#0B57D0",
    activeText: "#FFFFFF",
    activeShadow: "0 4px 12px rgba(11,87,208,0.25)",
    inactiveBg: "#FFFFFF",
    inactiveText: "#4B5563",
    inactiveBorder: "rgba(0,0,0,0.1)",
  },

  // ── Logo ──────────────────────────────────────────────────────
  logo: {
    iconBg: "#FFFFFF",
    iconShadow: "none",
    emoji: "🚀",
  },

  // ── College Chip & Notification Bell ──────────────────────────
  chip: {
    bg: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.1)",
    text: "#111827",
    dotColor: "#22C55E",
  },

  // ── Surfaces ──────────────────────────────────────────────────
  surface: "#F8FAFC",
  card: "#FFFFFF",

  // ── Bottom Navigation ─────────────────────────────────────────
  bottomNav: {
    bg: "#FFFFFF",
    activeColor: "#0B57D0",
    inactiveColor: "#9CA3AF",
    activeGlow: "rgba(11,87,208,0.1)",
  },
} as const;

// ── Type export for consumers ───────────────────────────────────
export type ThemeConfig = typeof theme;
