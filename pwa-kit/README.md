# PWA kit — CTV Homes ad builder

Everything needed to make the agent-facing builder installable to a phone's home
screen, so it launches full-screen with no browser chrome. That single change is
most of what makes a web flow feel like an app.

**This kit is for the app repo** (the Next.js app behind realestate.ctvhomes.com),
not for this marketing site. Nothing here is wired into anything — it is a set of
files to copy across.

Everything below is **additive**. Browsers that do not support a tag ignore it.
No layout changes, no behaviour changes for existing visitors, and deleting the
tags fully reverses it.

---

## 1. Icons

Open `make-icons.html` in any browser and click **Download all three**. It draws
the icon on a canvas and saves the PNGs locally — nothing is uploaded.

You get:

| File | Used by |
|---|---|
| `apple-touch-icon.png` (180×180) | iOS home screen |
| `icon-192.png` | Android home screen |
| `icon-512.png` | Splash screen, app listings, maskable icon |

Drop all three into the app's `public/` folder. `icon.svg` is the editable
source if you want to change the artwork first.

## 2. Manifest

Copy `manifest.json` into `public/`.

Check `start_url` before shipping — it is set to `/agents`, so launching from the
home screen opens the builder rather than the marketing homepage. Change it if
agents should land somewhere else.

## 3. Head tags

Add to the app's root layout (`app/layout.tsx` `<head>`, or `_document.tsx`):

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0a0a0f">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="CTV Homes">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Two of these matter more than they look:

- **`viewport-fit=cover`** is what makes `env(safe-area-inset-*)` return real
  values. Without it the safe-area CSS in step 4 silently does nothing.
- **`apple-mobile-web-app-status-bar-style`** controls the iOS status bar once
  installed. `black-translucent` suits a dark app; use `default` on a light one.

In Next.js App Router you can instead export a `metadata` object — either works,
but do not do both or you will get duplicate tags.

## 4. Mobile CSS

Import `mobile-fixes.css` after your existing styles. It covers:

- **The iOS zoom bug** — Safari zooms the page whenever a focused input has a
  font-size under 16px. Loudest "this is a website" tell there is.
- **Safe-area insets** — so a bottom bar clears the home indicator.
- **A sticky bottom action bar** — add `.app-bottom-bar` to a wrapper around the
  primary button, and `.has-bottom-bar` to the scrolling container so its last
  element is not hidden behind it.
- **44px minimum touch targets.**

## 5. Test it

1. Open the app on an iPhone in Safari
2. Share → **Add to Home Screen**
3. Launch from the icon

You should get: your icon, no address bar, a dark status bar, and a bottom bar
that clears the home indicator. If the address bar is still there, the manifest
is not being served — check `/manifest.json` loads directly.

---

## Optional: service worker

**Deliberately not included.** A service worker is the only part of a PWA that is
hard to un-ship: it intercepts network requests, and a misconfigured one serves
stale pages to anyone who already installed the app, on their device, where you
cannot reach it.

Everything above gives you the home-screen icon, the full-screen launch and the
theme colour with none of that risk. Add offline support later, if agents ask for
it — and stage it behind a version check when you do.
