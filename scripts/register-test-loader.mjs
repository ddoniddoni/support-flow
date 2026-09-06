import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Node's native TypeScript support plus the same @/ alias used by Next.js.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const file = resolve('src', specifier.slice(2));
      for (const suffix of ['.ts', '/index.ts']) {
        if (existsSync(file + suffix)) return nextResolve(pathToFileURL(file + suffix).href, context);
      }
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const file = fileURLToPath(new URL(specifier, context.parentURL));
      for (const suffix of ['.ts', '/index.ts']) {
        if (existsSync(file + suffix)) return nextResolve(pathToFileURL(file + suffix).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
