---
name: rtk-not-in-path
description: rtk CLI tool is installed but not always available in PATH during AI tool execution
type: feedback
---

# rtk commit — PATH Issue

## What Happened
CLAUDE.md menyebut `rtk commit` sebagai tool wajib untuk commit. Saat dijalankan via `run_command`, tool ini muncul "program not found" meski tersedia di terminal Ichsan.

## Confirmed Fallback
Gunakan `git commit` biasa jika `rtk commit` gagal — hasilnya identik untuk keperluan commit.

## Do NOT
- Jangan skip commit karena rtk tidak ditemukan
- Jangan tanya Ichsan apakah perlu commit — langsung lakukan

## Status
Ichsan sadar akan ini dan tidak komplain. Ini bukan blocker.
