"use client";
 
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
 
interface PatchSelectorProps {
  activePatchId: string;
  patches: Array<{ id: string; patch_version: string; season: string; is_active: boolean }>;
}
 
const PatchSelector = ({ activePatchId, patches }: PatchSelectorProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
 
  const selectOptions = patches.map((p) => ({
    value: p.id,
    label: `${p.patch_version} (${p.season})${p.is_active ? " - Aktif" : ""}`,
  }));
 
  function handlePatchChange(patchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("patchId", patchId);
    router.push(`${pathname}?${params.toString()}`);
  }
 
  return (
    <div className="w-full">
      <CustomSelect
        value={activePatchId}
        options={selectOptions}
        onChange={handlePatchChange}
        placeholder="Pilih Patch..."
        fullWidth
        className="flex h-9 w-full items-center justify-between rounded-lg border border-ui-border bg-ui-surface/60 backdrop-blur-md px-3 text-[11px] font-medium text-ui-text focus:outline-none transition-all duration-200 disabled:opacity-50 cursor-pointer hover:bg-ui-hover/30 hover:border-ui-border/80"
      />
    </div>
  );
};
 
export { PatchSelector };
