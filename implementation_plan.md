# Frontend Status & Development Plan

> Last updated: 2026-03-31
> Scope: Update frontend completion progress based on the current code in `frontend/`, align the next development plan with `.agent/workflows/ui-ux-pro-max.md`, and cross-check the existing design direction in `design-system/minidiscord/MASTER.md`.

## Validation Snapshot

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | Pass | No TypeScript errors on 2026-03-31 |
| `npm run lint` | Fail | 1 error in `frontend/components/ui/SlidingPanel.tsx`, 6 warnings for unused vars/imports and one `no-img-element` warning |

---

## Overall Completion

| Metric | Estimate | Meaning |
|--------|----------|---------|
| Frontend UI with mock data | `~75%` | Main user-facing flows already exist and are usable |
| Production-ready frontend | `~40%` | Real API/WebSocket integration, responsive behavior, and polish are still incomplete |

### Summary

- The project already has a solid Discord-like frontend shell: auth pages, dashboard/friends, channel chat, DM chat, settings overlay, reusable UI primitives, theming, and in-memory chat state.
- The biggest remaining gap is not "missing screens", but "missing completion quality": responsive layout, full i18n coverage, lint cleanup, interaction polish, and replacing mock-driven flows with real backend data.
- The current design-system master file is only partially useful because it was generated with a direction closer to a community/landing product than a desktop chat workspace. We should keep its spacing/interaction rules, but not let it override the functional Discord-like layout already built.

---

## Current Progress By Area

| Area | Status | Progress | Current state |
|------|--------|----------|---------------|
| Foundation and theming | Mostly done | `85%` | Tailwind v4, theme provider, Inter font, dark/light tokens, `cn()` helper, reusable UI primitives are in place |
| Auth UI | Mostly done | `80%` | Login/register screens exist with `react-hook-form` + `zod`, but current submit flow still redirects with mock behavior instead of fully using `authStore` |
| Main app shell | Mostly done | `78%` | Server list, channel/DM sidebar, user panel, settings entry, resize handle, and 4-column structure exist |
| Channel chat experience | Mostly done | `80%` | Chat header, message list, message actions, replies, reactions, and member-list toggle are implemented |
| DM experience | Mostly done | `85%` | DM page, reply flow, user panel, confirm modal, and new-message modal are implemented; some actions are still UI-only |
| Friends and dashboard | Mostly done | `80%` | Online/all/pending/add-friend tabs and Active Now panel exist with coherent UI |
| Settings and localization | Partial | `70%` | Settings overlay works and locale store exists, but many strings are still hardcoded and settings is not yet a full-page experience |
| State and data integration | Partial | `45%` | Zustand stores and Axios client exist, but most views still render from mock data and placeholder hooks |
| Responsive, accessibility, performance | Early | `40%` | Reduced-motion support exists globally, but mobile/tablet layout handling and accessibility polish are still incomplete |

---

## Progress Against The Previous Frontend Plan

| Planned item | Updated status | Notes |
|--------------|----------------|-------|
| Step 1 - Design system and scaffold | Done | Dependencies, theme provider, global tokens, font setup, and utility helpers are already present |
| Step 2 - Base UI components | Done | Core UI primitives and custom Discord-style components exist |
| Step 3 - Auth pages | Mostly done | UI is present; business integration is still partial |
| Step 4 - Main layout skeleton | Done | Left shell, chat area, and right panel pattern are already in use |
| 2.1 Column 4 toggle | Done | Channel member list and DM user panel both toggle via UI state |
| 2.2 UserPanel span verification | Done | User panel is already rendered below the combined left shell |
| 2.3 Responsive breakpoints | Not done | Desktop-first layout exists, but responsive collapse rules are still missing |
| 2.4 i18n completion | Partial | Locale store and many keys exist, but multiple components still contain hardcoded text |
| 2.5 Friends "Online" tab | Done | Online tab is implemented |
| 2.6 Missing header icons | Done | Threads, inbox, help, and member toggle icons are present |
| 2.7 DM sidebar close button | Partial | Close button UI exists, but removal logic is still TODO |
| 2.8 Settings full-page transition | Not done | Current implementation is still a modal-style overlay |
| 2.9 Micro-animations | Partial | Sliding panel and hover transitions exist, but motion system is not yet consistent |
| 2.10 SVG language flags | Not done | `LanguageSwitcher` still uses emoji flags |
| 2.11 Auth page consistency | Partial | Login is more polished than register; register still needs visual alignment |
| 2.12 Code cleanup | Partial | Some duplication and lint warnings remain |
| 2.13 Accessibility polish | Partial | Focus and reduced-motion exist, but keyboard flows and non-color status cues still need work |

---

## UI/UX Direction Based On `ui-ux-pro-max`

### Rules we should keep

- Use a dark, high-contrast, desktop-first workspace layout because this product behaves more like a communication tool than a marketing site.
- Keep hover and panel transitions in the `150-300ms` range.
- Use SVG/Lucide-style icons only for UI controls.
- Ensure all clickable elements have visible hover feedback and `cursor-pointer`.
- Respect `prefers-reduced-motion` for every new animation we add.
- Verify layout quality at `375px`, `768px`, `1024px`, and `1440px`.

### How to adapt the workflow for MiniDiscord

- Keep the current Discord-like information hierarchy: navigation -> conversation -> context panel.
- Use vibrant accents only for active states, CTAs, and highlights. Do not turn the whole workspace into a marketing-style colorful interface.
- Favor readable density over decorative effects. Chat products need stable spacing, fast scanning, and low visual noise.
- Avoid style directions like cyberpunk/glow-heavy UI for the main app shell because they reduce readability in long chat sessions.
- Continue using shadcn-style primitives where useful, but do not rewrite stable custom layout code only to force a library pattern.

### Design-system caveat

The current `design-system/minidiscord/MASTER.md` is not a strong visual source of truth for the app shell because:

- it was generated with a category closer to community landing / music-style direction;
- it overemphasizes landing-page patterns instead of workspace patterns;
- its palette suggestions are less aligned with the existing Discord-like chat interface.

### Recommended use of the current design system

- Keep: typography choice, spacing rhythm, interaction quality rules, accessibility checklist.
- Re-define: page-specific rules for `dashboard`, `channel`, `dm`, and `settings`.
- Do not blindly apply: marketing-oriented hero/testimonial/CTA guidance to the authenticated app shell.

---

## Main Gaps To Close Next

### Product gaps

- Auth pages still behave like mock screens rather than real authenticated flows.
- Most data shown in the app still comes from `mock-data.ts`.
- WebSocket, auth, and message hooks are still placeholders.
- Settings still open as an overlay instead of a stronger page-level settings experience.

### UI/UX gaps

- No real responsive shell for tablet/mobile yet.
- Mixed hardcoded Vietnamese and English strings reduce translation quality.
- Register page still trails login in visual polish.
- The right-side panels are usable, but their motion behavior and layout transitions still need refinement.

### Quality gaps

- Lint blocker in `SlidingPanel`.
- Unused imports/variables in a few files.
- `ServerIcon` still uses `<img>` instead of a better image strategy.
- Some labels, aria text, and status semantics are not yet fully accessible.

---

## Prioritized Development Plan

### P0 - Stabilize The Current Frontend Shell

Target: 1-3 days

### Goals

- Make the current frontend clean, accurate, and ready for further integration.

### Tasks

- Fix the lint error in `frontend/components/ui/SlidingPanel.tsx`.
- Clean unused imports/variables in layout, DM page, friends page, and channel list.
- Replace remaining high-impact hardcoded strings in chat, DM, auth, and settings with `i18n` keys.
- Add responsive behavior for the 4-column shell:
  - `>=1440px`: full desktop layout
  - `1024-1439px`: column 4 hidden by default
  - `768-1023px`: collapsible left secondary sidebar
  - `<768px`: drawer-based navigation and single main content column
- Make register page visually consistent with login.
- Decide the final authenticated-app design direction:
  - keep current Discord-like base;
  - regenerate or override design-system rules specifically for `dashboard`, `channel`, `dm`, and `settings`.

### Done when

- `npm run lint` passes.
- Text content is no longer mixed/hardcoded in the main flows.
- Desktop, tablet, and mobile shell behaviors are defined and implemented.

### P1 - Connect Real App Flows

Target: 3-5 days

### Goals

- Move from mock-driven UI to frontend flows that can consume backend APIs cleanly.

### Tasks

- Wire login/register pages to `useAuthStore`.
- Use `authStore.hydrate()` and fetch current user data after token restore.
- Introduce data adapters so pages can switch from `mock-data.ts` to backend payloads without major UI rewrites.
- Start replacing `MOCK_*` usage in:
  - dashboard/friends;
  - channel page;
  - DM page;
  - member list / user panel.
- Define empty/loading/error states for lists and chat views.
- Finish the DM close/remove behavior or clearly defer it behind a disabled state.
- Convert settings from overlay-only experience into a route-aware settings screen or hybrid page shell.

### Done when

- Auth and page hydration use real store logic.
- Mock data is no longer the only source for main screens.
- The UI handles loading and error states gracefully.

### P2 - Real-Time And Interaction Polish

Target: 5-7 days

### Goals

- Make the app feel alive and production-ready.

### Tasks

- Implement `useWebSocket`, `useMessages`, and real message sync.
- Add typing indicators, message delivery feedback, and better optimistic updates.
- Standardize motion:
  - panel open/close easing;
  - route transition behavior;
  - reduced-motion fallback.
- Improve keyboard support, focus trapping, aria labels, and non-color status indicators.
- Replace emoji-based language flags with SVG assets.
- Review hover/active states to ensure no layout shift and consistent motion timing.

### Done when

- Core chat flows feel real-time instead of mock-local.
- Motion is consistent and accessible.
- Main interaction surfaces pass keyboard and focus checks.

---

## Suggested Sprint Sequence

| Sprint | Focus | Output |
|--------|-------|--------|
| Sprint 1 | UI stabilization | Lint-clean, responsive shell, i18n cleanup, auth visual consistency |
| Sprint 2 | Data integration | Real auth flow, view adapters, loading/error states, reduced mock dependency |
| Sprint 3 | Real-time polish | WebSocket integration, typing/presence updates, a11y and motion polish |

---

## Immediate Next Tasks

If we continue right now, the highest-value order is:

1. Fix `SlidingPanel` and make `npm run lint` pass.
2. Finish the i18n sweep in chat, DM, auth, and settings.
3. Implement responsive behavior for the 4-column shell.
4. Wire auth pages to `authStore` and stop using redirect-only mock submit logic.
5. Regenerate or override the design-system rules for authenticated app pages so future UI work stays consistent.

---

## Notes For Future Frontend Work

- Treat the current frontend as a strong mock-driven prototype, not as a throwaway build.
- Do not rebuild the UI from scratch. The better path is to stabilize, refactor, then integrate.
- The next milestone should optimize for consistency and integration, not for adding more screens.
