import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const BANNED_EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect"]);

function importedName(node: ESTree.ImportSpecifier): string {
  return node.imported.type === "Identifier" ? node.imported.name : node.imported.value;
}

function propertyName(node: ESTree.MemberExpression): string | number | null {
  if (node.property.type === "Identifier" && !node.computed) {
    return node.property.name;
  }
  if (node.property.type === "Literal") {
    return node.property.value;
  }
  return null;
}

/** Disallow React effect hooks; derive state during render or use an audited hook seam. */
export const noUseEffectRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow React useEffect and useLayoutEffect.",
    },
    messages: {
      banned:
        "Do not use React `{{name}}`. Derive state during render, update it in user interactions, or use an audited hook seam.",
    },
  },
  create(context) {
    const reactNamespaces = new Set<string>();

    return {
      ImportSpecifier(node) {
        if (
          node.parent?.type === "ImportDeclaration" &&
          node.parent.source.value === "react" &&
          BANNED_EFFECT_HOOKS.has(importedName(node))
        ) {
          context.report({
            node,
            messageId: "banned",
            data: { name: importedName(node) },
          });
        }
      },

      ImportDefaultSpecifier(node) {
        if (node.parent?.type === "ImportDeclaration" && node.parent.source.value === "react") {
          reactNamespaces.add(node.local.name);
        }
      },

      ImportNamespaceSpecifier(node) {
        if (node.parent?.type === "ImportDeclaration" && node.parent.source.value === "react") {
          reactNamespaces.add(node.local.name);
        }
      },

      MemberExpression(node) {
        const name = propertyName(node);
        if (
          node.object.type === "Identifier" &&
          reactNamespaces.has(node.object.name) &&
          typeof name === "string" &&
          BANNED_EFFECT_HOOKS.has(name)
        ) {
          context.report({
            node,
            messageId: "banned",
            data: { name },
          });
        }
      },

      VariableDeclarator(node) {
        if (
          node.id.type !== "ObjectPattern" ||
          node.init?.type !== "Identifier" ||
          !reactNamespaces.has(node.init.name)
        ) {
          return;
        }
        for (const property of node.id.properties) {
          if (
            property.type === "Property" &&
            !property.computed &&
            property.key.type === "Identifier" &&
            BANNED_EFFECT_HOOKS.has(property.key.name)
          ) {
            context.report({
              node: property,
              messageId: "banned",
              data: { name: property.key.name },
            });
          }
        }
      },

      ExportNamedDeclaration(node) {
        if (node.source?.value !== "react") {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === "ExportSpecifier") {
            const name =
              specifier.local.type === "Identifier" ? specifier.local.name : specifier.local.value;
            if (BANNED_EFFECT_HOOKS.has(name)) {
              context.report({
                node: specifier,
                messageId: "banned",
                data: { name },
              });
            }
          }
        }
      },
    };
  },
});
