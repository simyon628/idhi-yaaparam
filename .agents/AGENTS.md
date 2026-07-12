## Git Commit Rule

When asked to commit, ALWAYS include the following Co-authored-by trailers at the end of the commit message to ensure both users get credit:

Co-authored-by: karunajyothi2005 <karunajyothi20005@gmail.com>
Co-authored-by: simyon628 <simyon628@gmail.com>

---

## 🚨 CRITICAL RULES FOR ALL MODELS (READ FIRST)

### Rule 1: Never Break Existing Code
- Before editing ANY file, read the full file first
- Only change the specific lines needed — do NOT rewrite entire files
- Test after each phase by running `npm run dev` and checking the browser by suer
- If a phase fails, revert ONLY that phase's changes

### Rule 2: One Phase at a Time
- Complete one phase fully before starting the next
- Each phase is designed to be self-contained
- Mark phases as ✅ DONE in this file after completing them

### Rule 3: Color Constants
- Brand Primary: `#0B57D0` (Google Blue)
- Brand Mid: `#1A73E8`
- Brand Light: `#4285F4`
- Accent: `#F59E0B` (Amber — for ratings/warnings only)
- Success: `#10B981` (Green — for "Available" badges only)
- Error: `#EF4444` (Red — for errors only)
- **BANNED COLORS**: `#6C4DFF`, `#5548E8`, `#7B72FF`, `#9B82FF` (purple — remove everywhere)

### Rule 4: File Ownership Per Phase
Each phase lists EXACTLY which files it touches. Do NOT touch files outside that list.

---

## 📋 UX OVERHAUL — PHASE TRACKER

### Phase 1A: Homepage Alignment Fix ✅ DONE
**Files**: `app/rentals/page.tsx`, `components/ui/ProductCard.tsx`
**Goal**: Fix left alignment of categories, search bar, product shelves. Add "peek" effect on right side for scrollable cards.
**Time**: ~15 min
**Test**: Open homepage → categories, search bar, banner, product rows should all start at same left edge. Right side of product rows should show a partial card.

### Phase 1B: Kill Purple — Enforce Brand Blue ⬜ NOT STARTED
**Files**: `lib/theme.config.ts`, `components/search/SearchTrigger.tsx`, `app/rentals/[id]/page.tsx`
**Goal**: Replace ALL purple/violet colors with brand blue `#0B57D0`
**Time**: ~10 min
**Test**: Check rental detail page (date picker, price), search trigger button — all should be blue, zero purple.

### Phase 1C: Fix SearchTrigger for Light Background ✅ DONE
**Files**: `components/search/SearchTrigger.tsx`
**Goal**: SearchTrigger was designed for dark header. Fix colors for white background.
**Time**: ~10 min
**Test**: Open Near You page → search bar text should be dark, icons visible, submit button blue.

### Phase 1D: Fix Price Display Default ✅ DONE
**Files**: `app/rentals/[id]/page.tsx`
**Goal**: Default to 1-day rental (not 4 days). Hide "× 0 hours = ₹0" line. Show hourly rate prominently.
**Time**: ~10 min
**Test**: Open any rental detail → price should show ~₹360 (1 day at ₹15/hr), not ₹1440.

### Phase 2A: Near You Page — Layout + Filters ✅ DONE
**Files**: `app/near-you/page.tsx`
**Goal**: Add department filter, fix empty bands, improve grid layout, reduce white space.
**Time**: ~20 min
**Test**: Filter by department → shows relevant items or "No items" message. No massive white gaps.

### Phase 2B: Category Page — Inline Filters + Search ⬜ NOT STARTED
**Files**: `app/category/[slug]/page.tsx`
**Goal**: Add visible search bar, separate sort/branch into inline chips, fix empty state.
**Time**: ~20 min
**Test**: Open calculator category → search bar visible, sort chips work independently, empty state has CTA.

### Phase 2C: Consistent Page Header ⬜ NOT STARTED
**Files**: `components/layout/TopBar.tsx`, `app/near-you/page.tsx`
**Goal**: Make Near You use same search bar style as homepage. Add search input (not just button).
**Time**: ~15 min
**Test**: Near You page should have a proper search input matching homepage style.

### Phase 3A: Search — Wire Real Firestore Results ⬜ NOT STARTED
**Files**: `stores/searchStore.ts`, `components/search/SearchDropdownContent.tsx`, `hooks/useSearch.ts`
**Goal**: When user types in search, query Firestore and show real product results.
**Time**: ~30 min
**Test**: Type "calc" → see calculator products with images and prices.

### Phase 3B: Rich Empty States ⬜ NOT STARTED
**Files**: `components/ui/EmptyState.tsx`, `app/near-you/page.tsx`, `app/category/[slug]/page.tsx`
**Goal**: Replace blank white space with illustrated empty states + CTAs.
**Time**: ~15 min
**Test**: Filter to a category with 0 items → see a rich message, not white space.

### Phase 3C: Bottom Nav Notch Fix ⬜ NOT STARTED
**Files**: `components/layout/BottomNav.tsx`
**Goal**: Fix the notch circle background to match page background.
**Time**: ~5 min
**Test**: Homepage → notch circle should be invisible (blends with white background).
