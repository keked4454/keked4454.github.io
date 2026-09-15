# Sicheng Qiu — MIS3011 WK1 personal website

One-page static personal website for Sicheng Qiu (邱思成), also known online as keked. It uses plain HTML, CSS and JavaScript with no framework, bundler or build step.

## Run and deploy

From the directory above `site/`:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory site
```

Open <http://127.0.0.1:8765/>. The ES modules require HTTP, so opening `index.html` directly as a `file:` URL is not supported.

For deployment, publish only the contents of `site/` on a static HTTP(S) host. Set `site/` as the publish root and leave the build command empty. Preserve the supplied MIME types for `.js`, `.glb`, `.wasm` and `.webm`. No server application, secrets, trackers, cookies or external font service are required.

No public deployment has been performed yet.

## A/B switch

`content.js` owns the requested query-string switch:

```js
export const VARIANT = new URLSearchParams(location.search).get('v') ?? 'a';
```

- `/` and `/?v=a`: the interactive SQ model and four camera/caption controls.
- `/?v=b`: a plain four-link list with no model, media container or camera controls.

The sections outside the Hero are identical in both variants.

## Files

```text
site/
  index.html
  styles.css
  main.js
  content.js
  favicon.svg
  README.md
  assets/
    personal-model.glb
    personal-poster.jpg
    personal-loop.webm
    wechat-avatar.jpg
    photography-01.jpg
    photography-02.jpg
    draco/
      draco_wasm_wrapper.js
      draco_decoder.wasm
  vendor/
    model-viewer.min.js
    model-viewer-LICENSE.txt
```

The deploy directory totals about 2.69 MB. The optimized SQ GLB is 540,512 bytes and uses required `KHR_draco_mesh_compression`. The static poster and WebM loop provide two fallback levels.

## 3D runtime

The site vendors `@google/model-viewer` **4.3.1** and the matching Draco **1.5.6** WebAssembly decoder. The version remains pinned so camera, loading and fallback behavior are reproducible. The runtime and decoder are served from `site/`; variant A makes zero third-party requests. `model-viewer-LICENSE.txt` preserves the package's Apache 2.0 license.

The runtime is loaded only when the reserved Hero media area approaches the viewport. The poster remains visible until the model load event. Idle rotation stops after hover, focus or touch. Reduced-motion mode disables auto-rotation and camera animation. If WebGL, the GLB or the decoder fails, the page uses the WebM loop; if that fails, the poster remains.

## Current content

- Header: the supplied WeChat avatar and `keked · 邱思成`.
- Hero: name, course field and the interactive SQ monogram. The earlier Chinese personal-description line was removed at the owner's request.
- About: study, Java/C++, coding-agent practice, esports results, community roles and education.
- Work: one de-identified internship entry. It emphasizes frequent agent use without naming the employer or publishing internal data.
- Photography: two supplied photographs, both captioned `Nafplio, Greece · June 2026`.
- Now: the site build, Java/C++, APEX league planning and the owner's list of regularly used models.
- Contact: the owner-confirmed CUHK-Shenzhen email address.

There are no TODO placeholders in the current version.

## Verification — 2026-09-15

Tests used Chromium 140.0.7339.186 through Playwright 1.55.1 and Lighthouse 13.0.1 on localhost with a cold cache. The Lighthouse numbers are local mobile-emulation measurements and can vary on a public host.

| Metric | Variant A | Variant B |
|---|---:|---:|
| Transferred bytes | 2,697,185 | 723,329 |
| Lighthouse performance | 67 / 100 | 100 / 100 |
| Lighthouse accessibility | 100 / 100 | 100 / 100 |
| First contentful paint | 0.977 s | 0.976 s |
| Largest contentful paint | 1.202 s | 1.202 s |
| Cumulative layout shift | 0 | 0 |

The following checks passed:

- 320, 768 and 1440 px viewports have no horizontal overflow.
- The SQ model loads, the poster is removed after load and no external resource is requested.
- All four camera controls update their selected state and caption, and stop auto-rotation after interaction.
- JavaScript-disabled HTML contains all current copy and valid internal anchors; Contact navigation works.
- Blocking the GLB produces a playable video and leaves all four controls usable.
- Blocking both the GLB and WebM leaves the poster visible.
- Reduced-motion mode has no auto-rotation.
- `?v=b` contains four fallback anchors, no enhanced media elements, and identical non-Hero sections.
- JavaScript syntax checks pass and the automated browser run reports no page errors.

Machine-readable results and full Lighthouse reports are stored in `../docs/site-verification/`.

## Deviations from the original brief

These changes follow later owner instructions and supersede the original content brief:

- The original PGB pig and its fixed asset specification were replaced by the owner-supplied SQ model. The replacement was optimized for web delivery and given a new poster and loop.
- The owner explicitly selected the supplied WeChat anime image as the avatar, overriding the brief's exclusion.
- The Hero positioning sentence was removed.
- About uses two paragraphs and omits the requested transition anecdote.
- Work contains only the internship entry and only the Problem and What I did fields. The two esports cards, artifact field and reflection field were removed.
- Photography replaces the five-row Skills evidence table.
- Contact contains the confirmed email and no additional link.
- Owner-canceled unknowns are removed instead of rendered as TODO chips.
- The brief requested a CDN-hosted `model-viewer`; the same pinned version is now self-hosted to remove runtime dependence on CDN availability.

An actual public-Wi-Fi performance guarantee cannot be established from localhost. The measured mobile-emulation results above are the reproducible substitute; the public host should be tested again after deployment.
