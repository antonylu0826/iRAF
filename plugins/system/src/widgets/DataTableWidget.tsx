import React from "react"
import type { IWidgetProps } from "@iraf/dashboard"
import { Loader2, Settings } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@iraf/react"

export function DataTableWidget({ widget, data, loading, error, editMode, onConfigure }: IWidgetProps) {
  const config = widget.config
  const records: Record<string, any>[] = Array.isArray(data) ? data : []
  const explicitColumns: string[] | undefined = config.columns

  // Derive columns from data if not specified
  const columns = explicitColumns
    ?? (records.length > 0
      ? Object.keys(records[0]).filter(k => !k.startsWith("_") && k !== "id")
      : [])

  return (
    <div className="h-full flex flex-col p-3 relative">
      {editMode && onConfigure && (
        <button className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground" onClick={onConfigure}>
          <Settings className="h-3.5 w-3.5" />
        </button>
      )}

      {widget.title && <div className="text-sm font-semibold mb-2">{widget.title}</div>}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-destructive">{error}</div>
      ) : records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">無資料</div>
      ) : (
        <div className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col} className="text-xs font-semibold whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((row, i) => (
                <TableRow key={row.id ?? i}>
                  {columns.map(col => (
                    <TableCell key={col} className="text-xs py-1.5 whitespace-nowrap">
                      {formatCell(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function formatCell(value: any): string {
  if (value == null) return "—"
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
