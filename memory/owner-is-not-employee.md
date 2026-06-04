---
name: owner-is-not-employee
description: Owner deliberately excluded from salary contracts — business revenue model, not a bug
type: project
---

# Owner Salary Exclusion — Business Decision

## The Rule
Owner tidak boleh menerima kontrak gaji dari sistem. Mereka menerima bagian dari revenue bisnis tim, bukan salary rutin.

## Why It Matters for AI
Kalau ada form/dropdown untuk pilih player yang digaji, **filter owner keluar**:
```ts
const eligibleMembers = members.filter(m => m.role !== 'owner');
```

## How Ichsan Caught This
Dia bilang: "kenapa dia ngegaji ownernya sendiri? coba tebak logika nya? harusnya gaada dong"
— artinya dia expect AI bisa menebak business logic ini sendiri, bukan menunggu diberitahu.

## Lesson
Untuk fitur yang melibatkan uang/kontrak: selalu tanya "apakah semua role ini seharusnya bisa di-include?" sebelum implement. Owner biasanya punya akses management tapi bukan sebagai subject dari transaksi.
