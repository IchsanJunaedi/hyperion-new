---
name: feedback-webpack-hmr-fix
description: Next.js 15 Webpack HMR crash fix — must use named export pattern, never inline export function
type: feedback
---

# Webpack HMR Crash — Confirmed Fix (2026-05-26)

## Symptom
```
TypeError: __webpack_modules__[moduleId] is not a function
```
Occurs in Next.js 15.5 dev mode after hot-reloading a file that uses inline exports.

## Root Cause
Webpack HMR loses the module reference when components are exported inline.

## ✅ Correct Pattern (always use this)
```tsx
const MyComponent = ({ ... }: Props) => {
  // ...
};

export { MyComponent };
```

## ❌ Wrong Patterns (cause HMR crash)
```tsx
export default function MyComponent() { ... }
export function MyComponent() { ... }
export const MyComponent = () => { ... }; // inline in export statement
```

## Applies To
All React component files. Apply this pattern whenever creating or editing component files.

## History
Fixed in `SalaryFormModal.tsx` and all new components created after 2026-05-26.
