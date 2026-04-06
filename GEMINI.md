# iRAF — Gemini Agent Guide

> Full framework reference: **AGENTS.md**
> Build commands and workflows: **CLAUDE.md**

---

## Quick Start

1. Read `AGENTS.md` for repo layout, key concepts, and conventions.
2. Use `modules/sample/src/entities/FeatureGallery.ts` as the reference entity template.
3. Use `modules/sample/src/entities/MasterItem.ts` + `DetailItem.ts` for Master-Detail reference.

## Most Important Rules

- Every entity extends `BaseObject` and is decorated with `@iEntity` + `@iField.*`
- Entity keys are kebab-case plural: `"order-lines"`
- Every module uses `defineModule({ key, caption, entities, menu, i18n })`
- Register modules in `app/src/modules/index.ts` via `ModuleRegistry.use(...)`
- Build order: `core` → `react` → `plugin-system` → modules → `app`

## Where to Look

| Need | File |
|---|---|
| Field decorator options | `packages/core/src/types/metadata.ts` |
| Full feature demo | `modules/sample/src/entities/FeatureGallery.ts` |
| Master-Detail demo | `modules/sample/src/entities/MasterItem.ts` |
| Module definition | `modules/sample/src/index.ts` |
| Plugin registration | `plugins/system/src/initPlugins.ts` |
