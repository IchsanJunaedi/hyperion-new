# EsportsOS — Folder Structure

## Struktur Lengkap Proyek

```
esports-os/
├── app/
│   │
│   ├── (public)/                          # Route group: public, no auth required
│   │   └── [team-slug]/
│   │       ├── page.tsx                   # Public profile tim (SSR)
│   │       ├── layout.tsx                 # Layout minimal tanpa sidebar
│   │       └── _components/
│   │           ├── PublicHeroSection.tsx
│   │           ├── PublicRosterCard.tsx
│   │           ├── PublicAchievements.tsx
│   │           └── PublicScrimHistory.tsx
│   │
│   ├── (auth)/                            # Route group: halaman auth
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── callback/
│   │   │   └── route.ts                   # Supabase OAuth callback
│   │   └── layout.tsx                     # Layout centered, no sidebar
│   │
│   ├── (app)/                             # Route group: workspace (requires auth)
│   │   └── [team-slug]/
│   │       ├── layout.tsx                 # Layout workspace: sidebar + topbar
│   │       ├── page.tsx                   # Team Home / Dashboard
│   │       │
│   │       ├── scrim/
│   │       │   ├── page.tsx               # List semua scrim
│   │       │   ├── [scrim-id]/
│   │       │   │   ├── page.tsx           # Detail scrim
│   │       │   │   └── edit/
│   │       │   │       └── page.tsx       # Edit scrim (captain only)
│   │       │   └── new/
│   │       │       └── page.tsx           # Tambah scrim baru
│   │       │
│   │       ├── roster/
│   │       │   ├── page.tsx               # Daftar anggota + role
│   │       │   └── invite/
│   │       │       └── page.tsx           # Kelola undangan
│   │       │
│   │       ├── calendar/
│   │       │   └── page.tsx               # Kalender tim + events
│   │       │
│   │       ├── strategy/
│   │       │   ├── page.tsx               # Daftar strategy notes
│   │       │   └── [note-id]/
│   │       │       └── page.tsx           # Detail/edit note
│   │       │
│   │       ├── announcements/
│   │       │   └── page.tsx               # Pengumuman tim
│   │       │
│   │       ├── tournaments/
│   │       │   ├── page.tsx
│   │       │   └── [tournament-id]/
│   │       │       └── page.tsx
│   │       │
│   │       └── settings/
│   │           ├── page.tsx               # Pengaturan tim (owner only)
│   │           └── billing/
│   │               └── page.tsx           # Upgrade tier
│   │
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── fonnte/route.ts            # WA webhook dari Fonnte
│   │   │   └── supabase/route.ts          # Supabase webhook handler
│   │   └── invites/
│   │       └── [token]/route.ts           # Proses accept invite
│   │
│   ├── layout.tsx                         # Root layout
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── ui/                                # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   └── ... (semua shadcn components)
│   │
│   ├── layout/
│   │   ├── WorkspaceSidebar.tsx           # Sidebar navigasi workspace
│   │   ├── WorkspaceTopbar.tsx            # Header: nama tim, notif, avatar
│   │   ├── DivisionSwitcher.tsx           # Dropdown ganti divisi
│   │   └── MobileBottomNav.tsx            # Nav bawah untuk mobile
│   │
│   └── shared/
│       ├── AvatarGroup.tsx                # Grup avatar anggota
│       ├── StatusBadge.tsx                # Badge status (hadir/tidak)
│       ├── EmptyState.tsx                 # Komponen kosong generik
│       ├── LoadingSpinner.tsx
│       └── ConfirmDialog.tsx              # Dialog konfirmasi aksi destructive
│
├── features/                              # Feature-sliced architecture
│   ├── scrim/                             # === CONTOH LENGKAP FITUR ===
│   │   ├── components/
│   │   │   ├── ScrimCard.tsx              # Card satu scrim di list
│   │   │   ├── ScrimList.tsx              # List semua scrim
│   │   │   ├── ScrimForm.tsx              # Form tambah/edit scrim
│   │   │   ├── ScrimDetail.tsx            # Detail view + attendance
│   │   │   ├── AttendanceButton.tsx       # Tombol Hadir/Tidak/Ragu
│   │   │   ├── AttendanceTracker.tsx      # Tracker kehadiran real-time
│   │   │   └── ScrimResultForm.tsx        # Form input hasil scrim
│   │   ├── hooks/
│   │   │   ├── useScrims.ts               # TanStack Query: fetch list scrim
│   │   │   ├── useScrimDetail.ts          # TanStack Query: fetch 1 scrim
│   │   │   ├── useScrimAttendance.ts      # Realtime attendance hook
│   │   │   └── useScrimMutations.ts       # Mutations: create, update, delete
│   │   ├── actions/
│   │   │   ├── createScrim.ts             # Server Action: buat scrim baru
│   │   │   ├── updateScrim.ts             # Server Action: update scrim
│   │   │   ├── updateAttendance.ts        # Server Action: update status hadir
│   │   │   └── recordScrimResult.ts       # Server Action: input hasil
│   │   ├── queries/
│   │   │   └── scrimQueries.ts            # Query keys + fetcher functions
│   │   └── types.ts                       # TypeScript types untuk scrim
│   │
│   ├── roster/
│   │   ├── components/
│   │   │   ├── RosterTable.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   ├── InviteForm.tsx
│   │   │   └── RoleSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useRoster.ts
│   │   │   └── useInvites.ts
│   │   ├── actions/
│   │   │   ├── inviteMember.ts
│   │   │   ├── updateMemberRole.ts
│   │   │   └── removeMember.ts
│   │   └── types.ts
│   │
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── NotificationBell.tsx       # Icon dengan badge count
│   │   │   └── NotificationDropdown.tsx   # Dropdown list notif
│   │   ├── hooks/
│   │   │   └── useNotifications.ts        # Realtime notif hook
│   │   └── types.ts
│   │
│   ├── calendar/
│   ├── strategy/
│   └── announcements/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser Supabase client
│   │   ├── server.ts                      # Server Supabase client (SSR)
│   │   ├── middleware.ts                   # Middleware Supabase client
│   │   └── admin.ts                       # Admin client (Service Role Key)
│   ├── fonnte/
│   │   ├── client.ts                      # Fonnte WA API client
│   │   └── templates.ts                   # Template pesan WA
│   ├── utils/
│   │   ├── cn.ts                          # clsx + tailwind-merge helper
│   │   ├── format.ts                      # format tanggal, angka, dll
│   │   └── slug.ts                        # generate/validate slug
│   └── validations/
│       ├── scrimSchema.ts                 # Zod schemas
│       ├── rosterSchema.ts
│       └── orgSchema.ts
│
├── stores/                                # Zustand stores
│   ├── useWorkspaceStore.ts               # Active org, division, member ctx
│   ├── useUIStore.ts                      # Sidebar open/close, modals
│   └── useNotificationStore.ts            # Unread count, toast queue
│
├── types/
│   ├── database.ts                        # Auto-generated Supabase types
│   ├── api.ts                             # API response types
│   └── index.ts                           # Re-export semua types
│
├── middleware.ts                           # Next.js middleware (auth + domain)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

---

## Contoh Lengkap: Scrim Feature

### `features/scrim/types.ts`
```typescript
import type { Database } from '@/types/database'

export type Scrim = Database['public']['Tables']['scrims']['Row']
export type ScrimInsert = Database['public']['Tables']['scrims']['Insert']
export type ScrimAttendance = Database['public']['Tables']['scrim_attendances']['Row']
export type ScrimResult = Database['public']['Tables']['scrim_results']['Row']

export type ScrimWithDetails = Scrim & {
  attendances: ScrimAttendance[]
  result: ScrimResult | null
  division: { name: string; game: string }
}

export type AttendanceStatus = 'confirmed' | 'declined' | 'tentative' | 'pending'
```

### `features/scrim/queries/scrimQueries.ts`
```typescript
import { createClient } from '@/lib/supabase/client'

export const scrimQueryKeys = {
  all: (orgId: string) => ['scrims', orgId] as const,
  detail: (scrimId: string) => ['scrims', 'detail', scrimId] as const,
  attendance: (scrimId: string) => ['scrims', 'attendance', scrimId] as const,
}

export async function fetchScrims(orgId: string, divisionId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('scrims')
    .select('*, division:divisions(name, game)')
    .eq('organization_id', orgId)
    .order('scheduled_at', { ascending: true })

  if (divisionId) query = query.eq('division_id', divisionId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchScrimDetail(scrimId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('scrims')
    .select(`
      *,
      division:divisions(name, game),
      attendances:scrim_attendances(*, profile:profiles(display_name, avatar_url)),
      result:scrim_results(*)
    `)
    .eq('id', scrimId)
    .single()

  if (error) throw error
  return data
}
```

### `features/scrim/hooks/useScrims.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { scrimQueryKeys, fetchScrims } from '../queries/scrimQueries'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

export function useScrims() {
  const { activeOrgId, activeDivisionId } = useWorkspaceStore()

  return useQuery({
    queryKey: scrimQueryKeys.all(activeOrgId!),
    queryFn: () => fetchScrims(activeOrgId!, activeDivisionId ?? undefined),
    enabled: !!activeOrgId,
    staleTime: 30_000, // 30 detik
  })
}
```

### `features/scrim/actions/updateAttendance.ts`
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  scrimId: z.string().uuid(),
  status: z.enum(['confirmed', 'declined', 'tentative']),
})

export async function updateAttendance(input: z.infer<typeof schema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { scrimId, status } = schema.parse(input)

  const { error } = await supabase
    .from('scrim_attendances')
    .upsert(
      { scrim_id: scrimId, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: 'scrim_id,user_id' }
    )

  if (error) throw error
  revalidatePath(`/[team-slug]/scrim/${scrimId}`)
}
```

---

## Config Files Penting

### `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
