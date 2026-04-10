export interface IAiToolDef {
  name: string
  description: string
  inputSchema: Record<string, any>
  requiresConfirmation?: boolean
  /** Return the entityKey that was modified, so the frontend can refresh. */
  getAffectedEntityKey?: (input: Record<string, any>) => string | undefined
  execute: (input: Record<string, any>) => Promise<string>
}
