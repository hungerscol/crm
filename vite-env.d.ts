
/**
 * Environment type definitions.
 * Removed failing vite/client reference to resolve compilation errors.
 */

interface ImportMetaEnv {
  // Marked as readonly; key management is handled via process.env in geminiService.
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure process.env is recognized in the global scope for API key access.
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};
