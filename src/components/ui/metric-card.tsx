export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#dfe7df] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#647067]">
        {label}
      </p>
      <div className="mt-2 text-2xl font-black text-[#173326]">{value}</div>
      <p className="mt-1 text-sm text-[#647067]">{detail}</p>
    </div>
  );
}
