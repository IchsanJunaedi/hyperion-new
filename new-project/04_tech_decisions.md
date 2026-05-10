# EsportsOS — Tech Decisions

## A. Auth Strategy

### Supabase Auth + Custom Claims via JWT

Supabase Auth menangani session, refresh token, dan OAuth (Google). Custom claims disimpan di JWT payload melalui **custom access token hook** (Supabase Hook → PostgreSQL function).

**JWT Payload yang Direkomendasikan:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "organizations": [
      {
        "org_id": "org-uuid-1",
        "slug": "hyperion-six",
        "role": "captain",
        "divisions": ["div-uuid-mlbb"]
      },
      {
        "org_id": "org-uuid-2",
        "slug": "onic-esport",
        "role": "member",
        "divisions": ["div-uuid-valorant"]
      }
    ]
  }
}
```

**Custom Access Token Hook (PostgreSQL):**
```sql
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  orgs JSONB;
BEGIN
  user_id := (event->>'user_id')::UUID;

  SELECT jsonb_agg(jsonb_build_object(
    'org_id', tm.organization_id,
    'slug', o.slug,
    'role', tm.role,
    'divisions', COALESCE((
      SELECT jsonb_agg(division_id)
      FROM team_members
      WHERE user_id = tm.user_id
        AND organization_id = tm.organization_id
        AND division_id IS NOT NULL
    ), '[]'::jsonb)
  ))
  INTO orgs
  FROM team_members tm
  JOIN organizations o ON o.id = tm.organization_id
  WHERE tm.user_id = user_id AND tm.is_active = true;

  RETURN jsonb_set(
    event,
    '{claims,app_metadata,organizations}',
    COALESCE(orgs, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**User di Banyak Organisasi:**
- JWT payload menyimpan array `organizations` → tidak ada N+1 query saat middleware check.
- `useWorkspaceStore` di Zustand menyimpan `activeOrgId` dan `activeDivisionId` yang aktif saat ini.
- Saat user switch organisasi → update Zustand store → TanStack Query invalidate semua query yang bergantung pada `activeOrgId`.

---

## B. Multi-tenancy & Custom Domain

### Organization-Based Multi-tenancy
Setiap data di-isolasi menggunakan `organization_id` sebagai partisi logis, diperkuat RLS di Supabase. Tidak ada shared state antar organisasi.

### Setup Vercel
```
# vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```
Di Vercel Dashboard:
1. Tambah wildcard domain: `*.hyperionteam.id` → pointing ke deployment.
2. Untuk custom domain tier Pro: tambahkan domain `onicteam.id` manually → Vercel otomatis generate SSL.

### `middleware.ts` (Lengkap)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const MAIN_DOMAIN = 'hyperionteam.id'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── 1. Skip static assets & API routes ──────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response
  }

  // ── 2. Resolve hostname → organization ──────────────────────────
  let orgSlug: string | null = null
  const isMainDomain =
    hostname === MAIN_DOMAIN ||
    hostname === `www.${MAIN_DOMAIN}` ||
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app')

  if (!isMainDomain) {
    // Custom domain (tier Pro): query Supabase untuk resolve domain → org
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // admin key
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('slug')
      .eq('custom_domain', hostname)
      .single()

    if (!org) {
      return NextResponse.redirect(new URL('/', `https://${MAIN_DOMAIN}`))
    }
    orgSlug = org.slug
  }

  // ── 3. Resolve path slug → team/division ────────────────────────
  // Format: /[team-slug] atau /[team-slug]/[section]
  const pathSegments = pathname.split('/').filter(Boolean)
  const pathSlug = pathSegments[0] // e.g. 'hyperion-six'
  const section = pathSegments[1]  // e.g. 'scrim', 'roster', dll

  // Jika custom domain → slug sudah diketahui dari hostname
  // Jika main domain → slug dari path
  const resolvedSlug = orgSlug ?? pathSlug

  // Route khusus yang tidak butuh team-slug
  const publicRoutes = ['login', 'register', 'callback']
  if (!resolvedSlug || publicRoutes.includes(resolvedSlug)) {
    return response
  }

  // ── 4. Cek auth session ─────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── 5. Redirect logic ───────────────────────────────────────────
  // Tentukan apakah user adalah member org ini
  const isMember = user?.app_metadata?.organizations?.some(
    (org: { slug: string }) => org.slug === resolvedSlug
  ) ?? false

  // Jika tidak login → public profile (read-only)
  if (!user) {
    // Jika sudah di route public, lanjut
    if (pathname.startsWith('/(public)') || !section) {
      return response
    }
    // Jika coba akses protected section → redirect ke public profile
    const publicUrl = new URL(`/${resolvedSlug}`, request.url)
    return NextResponse.redirect(publicUrl)
  }

  // Jika login tapi bukan member → public profile
  if (!isMember) {
    const publicUrl = new URL(`/${resolvedSlug}`, request.url)
    return NextResponse.redirect(publicUrl)
  }

  // Jika login dan member → rewrite ke (app) route group
  // Inject org context ke header untuk Server Components
  response.headers.set('x-org-slug', resolvedSlug)
  response.headers.set('x-user-id', user.id)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## C. File Storage Strategy

### Bucket Structure

| Bucket | Visibilitas | Isi |
|---|---|---|
| `org-logos` | Public | Logo & banner organisasi |
| `org-private` | Private | File scrim, VOD, strategi |
| `avatars` | Public | Avatar profil user |

### Path Naming Convention

```
# Logo organisasi
org-logos/{org-id}/logo.webp
org-logos/{org-id}/banner.webp

# File scrim (private)
org-private/{org-id}/scrims/{scrim-id}/{filename}

# Strategy notes attachment
org-private/{org-id}/strategy/{note-id}/{filename}

# Avatar
avatars/{user-id}/avatar.webp
```

### Batasan per Tier

| | Pelajar | Komunitas | Pro |
|---|---|---|---|
| **Max ukuran file** | 5 MB | 25 MB | 100 MB |
| **Total storage** | 500 MB | 5 GB | 50 GB |
| **Tipe yang diizinkan** | image/*, pdf | + video/* | + semua |
| **Retensi file** | 6 bulan | 12 bulan | Unlimited |

---

## D. WhatsApp Notification Strategy

### Setup Fonnte

```typescript
// lib/fonnte/client.ts
const FONNTE_API = 'https://api.fonnte.com'
const FONNTE_TOKEN = process.env.FONNTE_API_TOKEN!

export async function sendWhatsApp(params: {
  target: string   // nomor WA: '081234567890'
  message: string
  delay?: number   // delay antar pesan (ms), default 3000
}) {
  const response = await fetch(`${FONNTE_API}/send`, {
    method: 'POST',
    headers: {
      'Authorization': FONNTE_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: params.target,
      message: params.message,
      delay: params.delay ?? 3000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Fonnte error: ${response.status}`)
  }
  return response.json()
}
```

### Template Pesan WA

```typescript
// lib/fonnte/templates.ts
export const waTemplates = {
  scrimInvite: (data: {
    memberName: string
    teamName: string
    opponent: string
    date: string
    time: string
    format: string
    confirmUrl: string
  }) => `
Halo ${data.memberName}! 👋

*${data.teamName}* ada scrim nih:
🆚 Lawan: *${data.opponent}*
📅 ${data.date}, jam ${data.time}
🎮 Format: ${data.format}

Konfirmasi kehadiran lo di sini:
${data.confirmUrl}

Reply langsung ke link ya, bukan ke sini 🙏
`.trim(),

  scrimReminder: (data: {
    memberName: string
    opponent: string
    minutesLeft: number
  }) => `
⏰ Reminder! Scrim vs *${data.opponent}* ${data.minutesLeft} menit lagi, ${data.memberName}!

Udah ready? 💪
`.trim(),
}
```

### Queue System (Supabase Edge Function)

```typescript
// supabase/functions/process-wa-queue/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Ambil maksimal 10 notif pending (rate limiting)
  const { data: pending } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'pending')
    .not('wa_number', 'is', null)
    .limit(10)

  for (const notif of pending ?? []) {
    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': Deno.env.get('FONNTE_TOKEN')! },
        body: JSON.stringify({
          target: notif.wa_number,
          message: notif.wa_message,
          delay: 3000, // 3 detik delay antar pesan = ~20 pesan/menit
        }),
      })

      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notif.id)

    } catch {
      // Fallback: tandai sebagai failed, retry otomatis 3x
      await supabase
        .from('notifications')
        .update({ status: 'failed' })
        .eq('id', notif.id)
    }
  }

  return new Response('OK')
})
```

**Trigger Edge Function setiap menit** via Supabase Cron (pg_cron):
```sql
SELECT cron.schedule(
  'process-wa-queue',
  '* * * * *', -- setiap menit
  $$SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/process-wa-queue',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  )$$
);
```

---

## E. State Management Pattern

### Boundary: Zustand vs TanStack Query

| Tipe State | Tool | Contoh |
|---|---|---|
| **Server state** (async, cache) | TanStack Query v5 | List scrim, roster, notifikasi |
| **Global UI state** (sync) | Zustand | Sidebar open, active org/division |
| **Form state** | React Hook Form | Form scrim baru, form profil |
| **Local component state** | useState | Dropdown toggle, tab active |

### Zustand Store

```typescript
// stores/useWorkspaceStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  activeOrgId: string | null
  activeOrgSlug: string | null
  activeDivisionId: string | null
  memberRole: string | null
  setActiveOrg: (orgId: string, slug: string, role: string) => void
  setActiveDivision: (divisionId: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      activeOrgSlug: null,
      activeDivisionId: null,
      memberRole: null,
      setActiveOrg: (orgId, slug, role) =>
        set({ activeOrgId: orgId, activeOrgSlug: slug, memberRole: role }),
      setActiveDivision: (divisionId) =>
        set({ activeDivisionId: divisionId }),
    }),
    { name: 'workspace-store' }
  )
)
```

### Optimistic Update: Konfirmasi Hadir Scrim

```typescript
// features/scrim/hooks/useScrimMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scrimQueryKeys } from '../queries/scrimQueries'
import { updateAttendance } from '../actions/updateAttendance'

export function useUpdateAttendance(scrimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: 'confirmed' | 'declined' | 'tentative') =>
      updateAttendance({ scrimId, status }),

    // Optimistic update: langsung update UI sebelum server respond
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: scrimQueryKeys.detail(scrimId) })

      const previous = queryClient.getQueryData(scrimQueryKeys.detail(scrimId))

      queryClient.setQueryData(scrimQueryKeys.detail(scrimId), (old: any) => ({
        ...old,
        attendances: old.attendances.map((a: any) =>
          a.user_id === currentUserId ? { ...a, status: newStatus } : a
        ),
      }))

      return { previous }
    },

    // Rollback jika error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(scrimQueryKeys.detail(scrimId), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scrimQueryKeys.detail(scrimId) })
    },
  })
}
```

---

## F. Realtime Strategy

### Fitur yang Membutuhkan Realtime

| Fitur | Channel | Event |
|---|---|---|
| Konfirmasi hadir scrim | `scrim-attendance:{scrim-id}` | INSERT/UPDATE `scrim_attendances` |
| Notifikasi in-app | `notifications:{user-id}` | INSERT `notifications` |
| Activity feed tim | `activity:{org-id}` | Broadcast custom events |
| Online presence member | `presence:{org-id}` | Presence join/leave |

### Channel Naming Convention

```
Format: {feature}:{entity-id}

Contoh:
- scrim-attendance:abc-123
- notifications:user-uuid
- activity:org-uuid
- presence:org-uuid
```

### Implementasi Realtime (Hook)

```typescript
// features/scrim/hooks/useScrimAttendance.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { scrimQueryKeys } from '../queries/scrimQueries'

export function useScrimAttendanceRealtime(scrimId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`scrim-attendance:${scrimId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scrim_attendances',
          filter: `scrim_id=eq.${scrimId}`,
        },
        () => {
          // Invalidate query → refetch terbaru
          queryClient.invalidateQueries({
            queryKey: scrimQueryKeys.detail(scrimId),
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [scrimId, queryClient, supabase])
}
```

### Presence: Online Status Member

```typescript
// features/roster/hooks/useTeamPresence.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTeamPresence(orgId: string, userId: string, displayName: string) {
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`presence:${orgId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineMembers(Object.keys(state))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, displayName, online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [orgId, userId, displayName, supabase])

  return onlineMembers
}
```
