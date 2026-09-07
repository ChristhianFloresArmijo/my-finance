#!/usr/bin/env node
// scripts/scaffold-module.mjs
// Crea el esqueleto DDD (business/capabilities/integration/presentation) para cada
// módulo indicado, en apps/api/src/modules/<name> y apps/web/src/modules/<name>,
// siguiendo la misma estructura y estilo que ya usan account/authentication/authorization.
//
// Uso: node scripts/scaffold-module.mjs <modulo> [<modulo> ...]
// Ejemplo: node scripts/scaffold-module.mjs financial_accounts transactions categorization

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const moduleNames = process.argv.slice(2);
const snakeCasePattern = /^[a-z][a-z0-9_]*$/;

if (moduleNames.length === 0) {
  console.error(
    "Uso: node scripts/scaffold-module.mjs <modulo> [<modulo> ...]",
  );
  console.error(
    "Ejemplo: node scripts/scaffold-module.mjs financial_accounts transactions",
  );
  process.exit(1);
}

function toPascalCase(snake) {
  return snake
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

function writeIfMissing(path, content) {
  if (existsSync(path)) {
    console.log(`  ya existe, no se toca: ${path}`);
    return;
  }
  writeFileSync(path, content);
  console.log(`  creado: ${path}`);
}

// apps/api: comillas dobles, sin punto y coma (.eslintrc.js -> prettier/prettier: { semi: false })
function scaffoldBackend(name) {
  const pascal = toPascalCase(name);
  const root = join(repoRoot, "apps/api/src/modules", name);

  [
    "business/entities",
    "business/repositories",
    "capabilities",
    "integration/repositories",
    "presentation/restful",
    "presentation/dtos",
  ].forEach((d) => mkdirSync(join(root, d), { recursive: true }));

  writeIfMissing(join(root, "business/entities/index.ts"), `export {}\n`);
  writeIfMissing(join(root, "business/repositories/index.ts"), `export {}\n`);
  writeIfMissing(
    join(root, "integration/repositories/index.ts"),
    `export {}\n`,
  );
  writeIfMissing(join(root, "presentation/restful/index.ts"), `export {}\n`);
  writeIfMissing(join(root, "presentation/dtos/index.ts"), `export {}\n`);
  writeIfMissing(join(root, "capabilities/commands.ts"), `export {}\n`);
  writeIfMissing(join(root, "capabilities/queries.ts"), `export {}\n`);
  writeIfMissing(join(root, "capabilities/handlers.ts"), `export default []\n`);

  writeIfMissing(
    join(root, `${name}.module.ts`),
    `import { Module } from "@nestjs/common"
import { CqrsModule } from "@nestjs/cqrs"
import { RepositoryService } from "@shared/integration/services"
import HANDLERS from "./capabilities/handlers"
// TODO: cuando existan, importar la interfaz de repositorio desde "./business/repositories"
// y su implementación concreta desde "./integration/repositories", y agregarlas a
// 'providers' como { provide: I<Entidad>Repository, useClass: <Entidad>Repository }.
// TODO: importar los controllers desde "./presentation/restful" y agregarlos a 'controllers'.
// Quita RepositoryService si este módulo no lo necesita.

@Module({
  imports: [CqrsModule],
  controllers: [],
  providers: [RepositoryService, ...HANDLERS],
  exports: [],
})
export class ${pascal}Module {}
`,
  );
}

// apps/web: comillas simples, con punto y coma
function scaffoldFrontend(name) {
  const root = join(repoRoot, "apps/web/src/modules", name);

  [
    "business/entities",
    "business/repositories",
    "business/schemas",
    "capabilities",
    "integration/repositories",
    "presentation/composables",
    "presentation/views",
  ].forEach((d) => mkdirSync(join(root, d), { recursive: true }));

  writeIfMissing(join(root, "business/index.ts"), `export {};\n`);
  writeIfMissing(join(root, "capabilities/index.ts"), `export {};\n`);
  writeIfMissing(join(root, "integration/index.ts"), `export {};\n`);
  writeIfMissing(
    join(root, "presentation/composables/index.ts"),
    `export {};\n`,
  );
  writeIfMissing(
    join(root, "presentation/index.ts"),
    `export * from './composables';\n`,
  );
  writeIfMissing(
    join(root, "index.ts"),
    `export * from './business';\nexport * from './capabilities';\nexport * from './integration';\nexport * from './presentation';\n`,
  );
}

for (const name of moduleNames) {
  if (!snakeCasePattern.test(name)) {
    console.error(
      `"${name}" no es snake_case válido (ej. financial_accounts) — se omite.`,
    );
    continue;
  }
  console.log(`\n📦 ${name}`);
  scaffoldBackend(name);
  scaffoldFrontend(name);
}

console.log(
  `\nListo. Pendiente manual por módulo:\n` +
    `  1. Crear capabilities/<caso-de-uso>/ según la tabla de casos de uso en docs/modules/.\n` +
    `  2. Registrar el <Modulo>Module en apps/api/src/app.module.ts.\n` +
    `  3. Agregar el alias en apps/api/tsconfig.json: "@<modulo>/*": ["src/modules/<modulo>/*"].`,
);
