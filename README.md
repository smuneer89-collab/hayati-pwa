# Hayati PWA V9 — Standalone Quran Reader

Root fix for the Quran reader: `quran.html` is a standalone, self-contained reader.

- No Quran API calls at runtime.
- No `fetch()` for Quran text.
- All 6236 Tanzil Uthmani ayat are pre-rendered into the HTML at build time.
- The old integrated Quran runtime is bypassed; Quran buttons navigate directly to `quran.html`.
- Reading progress is stored locally in `localStorage` under `hayati_quran_progress_v9`.
- Optional Amiri Quran web font is used when available; the Quran remains readable with system Arabic fonts if it cannot load.

Important: this V9 prioritizes a reliable full-screen digital Mushaf and stable page view. Exact printed-Madina line breaks are a separate typography/layout refinement; no runtime source is required for the reader to open.

Quran text source: Tanzil Project, Uthmani text (must be kept verbatim and attributed per Tanzil terms).
