import { deleteResource } from "@/lib/actions";
import type { ResourceName } from "@/lib/admin/schemas";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const fieldClass = "h-10 rounded-lg border border-[#d8e0d8] px-3 text-sm";
export const textareaClass = "min-h-24 rounded-lg border border-[#d8e0d8] p-3 text-sm";
export const buttonClass = "rounded-lg bg-[#173326] px-3 py-2 text-xs font-black text-white";
export const secondaryButtonClass = "rounded-lg border border-[#d8e0d8] px-3 py-2 text-xs font-black";
export const dangerButtonClass = "rounded-lg border border-[#f0b8ae] bg-[#fff7f5] px-3 py-2 text-xs font-black text-[#9f2f20]";

export function DeleteResourceForm({
  resource,
  id,
  label,
  message,
}: {
  resource: ResourceName;
  id: string;
  label: string;
  message: string;
}) {
  return (
    <form action={deleteResource}>
      <input type="hidden" name="resource" value={resource} />
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit className={dangerButtonClass} message={message}>
        {label}
      </ConfirmSubmit>
    </form>
  );
}
