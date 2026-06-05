export function DataTable({
  columns,
  rows,
  empty = "No records yet.",
  caption,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty?: string;
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[760px] text-sm">
          {caption ? <caption className="pb-3 text-left text-base font-black">{caption}</caption> : null}
          <thead className="text-left text-xs uppercase text-[#647067]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="py-2 pr-4">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-[#edf1ed]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-3 pr-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-8 text-center text-[#647067]" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
