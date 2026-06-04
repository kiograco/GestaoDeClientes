# Premium SaaS CRM Redesign

This document defines a complete visual redesign system for the CRM. It preserves existing functionality while upgrading the product into a modern, trustworthy, data-driven SaaS experience.

The current frontend is Vue + Quasar. The implementation tokens below are framework-neutral and ready for Angular + TypeScript + TailwindCSS through CSS variables. They can also be mapped back into Quasar variables.

## Product Direction

The CRM should feel operational, calm, fast, and reliable. The interface must prioritize repeated daily work: triaging tickets, reading conversations, finding contacts, monitoring teams, launching campaigns, and managing billing.

Design goals:

- Increase perceived product value on first load.
- Make navigation predictable and grouped by workflow.
- Improve visual hierarchy in dense CRM screens.
- Make dashboards executive and decision-oriented.
- Standardize controls across tickets, contacts, campaigns, chatbot, queues, reports, billing, and settings.
- Support light and dark mode without one-off overrides.

## Visual Diagnosis

Current strengths:

- Broad functional coverage: tickets, contacts, campaigns, chatbot, reports, billing, settings, delivery, superadmin.
- Existing dark mode support.
- Quasar component base allows consistent rollout.
- Layout already separates main shell, pages, and feature modules.

Main issues to fix:

- Colors feel dated and inconsistent: bright blue, purple, green chat bubble, gray backgrounds, and dark mode overrides compete.
- Dashboard cards lack KPI hierarchy and executive framing.
- Sidebar is navigation-heavy but not workflow-grouped enough.
- Header lacks command-search, quick actions, and compact user context.
- Cards, tables, buttons, and modals rely on repeated rounded/flat styles rather than a deliberate component system.
- Chat screen uses WhatsApp-like styling; it should become a professional support workspace while still feeling familiar.
- Dark mode is applied through many component-specific overrides, making contrast and maintenance fragile.

## Brand Attributes

- Trust: deep blue primary, restrained neutrals, clear states.
- Technology: cyan/indigo accents used sparingly.
- Professionalism: dense but readable layouts, low visual noise.
- Stability: consistent borders, subdued shadows, predictable spacing.
- Productivity: compact controls, visible statuses, keyboard-friendly navigation.

## Color System

Use blue as the primary brand because it communicates trust and operational stability. Use teal/cyan as secondary for automation and productivity accents. Avoid dominant purple gradients, beige themes, and saturated WhatsApp green as the main brand.

### Primary: Trust Blue

| Token | Hex |
|---|---|
| primary-50 | #EFF6FF |
| primary-100 | #DBEAFE |
| primary-200 | #BFDBFE |
| primary-300 | #93C5FD |
| primary-400 | #60A5FA |
| primary-500 | #2563EB |
| primary-600 | #1D4ED8 |
| primary-700 | #1E40AF |
| primary-800 | #1E3A8A |
| primary-900 | #172554 |

### Secondary: Productive Cyan

| Token | Hex |
|---|---|
| secondary-50 | #ECFEFF |
| secondary-100 | #CFFAFE |
| secondary-200 | #A5F3FC |
| secondary-300 | #67E8F9 |
| secondary-400 | #22D3EE |
| secondary-500 | #06B6D4 |
| secondary-600 | #0891B2 |
| secondary-700 | #0E7490 |
| secondary-800 | #155E75 |
| secondary-900 | #164E63 |

### Success

| Token | Hex |
|---|---|
| success-50 | #ECFDF5 |
| success-100 | #D1FAE5 |
| success-200 | #A7F3D0 |
| success-300 | #6EE7B7 |
| success-400 | #34D399 |
| success-500 | #10B981 |
| success-600 | #059669 |
| success-700 | #047857 |
| success-800 | #065F46 |
| success-900 | #064E3B |

### Warning

| Token | Hex |
|---|---|
| warning-50 | #FFFBEB |
| warning-100 | #FEF3C7 |
| warning-200 | #FDE68A |
| warning-300 | #FCD34D |
| warning-400 | #FBBF24 |
| warning-500 | #F59E0B |
| warning-600 | #D97706 |
| warning-700 | #B45309 |
| warning-800 | #92400E |
| warning-900 | #78350F |

### Error

| Token | Hex |
|---|---|
| error-50 | #FEF2F2 |
| error-100 | #FEE2E2 |
| error-200 | #FECACA |
| error-300 | #FCA5A5 |
| error-400 | #F87171 |
| error-500 | #EF4444 |
| error-600 | #DC2626 |
| error-700 | #B91C1C |
| error-800 | #991B1B |
| error-900 | #7F1D1D |

### Neutral

| Token | Hex |
|---|---|
| neutral-50 | #F8FAFC |
| neutral-100 | #F1F5F9 |
| neutral-200 | #E2E8F0 |
| neutral-300 | #CBD5E1 |
| neutral-400 | #94A3B8 |
| neutral-500 | #64748B |
| neutral-600 | #475569 |
| neutral-700 | #334155 |
| neutral-800 | #1E293B |
| neutral-900 | #0F172A |

### Semantic Usage

- Primary actions: primary-600 light, primary-500 dark.
- Links: primary-600 light, primary-300 dark.
- Sidebar active: primary-50 background, primary-700 text, primary-600 left indicator.
- App background: neutral-50 light, neutral-950-equivalent dark `#020617`.
- Surfaces: white light, neutral-900 dark.
- Borders: neutral-200 light, neutral-800 dark.
- Text primary: neutral-900 light, neutral-50 dark.
- Text secondary: neutral-600 light, neutral-400 dark.

## Typography System

Recommended font stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Fallback if Inter is not bundled: keep system UI. Avoid loading too many weights.

| Style | Size | Line Height | Weight | Use |
|---|---:|---:|---:|---|
| H1 | 32px | 40px | 700 | Page title, executive dashboard |
| H2 | 24px | 32px | 700 | Section title |
| H3 | 20px | 28px | 650 | Card group title |
| H4 | 16px | 24px | 650 | Panel title |
| Body Large | 16px | 24px | 400 | Important prose |
| Body | 14px | 22px | 400 | Default UI copy |
| Body Small | 13px | 20px | 400 | Dense tables, metadata |
| Label | 12px | 16px | 600 | Inputs, filters, buttons |
| Caption | 11px | 16px | 500 | Timestamps, hints |
| KPI | 30px | 36px | 750 | Dashboard metrics |

Rules:

- Use sentence case for UI labels.
- Do not use hero-size text inside cards or sidebars.
- Keep table text 13-14px with 40-48px row height.
- Use `font-variant-numeric: tabular-nums` for KPIs, timers, prices, and dates.

## Spacing Tokens

Use a 4px base grid.

| Token | Value |
|---|---:|
| space-0 | 0 |
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 20px |
| space-6 | 24px |
| space-8 | 32px |
| space-10 | 40px |
| space-12 | 48px |
| space-16 | 64px |

Layout:

- Page padding mobile: 16px.
- Page padding desktop: 24px or 32px.
- Card padding: 16px compact, 20px default, 24px analytical.
- Form field vertical gap: 16px.
- Dashboard grid gap: 16px mobile, 20px desktop.

## Radius Tokens

Keep SaaS components crisp. Avoid excessive rounding.

| Token | Value | Use |
|---|---:|---|
| radius-none | 0 |
| radius-xs | 4px | Badges, small controls |
| radius-sm | 6px | Inputs, buttons |
| radius-md | 8px | Cards, dropdowns, modals |
| radius-lg | 12px | Large analytical panels only |
| radius-full | 999px | Avatars, pills only |

## Shadow System

Use borders for structure and subtle shadows for overlays.

| Token | Value | Use |
|---|---|---|
| shadow-xs | `0 1px 2px rgba(15, 23, 42, .05)` | Cards |
| shadow-sm | `0 4px 12px rgba(15, 23, 42, .08)` | Dropdowns |
| shadow-md | `0 12px 24px rgba(15, 23, 42, .12)` | Modals |
| shadow-lg | `0 24px 60px rgba(15, 23, 42, .18)` | Drawers, command palette |

## Layout System

### App Shell

Desktop:

- Sidebar width: 264px expanded, 72px collapsed.
- Header height: 64px.
- Content max width: none for operational screens; 1440px for settings/billing pages.
- Main background: neutral-50.
- Use one page header per screen: title, subtitle/status, primary action, secondary actions.

Mobile:

- Sidebar becomes drawer.
- Header keeps menu, current section, notifications, user avatar.
- Tables become card lists or horizontally scroll with sticky first action column.

### Sidebar

Group navigation by user intent:

1. Workspace
   - Dashboard
   - Tickets
   - Contacts
   - Companies
2. Growth
   - Campaigns
   - Chatbot
   - Quick messages
3. Operations
   - Queues
   - Reports
   - WhatsApp channels
   - Delivery
4. Admin
   - Users
   - Settings
   - API
   - Billing

States:

- Default: neutral-600 text, transparent background.
- Hover: neutral-100 background, neutral-900 text.
- Active: primary-50 background, primary-700 text, 3px primary-600 left indicator.
- Collapsed: icon button with tooltip and active dot.
- Badges: pending ticket count, disconnected channel count, expiring subscription count.

### Header

Replace the current icon cluster with:

- Global search / command palette: `Search contacts, tickets, campaigns...`
- Quick action button: New ticket, contact, campaign, channel.
- Notification center with grouped tabs: Tickets, System, Billing.
- Agent status switch: Online, Busy, Offline.
- Profile menu: Profile, Preferences, Billing, Help, Logout.

Header should be quiet: white/dark surface, bottom border, compact icon buttons.

## Dashboard Redesign

Dashboard should answer: What is happening now, what needs attention, how is the team performing, and what is revenue/usage doing?

### Structure

1. Page header
   - Title: `Dashboard`
   - Subtitle: selected date range and queues.
   - Controls: date range, queue filter, channel filter, refresh.

2. KPI row
   - Total conversations
   - Open tickets
   - First response time
   - Resolution time
   - New contacts
   - Revenue / subscription collected

3. Main analytics grid
   - Conversation volume by day, stacked by channel.
   - Tickets by queue/status.
   - SLA risk list.
   - Active agents panel.

4. Operational feed
   - Recent conversations needing response.
   - Campaign performance.
   - Customer satisfaction trend.
   - Channel health.

### KPI Card Pattern

Each KPI card:

- Small label.
- Large metric.
- Delta chip.
- Short context line.
- Optional mini sparkline.

Example:

```html
<section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
  <app-kpi-card label="Open tickets" value="128" delta="+12%" trend="up" context="vs previous period" />
  <app-kpi-card label="First response" value="2m 14s" delta="-18%" trend="good" context="median response time" />
</section>
```

## Component Guidelines

### Buttons

- Primary: filled primary-600, white text, 36-40px height.
- Secondary: white/dark surface, neutral border, neutral text.
- Ghost: transparent, neutral text, hover surface.
- Danger: error-600 filled or error-50 text for destructive secondary.
- Icon buttons: 36px square, radius-sm, tooltip required.
- Loading: spinner left of label, keep width stable.

### Inputs and Selects

- Height: 40px default, 36px dense.
- Border: neutral-300 light, neutral-700 dark.
- Focus: 2px primary ring with accessible contrast.
- Error: error border + concise helper text.
- Search inputs should include icon, clear button, keyboard hint where useful.

### Tables

- Header: neutral-50 light / neutral-900 dark, 12px uppercase or 13px semibold.
- Row height: 44px compact, 52px default.
- Sticky header for long lists.
- Use status badges instead of raw status strings.
- Action column on the right with icon buttons.
- Empty state inside table body with primary action.

### Cards

- Background: surface.
- Border: 1px solid border token.
- Radius: 8px.
- Shadow: none or shadow-xs.
- Avoid nested cards. Use sections, dividers, and grids instead.

### Badges

- Use soft backgrounds:
  - Open: primary-50 / primary-700.
  - Pending: warning-50 / warning-700.
  - Closed: success-50 / success-700.
  - Failed: error-50 / error-700.
  - Offline: neutral-100 / neutral-600.

### Modals

- Widths: 480px small, 640px default, 920px complex.
- Header: title + close button.
- Body: sectioned form with 16px gaps.
- Footer: cancel left/secondary, primary right.
- Avoid scroll traps; large forms should use tabs or sections.

### Dropdowns and Menus

- Use 8px radius, shadow-sm.
- Items 36-40px high.
- Include icons for primary actions.
- Separate destructive actions with divider.

### Tabs

- Use tabs for sibling views, not for unrelated navigation.
- Active tab: primary underline or soft filled state.
- Keep badges for counts.

### Alerts

- Use semantic color, left icon, clear title, concise body.
- Warnings should include next action.
- Billing and connection errors should include recovery action.

### Empty States

Pattern:

- Icon in neutral-400 or primary-500.
- Title: what is empty.
- Body: why it matters.
- Primary action: create/import/connect.
- Secondary action: documentation/help only when needed.

### Loading and Skeletons

- Use skeleton cards in dashboards.
- Use skeleton rows in tables.
- Use spinner only for direct button actions.

## CRM Screen Recommendations

### Tickets

Layout:

- Three-pane workspace on desktop:
  - Ticket list: 320-380px.
  - Conversation: flexible center.
  - Customer context: 320px.
- Mobile:
  - List view first.
  - Conversation opens as full screen.
  - Customer context moves to bottom sheet/tab.

Improvements:

- Ticket list cards should show customer, last message, SLA age, channel, queue, assignee, unread count.
- Add visual priority and SLA indicators.
- Conversation header should show customer, channel, ticket status, queue, assigned agent, and quick actions.
- Message bubbles should be professional:
  - Customer: white/neutral surface.
  - Agent: primary-50 light, primary-900 dark.
  - Internal note: warning-50 with dashed border.
- Composer should separate reply, internal note, templates, attachments, audio, and send options.

### Customer Information

Right panel sections:

- Profile summary.
- Contact channels.
- Tags.
- Timeline.
- Deals/orders/subscription if available.
- Notes.
- Previous tickets.

Use collapsible sections with count badges.

### Contacts and Companies

Use data-table layout:

- Persistent search and filters.
- Saved views: All, Recent, With tickets, Without owner, By tag.
- Bulk actions: tag, export, assign, delete.
- Detail drawer for quick editing.

### Campaigns

Dashboard:

- Status cards: Draft, Scheduled, Running, Completed, Failed.
- Campaign table with delivery, response, opt-out, failed counts.
- Preview message variants.
- Rate limiting/pacing visible before launch.

### Chatbot / Flow Builder

Keep canvas primary.

- Left palette: triggers, messages, conditions, actions.
- Center canvas: nodes.
- Right inspector: selected node settings.
- Top toolbar: save, publish, test, version history.
- Use node colors by type, not random colors.

### Queues

Show queue health:

- Open tickets.
- Waiting tickets.
- Average response.
- Active agents.
- SLA risk.

Queue editing should be modal or side panel with members, hours, routing rules.

### Reports

Use report gallery:

- Overview cards for common reports.
- Filters pinned at top.
- Export actions grouped.
- Print styles should map to the same typography tokens.

### Subscription / Billing

Premium SaaS billing page:

- Current plan card.
- Access status.
- Payment status.
- Plan comparison.
- Payment history.
- Pix/card fallback messaging.

Use calm warning banners for expiring access and error state with recovery action.

### Settings

Use two-column layout:

- Left settings nav.
- Right settings panel.

Group:

- Workspace.
- Channels.
- Automation.
- Team.
- Billing.
- Security.
- Integrations.

## Accessibility

- Maintain 4.5:1 contrast for text.
- Focus ring visible on all controls.
- Do not rely on color alone for status.
- Hit targets at least 36px desktop, 44px mobile.
- Provide accessible names for icon-only buttons.
- Ensure charts include labels/tooltips and data table fallback.
- Use reduced motion for skeleton shimmer and transitions.

## Dark Mode

Dark mode should invert surfaces through tokens, not component overrides.

Rules:

- Background: `#020617`.
- Sidebar/header/card: `#0F172A`.
- Elevated surface: `#111827`.
- Border: `#1E293B`.
- Text primary: `#F8FAFC`.
- Text secondary: `#CBD5E1`.
- Primary actions: primary-500.
- Avoid pure black cards and low-contrast gray text.

## Tailwind and CSS Variables

Use this as the base for Angular + Tailwind. Put CSS variables in `src/styles/tokens.css` and import in `styles.css`.

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #2563eb;
  --color-primary-600: #1d4ed8;
  --color-primary-700: #1e40af;
  --color-primary-800: #1e3a8a;
  --color-primary-900: #172554;

  --color-secondary-50: #ecfeff;
  --color-secondary-100: #cffafe;
  --color-secondary-200: #a5f3fc;
  --color-secondary-300: #67e8f9;
  --color-secondary-400: #22d3ee;
  --color-secondary-500: #06b6d4;
  --color-secondary-600: #0891b2;
  --color-secondary-700: #0e7490;
  --color-secondary-800: #155e75;
  --color-secondary-900: #164e63;

  --color-success-50: #ecfdf5;
  --color-success-100: #d1fae5;
  --color-success-200: #a7f3d0;
  --color-success-300: #6ee7b7;
  --color-success-400: #34d399;
  --color-success-500: #10b981;
  --color-success-600: #059669;
  --color-success-700: #047857;
  --color-success-800: #065f46;
  --color-success-900: #064e3b;

  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-200: #fde68a;
  --color-warning-300: #fcd34d;
  --color-warning-400: #fbbf24;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;

  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-200: #fecaca;
  --color-error-300: #fca5a5;
  --color-error-400: #f87171;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;
  --color-error-800: #991b1b;
  --color-error-900: #7f1d1d;

  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  --app-bg: var(--color-neutral-50);
  --surface: #ffffff;
  --surface-muted: var(--color-neutral-100);
  --border: var(--color-neutral-200);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --text-muted: var(--color-neutral-500);

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, .05);
  --shadow-sm: 0 4px 12px rgba(15, 23, 42, .08);
  --shadow-md: 0 12px 24px rgba(15, 23, 42, .12);
  --shadow-lg: 0 24px 60px rgba(15, 23, 42, .18);
}

.dark {
  --app-bg: #020617;
  --surface: #0f172a;
  --surface-muted: #111827;
  --border: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
}
```

Tailwind config:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"]
      },
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)"
        },
        secondary: {
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)"
        },
        success: {
          50: "var(--color-success-50)",
          500: "var(--color-success-500)",
          600: "var(--color-success-600)",
          700: "var(--color-success-700)"
        },
        warning: {
          50: "var(--color-warning-50)",
          500: "var(--color-warning-500)",
          600: "var(--color-warning-600)",
          700: "var(--color-warning-700)"
        },
        error: {
          50: "var(--color-error-50)",
          500: "var(--color-error-500)",
          600: "var(--color-error-600)",
          700: "var(--color-error-700)"
        },
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)"
        },
        app: "var(--app-bg)",
        surface: "var(--surface)",
        border: "var(--border)"
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      }
    }
  },
  plugins: []
} satisfies Config;
```

## Angular Component Architecture

Recommended structure:

```txt
src/app/
  layout/
    app-shell/
    app-sidebar/
    app-header/
  shared/ui/
    button/
    input/
    select/
    badge/
    card/
    table/
    modal/
    tabs/
    alert/
    empty-state/
    skeleton/
  features/
    dashboard/
    tickets/
    contacts/
    companies/
    campaigns/
    chatbot/
    queues/
    reports/
    billing/
    settings/
```

Component principle:

- Shared UI owns visual consistency.
- Feature modules own domain behavior.
- Layout owns navigation, header, command search, and responsive shell.
- Use CSS variables for theming; do not hardcode colors inside feature components.

## Quasar Mapping for Current Codebase

If applying this redesign to the existing Vue + Quasar frontend:

- Map `$primary` to `#1D4ED8`.
- Map `$secondary` to neutral surface usage, not a blue-gray fill.
- Replace global `border-radius: 15px` with 8px for cards/tables/menus and 6px for buttons/inputs.
- Replace body background `#f5f5f5` with `#F8FAFC`.
- Replace chat outgoing green with primary-50/primary-900 token.
- Replace one-off dark mode overrides with body variables.
- Create utility classes:
  - `.app-page`
  - `.app-page-header`
  - `.app-card`
  - `.app-kpi-card`
  - `.app-table`
  - `.app-badge`
  - `.app-sidebar-item`

## Rollout Plan

Phase 1: Foundation

- Add tokens and typography.
- Update Quasar variables.
- Normalize card/table/button/input radius and borders.
- Fix dark mode with variables.

Phase 2: Shell

- Redesign sidebar grouping and active states.
- Redesign header with search, quick actions, notifications, and profile.
- Add responsive drawer behavior.

Phase 3: Core CRM Screens

- Tickets workspace.
- Dashboard.
- Contacts/companies tables.
- Settings and billing.

Phase 4: Advanced Screens

- Campaign analytics.
- Chatbot builder.
- Reports.
- Delivery and superadmin.

## Acceptance Criteria

- WCAG AA contrast for all text and interactive states.
- All icon-only actions have accessible labels/tooltips.
- Dashboard loads with skeletons and stable layout.
- Dark mode does not require per-component color overrides for common surfaces.
- Tables are usable on mobile.
- Ticket workspace supports list, conversation, and customer context across breakpoints.
- Existing routes and business functionality remain unchanged.
