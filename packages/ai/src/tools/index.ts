import type { IUserContext } from "@iraf/core"
import type { IAiToolDef } from "./types.js"
import { queryEntityTool } from "./queryEntity.js"
import { getSchemaTool } from "./getSchema.js"
import { callActionTool } from "./callAction.js"
import { createRecordTool } from "./createRecord.js"
import { updateRecordTool } from "./updateRecord.js"

export type { IAiToolDef } from "./types.js"

export function getAvailableTools(user: IUserContext, allowWriteOperations: boolean): IAiToolDef[] {
  const tools: IAiToolDef[] = [
    getSchemaTool,
    queryEntityTool,
  ]

  if (allowWriteOperations) {
    tools.push(callActionTool, createRecordTool, updateRecordTool)
  }

  return tools
}
