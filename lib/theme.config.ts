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
  // ── Brand Identity (the purple gradient) ──────────────────────
  brand: {
    // Main gradient used on homepage header
    gradient: "linear-gradient(135deg, #7C3AED 0%, #9333EA 40%, #A855F7 100%)",
    // Vertical gradient for taller header sections
    gradientVertical: "linear-gradient(180deg, #7C3AED 0%, #9333EA 60%, #A855F7 100%)",
    // Primary brand color (buttons, highlights)
    primary: "#7C3AED",
    primaryMid: "#9333EA",
    primaryLight: "#A855F7",
    primaryLighter: "#C084FC",
    primaryPale: "#EDE9FE",  // Very light purple for backgrounds
    // Accent color for CTAs and highlights
    accent: "#F59E0B",
    accentLight: "#FDE68A",
  },

  // ── Header Section ────────────────────────────────────────────
  header: {
    background: "linear-gradient(180deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255,255,255,0.7)",
    // Search bar inside the gradient header
    searchBg: "rgba(255,255,255,0.95)",
    searchBorder: "rgba(255,255,255,0.3)",
    searchShadow: "0 4px 20px rgba(124,58,237,0.2)",
    searchPlaceholder: "#9CA3AF",
    searchText: "#1F2937",
  },

  // ── Mode Tabs (Rentals / Writing / Buy & Sell) ────────────────
  tab: {
    activeBg: "#FFFFFF",
    activeText: "#7C3AED",
    activeShadow: "0 2px 12px rgba(124,58,237,0.25)",
    inactiveBg: "rgba(255,255,255,0.15)",
    inactiveText: "rgba(255,255,255,0.8)",
    inactiveBorder: "rgba(255,255,255,0.2)",
  },

  // ── Logo ──────────────────────────────────────────────────────
  logo: {
    iconBg: "linear-gradient(135deg, #FFFFFF 0%, #EDE9FE 100%)",
    iconShadow: "0 4px 16px rgba(124,58,237,0.35)",
    emoji: "🚀",
  },

  // ── College Chip & Notification Bell ──────────────────────────
  chip: {
    bg: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    text: "rgba(255,255,255,0.9)",
    dotColor: "#34D399",
  },

  // ── Surfaces ──────────────────────────────────────────────────
  surface: "#F3F4F6",
  card: "#FFFFFF",

  // ── Bottom Navigation ─────────────────────────────────────────
  bottomNav: {
    bg: "linear-gradient(135deg, #1E1E30, #252540)",
    activeColor: "#A855F7",
    inactiveColor: "rgba(255,255,255,0.32)",
    activeGlow: "rgba(168,85,247,0.14)",
  },
} as const;

// ── Type export for consumers ───────────────────────────────────
export type ThemeConfig = typeof theme;
