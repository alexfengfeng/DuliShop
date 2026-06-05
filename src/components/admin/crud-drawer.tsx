export function CrudDrawer({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-lg border border-[#dfe7df] bg-white p-4">
      <summary className="cursor-pointer list-none text-sm font-black text-[#173326]">
        {summary}
      </summary>
      <div className="mt-4 border-t border-[#edf1ed] pt-4">
        <h3 className="mb-3 text-base font-black">{title}</h3>
        {children}
      </div>
    </details>
  );
}
