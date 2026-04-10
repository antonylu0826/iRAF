export interface IAiToolDef {
  name: string
  description: string
  inputSchema: Record<string, any>
  requiresConfirmation?: boolean
  execute: (input: Record<string, any>) => Promise<string>
}
