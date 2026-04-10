// @iraf/ai/server — server-only exports (must not be imported by the Vite app)

export { createAiRouter } from "./router.js"
export { AiConfigResolver } from "./configResolver.js"

// Provider types (for custom provider implementations)
export type { IAiProvider, IAiProviderRequest, IAiProviderResponse } from "./providers/types.js"
export { createProviderInstance } from "./providers/factory.js"

