# Phase 0 — 專案鷹架 (Scaffolding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 iRAF 的 npm workspace monorepo 基礎結構，包含三個套件（`@iraf/core`、`@iraf/react`、`demo`），以及完整的 TypeScript、ESLint、Prettier、Vitest 工具鏈，讓後續每個 Phase 都能在此基礎上開發。

**Architecture:** npm workspaces monorepo，`packages/core` 為框架核心、`packages/react` 為 React UI 層、`apps/demo` 為驗證用 Demo 應用。套件之間透過 workspace 依賴引用（`"@iraf/core": "workspace:*"`），確保本地開發時直接使用 source。

**Tech Stack:** Node.js 24 / npm 11 (workspaces) · TypeScript 5 · Vite 6 · tsup · Vitest · ESLint (flat config) · Prettier · shadcn/ui · Tailwind CSS · Remult · React 19 · React Router 7

---

## 檔案結構總覽

建立後的完整結構：

```
iRAF/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   └── index.ts          # 套件進入點（目前僅 export 版本）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── react/
│       ├── src/
│       │   └── index.ts          # 套件進入點（目前僅 export 版本）
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
├── apps/
│   └── demo/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   └── vite-env.d.ts
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       └── postcss.config.js
├── package.json                  # Root workspace + 共用 devDependencies
├── tsconfig.base.json            # 共用 TypeScript 設定
├── eslint.config.js              # ESLint flat config
├── .prettierrc                   # Prettier 設定
├── .gitignore
├── PLAN.md
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-03-30-phase-0-scaffolding.md
```

---

## Task 1：Root Workspace 初始化

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: 建立 root package.json**

在 `c:/Users/Anthony.MAXECHO/Desktop/iRAF/` 建立：

```json
{
  "name": "iraf-monorepo",
  "private": true,
  "version": "0.0.0",
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "dev:demo": "npm run dev --workspace=apps/demo"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: 建立 .gitignore**

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Vite
.vite/

# Local env
.env
.env.local

# DB files (Remult JSON DataProvider)
db/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
```

- [ ] **Step 3: 安裝 root devDependencies**

在 `c:/Users/Anthony.MAXECHO/Desktop/iRAF/` 執行：

```bash
npm install
```

預期輸出：包含 `added N packages` 的成功訊息，無 error。

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
git init
git add package.json .gitignore
git commit -m "chore: initialize iRAF monorepo workspace"
```

---

## Task 2：共用 TypeScript 設定

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: 建立 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "exactOptionalPropertyTypes": false,
    "noUncheckedIndexedAccess": false,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

> **注意：** `experimentalDecorators: true` 和 `emitDecoratorMetadata: true` 是 Remult decorator 正確運作的必要條件。`useDefineForClassFields: false` 確保 class field 不與 Remult 的屬性初始化機制衝突。

- [ ] **Step 2: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add shared TypeScript base config"
```

---

## Task 3：ESLint + Prettier 設定

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc`

- [ ] **Step 1: 建立 eslint.config.js**

```js
// eslint.config.js
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.vite/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
```

- [ ] **Step 2: 建立 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3: 驗證 ESLint 設定載入正確**

```bash
npx eslint --version
```

預期輸出：`v9.x.x`（無 error）

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js .prettierrc
git commit -m "chore: add ESLint flat config and Prettier"
```

---

## Task 4：packages/core 骨架

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: 建立目錄結構**

```bash
mkdir -p "c:/Users/Anthony.MAXECHO/Desktop/iRAF/packages/core/src"
```

- [ ] **Step 2: 建立 packages/core/package.json**

```json
{
  "name": "@iraf/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "remult": "^0.27.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 3: 建立 packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: 建立 packages/core/tsup.config.ts**

```ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  experimentalDts: false,
  esbuildOptions(options) {
    options.keepNames = true
  },
})
```

- [ ] **Step 5: 建立 packages/core/src/index.ts**

```ts
// @iraf/core — 框架核心
// Phase 0: 僅匯出版本，實際功能從 Phase 1 開始

export const IRAF_VERSION = "0.0.1"
```

- [ ] **Step 6: 安裝 core 的依賴**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm install --workspace=packages/core
```

預期：無 error，Remult 被安裝至 `packages/core/node_modules`。

- [ ] **Step 7: 建置 core 套件**

```bash
npm run build --workspace=packages/core
```

預期輸出：
```
CLI Building entry: src/index.ts
CLI tsup v8.x.x
CLI Build success in Xms
```

確認 `packages/core/dist/index.js` 和 `packages/core/dist/index.d.ts` 已生成。

- [ ] **Step 8: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add @iraf/core package skeleton"
```

---

## Task 5：packages/react 骨架

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/tsup.config.ts`
- Create: `packages/react/src/index.ts`

- [ ] **Step 1: 建立目錄結構**

```bash
mkdir -p "c:/Users/Anthony.MAXECHO/Desktop/iRAF/packages/react/src"
```

- [ ] **Step 2: 建立 packages/react/package.json**

```json
{
  "name": "@iraf/react",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@iraf/core": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 3: 建立 packages/react/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: 建立 packages/react/tsup.config.ts**

```ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.keepNames = true
  },
})
```

- [ ] **Step 5: 建立 packages/react/src/index.ts**

```ts
// @iraf/react — React UI 層
// Phase 0: 僅匯出版本，實際元件從 Phase 2 開始

export const IRAF_REACT_VERSION = "0.0.1"
```

- [ ] **Step 6: 安裝依賴並建置**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm install --workspace=packages/react
npm run build --workspace=packages/react
```

預期：`packages/react/dist/` 目錄生成，無 error。

- [ ] **Step 7: Commit**

```bash
git add packages/react/
git commit -m "feat(react): add @iraf/react package skeleton"
```

---

## Task 6：apps/demo Vite 應用

**Files:**
- Create: `apps/demo/package.json`
- Create: `apps/demo/tsconfig.json`
- Create: `apps/demo/tsconfig.node.json`
- Create: `apps/demo/vite.config.ts`
- Create: `apps/demo/postcss.config.js`
- Create: `apps/demo/index.html`
- Create: `apps/demo/src/vite-env.d.ts`
- Create: `apps/demo/src/main.tsx`
- Create: `apps/demo/src/App.tsx`
- Create: `apps/demo/src/index.css`

- [ ] **Step 1: 建立目錄結構**

```bash
mkdir -p "c:/Users/Anthony.MAXECHO/Desktop/iRAF/apps/demo/src"
```

- [ ] **Step 2: 建立 apps/demo/package.json**

```json
{
  "name": "iraf-demo",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@iraf/core": "*",
    "@iraf/react": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "remult": "^0.27.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 3: 建立 apps/demo/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 建立 apps/demo/tsconfig.node.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["vite.config.ts", "postcss.config.js"]
}
```

- [ ] **Step 5: 建立 apps/demo/vite.config.ts**

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
})
```

- [ ] **Step 6: 建立 apps/demo/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: 建立 apps/demo/index.html**

```html
<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>iRAF Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: 建立 apps/demo/src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: 建立 apps/demo/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: 建立 apps/demo/src/App.tsx**

```tsx
import { IRAF_VERSION } from "@iraf/core"
import { IRAF_REACT_VERSION } from "@iraf/react"

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">iRAF</h1>
        <p className="text-slate-500">i Rapid Application Framework</p>
        <div className="text-sm text-slate-400 space-y-1 pt-4">
          <p>@iraf/core v{IRAF_VERSION}</p>
          <p>@iraf/react v{IRAF_REACT_VERSION}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 11: 建立 apps/demo/src/main.tsx**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 12: 安裝 demo 依賴**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm install --workspace=apps/demo
```

預期：無 error。workspace 依賴 `@iraf/core` 和 `@iraf/react` 會自動 symlink 到 `packages/`。

- [ ] **Step 13: 驗證 demo 可啟動**

```bash
npm run dev:demo
```

預期：瀏覽器開啟 `http://localhost:5173`，顯示黑色文字 "iRAF" 標題和版本號。

按 `Ctrl+C` 停止。

- [ ] **Step 14: Commit**

```bash
git add apps/demo/
git commit -m "feat(demo): add Vite + React + Tailwind demo application"
```

---

## Task 7：Vitest 測試框架設定

**Files:**
- Create: `vitest.config.ts`
- Create: `packages/core/src/__tests__/index.test.ts`
- Create: `packages/react/src/__tests__/index.test.ts`

- [ ] **Step 1: 建立 root vitest.config.ts**

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/src/**/*.test.ts", "packages/**/src/**/*.test.tsx"],
  },
})
```

- [ ] **Step 2: 建立 packages/core/src/__tests__/index.test.ts**

```ts
import { describe, it, expect } from "vitest"
import { IRAF_VERSION } from "../index"

describe("@iraf/core", () => {
  it("exports a version string", () => {
    expect(IRAF_VERSION).toBe("0.0.1")
  })
})
```

- [ ] **Step 3: 執行測試（確認失敗，因為套件尚未 build）**

先確認測試能找到，但需要先 build：

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm run build --workspace=packages/core
```

- [ ] **Step 4: 建立 packages/react/src/__tests__/index.test.ts**

```ts
import { describe, it, expect } from "vitest"
import { IRAF_REACT_VERSION } from "../index"

describe("@iraf/react", () => {
  it("exports a version string", () => {
    expect(IRAF_REACT_VERSION).toBe("0.0.1")
  })
})
```

- [ ] **Step 5: 執行所有測試**

```bash
npm test
```

預期輸出：
```
 PASS  packages/core/src/__tests__/index.test.ts
 PASS  packages/react/src/__tests__/index.test.ts

Test Files  2 passed (2)
Tests       2 passed (2)
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts packages/core/src/__tests__/ packages/react/src/__tests__/
git commit -m "chore: setup Vitest with smoke tests for both packages"
```

---

## Task 8：AGENTS.md — AI Agent 開發指引

**Files:**
- Create: `AGENTS.md`

> 這個檔案讓所有 AI Agent（Claude、Gemini、Codex 等）在對話開始時載入，確保對框架慣例有一致的理解。

- [ ] **Step 1: 建立 AGENTS.md**

```markdown
# iRAF — AI Agent 開發指引

本文件是 AI Agent 開發 iRAF 時的核心參考。每次對話開始時應先讀取此檔案。

## 專案結構

- `packages/core/` — `@iraf/core`：框架核心（decorator、EntityRegistry、BaseObject）
- `packages/react/` — `@iraf/react`：React UI 層（App Shell、ListView、DetailView）
- `apps/demo/` — Demo 應用（驗證框架功能）
- `PLAN.md` — 整體架構規劃
- `docs/superpowers/plans/` — 各 Phase 的詳細實作計畫

## 命名慣例

| 類型 | 命名規則 | 範例 |
|------|---------|------|
| BO 類別 | PascalCase | `Customer`, `Order` |
| BO 檔案 | PascalCase.ts | `Customer.ts` |
| Decorator | camelCase (i 前綴) | `@iEntity`, `@iField` |
| React 元件 | PascalCase | `ListView`, `DetailView` |
| 工具函式 | camelCase | `getEntityMetadata()` |

## BO 定義範本

每個 Business Object 應遵循此結構：

```ts
// packages/core/src/entities/Customer.ts
import { iEntity, iField } from "@iraf/core"
import { BaseObject } from "@iraf/core"

@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""
}
```

## 技術限制

- TypeScript `experimentalDecorators: true` + `useDefineForClassFields: false` 是 Remult 的必要設定，不可更改
- 所有 BO 必須繼承 `BaseObject`
- 所有跨表操作必須在 `remult.dataProvider.transaction()` 內執行

## 當前 Phase

查看 `PLAN.md` 的「開發階段規劃」確認目前進度。
每個 Phase 的詳細步驟在 `docs/superpowers/plans/` 目錄下。
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md for AI Agent development guidelines"
```

---

## Task 9：完整驗證 (End-to-End Check)

- [ ] **Step 1: 全套件建置**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm run build
```

預期輸出：`packages/core` 和 `packages/react` 都建置成功，無 error 或 warning。

- [ ] **Step 2: 執行所有測試**

```bash
npm test
```

預期：
```
Test Files  2 passed (2)
Tests       2 passed (2)
```

- [ ] **Step 3: 啟動 Demo 驗證**

```bash
npm run dev:demo
```

在瀏覽器開啟 `http://localhost:5173`，確認顯示：
- "iRAF" 標題
- "@iraf/core v0.0.1"
- "@iraf/react v0.0.1"

按 `Ctrl+C` 停止。

- [ ] **Step 4: 最終 Commit（Phase 0 完成）**

```bash
git add .
git commit -m "chore: Phase 0 complete — monorepo scaffolding with TypeScript, Vitest, ESLint, Prettier"
```

---

## Phase 0 完成標準

- [ ] `npm run build` 無 error
- [ ] `npm test` 全部通過
- [ ] `npm run dev:demo` 可在瀏覽器看到 iRAF 版本頁面
- [ ] `npm run lint` 無 error
- [ ] Git log 有清楚的 commit 歷史

完成後進入 **Phase 1 — 核心底座**（`@iEntity`、`@iField`、`BaseObject`、`EntityRegistry` 實作）。
