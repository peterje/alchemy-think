import { defineRule } from "@oxlint/plugins";

import type { Context, ESTree } from "@oxlint/plugins";

const MESSAGE =
  "Optional `?` is not allowed. Use a required property/parameter with `| undefined` or `| null` instead.";

function reportOptional(context: Context, node: ESTree.Node): void {
  context.report({ node, messageId: "optional" });
}

function checkFunctionParams(context: Context, node: ESTree.Node): void {
  for (const param of node.params) {
    if (param.optional) {
      reportOptional(context, param);
    }
  }
}

/** Disallow TypeScript optional markers so callers must pass explicit `| undefined` / `| null`. */
export const noOptionalRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow optional (`?`) TypeScript properties and function parameters.",
    },
    messages: {
      optional: MESSAGE,
    },
  },
  create(context) {
    return {
      TSPropertySignature(node) {
        if (node.optional) {
          reportOptional(context, node);
        }
      },

      TSMethodSignature(node) {
        if (node.optional) {
          reportOptional(context, node);
        }
        checkFunctionParams(context, node);
      },

      TSNamedTupleMember(node) {
        if (node.optional) {
          reportOptional(context, node);
        }
      },

      PropertyDefinition(node) {
        if (node.optional) {
          reportOptional(context, node);
        }
      },

      FunctionDeclaration(node) {
        checkFunctionParams(context, node);
      },

      FunctionExpression(node) {
        checkFunctionParams(context, node);
      },

      ArrowFunctionExpression(node) {
        checkFunctionParams(context, node);
      },

      TSDeclareFunction(node) {
        checkFunctionParams(context, node);
      },

      TSEmptyBodyFunctionExpression(node) {
        checkFunctionParams(context, node);
      },

      TSFunctionType(node) {
        checkFunctionParams(context, node);
      },

      TSCallSignatureDeclaration(node) {
        checkFunctionParams(context, node);
      },

      TSConstructSignatureDeclaration(node) {
        checkFunctionParams(context, node);
      },
    };
  },
});
