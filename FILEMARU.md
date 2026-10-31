# 한글 — Filemaru integration

Upstream: https://github.com/edwardkim/rhwp
Upstream license: MIT. Keep upstream notices and branding intact.
Verified engine version: 0.8.7 (not the current default-branch tip).

## Package contract
Paste `https://github.com/lscya84/rhwp` into Filemaru App Store → GitHub.
The root `filemaru-app.json` associates hwp, hwpx with `filemaru:hangul`.
Installation is per account. The host runs its reviewed adapter inside a retained window with a top toolbar, not a generic left/right settings layout.
The fork manifest is mirrored in Filemaru's `app-packages/hangul` catalog, checked during every build. Private filesystem paths, credentials and user documents must never be included in this repository.

## Runtime and file access
The package activates the verified Filemaru adapter; it does not execute arbitrary GitHub files. Source/default-branch commits are not runtime version declarations.
All reads and saves use Filemaru permission-checked file APIs. The HDD read-only gate remains enforced. Office exports save as a new file where allowed; original files are not overwritten.
The adapter implementation and integration tests are maintained in the Filemaru host repository. This fork provides the upstream source and installation contract, not a second unverified copy of that host code.

## Updating
1. Fetch upstream; review and merge upstream changes without resetting this fork or dropping the root manifest and this document.
2. Select the new engine release. Update Filemaru's dependency lock (npm/Cargo or pinned Office service image), this manifest and the host catalog together.
3. Run host package-contract checks, build, permission tests, PC/mobile open/render and applicable edit/export tests.
4. Publish only after validation. Deploy the verified adapter/service before advertising the new package version. On failure retain the previous engine and manifest.

The App Store checks upstream releases; weekly host dependency update PRs remain enabled. No unreviewed upstream commit is automatically deployed.

## 파일마루 전용 Studio (2026-10-31)

`rhwp-studio/src`, `npm/editor`, shared UI and font assets are synchronized from
upstream v0.8.7 (`1a76570e833917d15817415a53c09ad61ab3203f`). The Rust source in
this fork is retained history, not the runtime build input: the Studio build pins
`@rhwp/core@0.8.7`. Build with `cd rhwp-studio && npm ci && npm run build:filemaru`.

This is a Filemaru-specific fork, not an externally hosted generic editor:
`src/filemaru.ts` overrides file-open/save commands, validates the exact parent
and origin, tracks revisions and handles host save completion. Full upstream web
menus remain. HWP/HWPX/HML opening, supported conversion/export, formatting,
tables, objects, pages, tools, undo/redo and printing use the upstream engine.
Windows HwpCtrl OCX, browser extension integration and unsupported upstream
conversions are not claimed as web features.

Recent files, autosave and document history use an account-specific IndexedDB
namespace supplied by the authenticated host. Browser-local recovery is not a
server backup. External web fonts and PWA service workers are excluded from this
build. Built fonts and MIT/third-party notices travel with the artifact.

The host stores the checked build archive and exact source commit in
`vendor/hangul-engine.json`; `prepare-hangul.mjs` verifies SHA-256 before embedding
it into the Rust release. This allows existing single-binary deployment and
rollback without a second application service. Source build and runtime are both
pinned, and the host's rights/no-overwrite storage rules still apply.
