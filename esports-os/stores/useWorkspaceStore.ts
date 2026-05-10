import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OrgJwtClaim } from "@/types/jwt";

type MemberRole = OrgJwtClaim["role"];

interface WorkspaceState {
  /** Currently active organization id (UUID). */
  activeOrgId: string | null;
  /** Slug of the active org (used in URLs). */
  activeOrgSlug: string | null;
  /** Currently selected division within the active org. */
  activeDivisionId: string | null;
  /** The current user's role in the active org. */
  memberRole: MemberRole | null;

  setActiveOrg: (
    args: { orgId: string; slug: string; role: MemberRole } | null,
  ) => void;
  setActiveDivision: (divisionId: string | null) => void;
  reset: () => void;
}

const initialState: Pick<
  WorkspaceState,
  "activeOrgId" | "activeOrgSlug" | "activeDivisionId" | "memberRole"
> = {
  activeOrgId: null,
  activeOrgSlug: null,
  activeDivisionId: null,
  memberRole: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialState,
      setActiveOrg: (args) =>
        set(
          args
            ? {
                activeOrgId: args.orgId,
                activeOrgSlug: args.slug,
                memberRole: args.role,
              }
            : initialState,
        ),
      setActiveDivision: (divisionId) =>
        set({ activeDivisionId: divisionId }),
      reset: () => set(initialState),
    }),
    { name: "esports-os:workspace" },
  ),
);
