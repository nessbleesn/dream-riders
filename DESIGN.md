# Dream Riders design system

The shared layer lives in `design-system.css`; page-specific composition remains in `styles.css`.

## Tokens

- Color primitives: `--white`, `--ice`, `--sky`, `--blue`, `--blue-strong`, `--ink`, `--navy`, `--muted`, `--line`.
- Semantic colors: `--color-page`, `--color-surface`, `--color-surface-tint`, `--color-text`, `--color-text-strong`, `--color-text-muted`, `--color-accent`, `--color-accent-strong`, `--color-divider`.
- Typography: `--display` for Bebas Neue Pro headings and numbers; `--body` for interface and body copy.
- Layout: `--page-max`, `--gutter`, `--section-space`, `--radius`, `--control-min-h`.
- Header contract: `--topbar-h`, `--ticketbar-h`, `--header-stack-h`. JavaScript synchronizes the first two with their rendered heights.
- Motion and depth: `--ease-out`, `--ease-in-out`, `--shadow-float`, and named z-index layers.

## Reusable components

### Page shell

Use `.section-shell` for the shared page width and responsive horizontal gutter.

### Buttons

Base class: `.button`.

- `.button-primary` — primary purchase action.
- `.button-outline` — quiet secondary action.
- `.button-small` — compact controls with a minimum 44 px touch target.
- `aria-disabled="true"` — unavailable action state.

Buttons use a restrained solid/outline system. Primary purchase actions are solid brand blue; secondary actions use a quiet white surface and a thin neutral border. Avoid glass blur, glossy highlights, multicolor gradients and strong glows.

### Focus

Interactive project controls share the same visible `:focus-visible` ring. New custom controls must be added to the shared focus selector in `design-system.css`.

### Sticky purchase header

`.topbar` owns navigation. `.ticketbar` owns the purchase flow and consumes date, price, status and URL values from `event-config.js`. Do not hard-code additional event dates in HTML or CSS.

## Extraction boundary

Only patterns already reused across the page were extracted. Hero, sales meter, ride slider, ticket artwork and footer remain page components because their layout and intent are unique.
