/**
 * Mentor entrypoint (Phase 3 will call getLlmProvider() + Zod schemas).
 * Provider swap is already handled in ./provider.ts — keep call sites on this module.
 */
export { getConfiguredProviderInfo, getLlmProvider } from "./provider";
