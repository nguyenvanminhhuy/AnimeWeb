import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const normalize = (value) => value.split(path.sep).join('/');
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}
const all = new Set(walk(root).map((file) => normalize(path.relative(root, file))));
const files = [...all].filter((file) => /\.tsx?$/.test(file));
const edges = new Map();
const errors = [];

function dependency(from, value) {
  if (!value.startsWith('.') && !value.startsWith('@/')) return;
  const target = value.startsWith('@/')
    ? value.slice(2)
    : normalize(path.relative(root, path.resolve(root, path.dirname(from), value)));
  // Case-sensitive comparison also catches paths that work only on Windows.
  const resolved = [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    `${target}/index.ts`,
    `${target}/index.tsx`,
  ].find((candidate) => all.has(candidate));
  if (!resolved) {
    errors.push(`${from}: unresolved local import ${value}`);
    return;
  }
  const fromLayer = from.split('/')[0];
  const toLayer = resolved.split('/')[0];
  if (fromLayer !== 'app' && from !== 'main.tsx' && toLayer === 'app') {
    errors.push(`${from}: only app/main can depend on app (${resolved})`);
  }
  if (
    fromLayer !== 'app' &&
    fromLayer !== 'features' &&
    from !== 'main.tsx' &&
    toLayer === 'features'
  ) {
    errors.push(`${from}: shared modules cannot depend on features (${resolved})`);
  }
  if (
    fromLayer === 'features' &&
    toLayer === 'features' &&
    from.split('/')[1] !== resolved.split('/')[1]
  ) {
    errors.push(
      `${from}: cross-feature import (${resolved}); compose in app or extract shared code`,
    );
  }
  if (/\.tsx?$/.test(resolved)) edges.get(from).push(resolved);
}

for (const file of files) {
  edges.set(file, []);
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(path.join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      dependency(file, node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      dependency(file, node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const visited = new Set();
const active = new Set();
function checkCycles(file, chain = []) {
  if (active.has(file)) {
    errors.push(`Circular dependency: ${[...chain, file].join(' -> ')}`);
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of edges.get(file) ?? []) checkCycles(target, [...chain, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) checkCycles(file);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Architecture PASS: ${files.length} modules, valid paths/casing, no cross-feature/reverse imports or cycles.`,
  );
