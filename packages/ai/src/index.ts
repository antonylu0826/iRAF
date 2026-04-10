// @iraf/ai — AI Panel server-side package

// Client entrypoint; server-only exports live in `@iraf/ai/server`.
export { AiModule } from "./module.js"

// Entities (for registration / metadata on client & server)
export { AiConfig } from "./entities/AiConfig.js"
export { AiConversation } from "./entities/AiConversation.js"
export { AiMessage } from "./entities/AiMessage.js"
export { AiConfigController } from "./entities/AiConfigController.js"
