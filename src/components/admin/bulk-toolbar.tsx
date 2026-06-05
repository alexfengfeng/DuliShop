import { bulkUpdateResource } from "@/lib/actions";
import type { ResourceName } from "@/lib/admin/schemas";

export function BulkToolbar({
  resource,
  ids,
  statuses,
  label,
  actionLabel,
}: {
  resource: ResourceName;
  ids: string[];
  statuses: string[];
  label: string;
  actionLabel: string;
}) {
  if (!ids.length) return null;

  return (
    <form action={bulkUpdateResource} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dfe7df] bg-white p-3 text-sm">
      <input type="hidden" name="resource" value={resource} />
      <input type="hidden" name="ids" value={ids.join(",")} />
      <span className="font-black text-[#647067]">{label}</span>
      <select name="status" className="h-9 rounded-lg border border-[#d8e0d8] px-2">
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button className="rounded-lg bg-[#173326] px-3 py-2 text-xs font-black text-white">{actionLabel}</button>
    </form>
  );
}
