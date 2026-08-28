import { defineRule } from "@oxlint/plugins";

import type { Context, ESTree } from "@oxlint/plugins";

const MANUAL_MEMOIZATION_HOOKS = new Set(["useCallback", "useMemo"]);

function propertyName(node: ESTree.Node): string | number | null {
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "Literal") {
    return node.value;
  }
  return null;
}

function reportManualMemoization(context: Context, node: ESTree.Node): void {
  context.report({ messageId: "banned", node });
}

/** Disallow manual useCallback / useMemo in codebases that rely on the React Compiler. */
export const noManualMemoizationRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow manual useCallback and useMemo calls when React Compiler is enabled.",
    },
    messages: {
      banned: "React Compiler handles memoization automatically.",
    },
  },
  create(context) {
    return {
      ImportSpecifier(node) {
        const declaration = node.parent;
        const name = propertyName(node.imported);
        if (
          declaration?.type === "ImportDeclaration" &&
          declaration.source.value === "react" &&
          typeof name === "string" &&
          MANUAL_MEMOIZATION_HOOKS.has(name)
        ) {
          reportManualMemoization(context, node);
        }
      },

      MemberExpression(node) {
        const name = propertyName(node.property);
        if (typeof name === "string" && MANUAL_MEMOIZATION_HOOKS.has(name)) {
          reportManualMemoization(context, node);
        }
      },

      Property(node) {
        const name = propertyName(node.key);
        if (
          node.parent?.type === "ObjectPattern" &&
          typeof name === "string" &&
          MANUAL_MEMOIZATION_HOOKS.has(name)
        ) {
          reportManualMemoization(context, node);
        }
      },
    };
  },
});
