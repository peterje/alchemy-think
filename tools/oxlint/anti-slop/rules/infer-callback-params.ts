import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const GENERATED_PATH_SEGMENT = /(?:^|[/\\])(?:_generated|paraglide)(?:[/\\]|$)|[.]gen[.]/u;
const TRANSPARENT_WRAPPERS = new Set([
  "ChainExpression",
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSInstantiationExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

function isGeneratedFile(filename: string): boolean {
  return GENERATED_PATH_SEGMENT.test(filename);
}

function isCallArgument(call: ESTree.Node, candidate: ESTree.Node): boolean {
  return "arguments" in call && call.arguments.some((argument) => argument === candidate);
}

function isContextualCallback(node: ESTree.Node): boolean {
  let candidate: ESTree.Node = node;
  let parent = candidate.parent;

  while (parent) {
    if (TRANSPARENT_WRAPPERS.has(parent.type)) {
      candidate = parent;
      parent = candidate.parent;
      continue;
    }

    if (
      parent.type === "JSXExpressionContainer" &&
      parent.expression === candidate &&
      parent.parent?.type === "JSXAttribute"
    ) {
      return true;
    }

    if (
      (parent.type === "CallExpression" || parent.type === "NewExpression") &&
      isCallArgument(parent, candidate)
    ) {
      return true;
    }

    if (
      parent.type === "Property" &&
      parent.value === candidate &&
      parent.parent?.type === "ObjectExpression"
    ) {
      candidate = parent.parent;
      parent = candidate.parent;
      continue;
    }

    if (
      (parent.type === "ArrayExpression" && parent.elements.includes(candidate)) ||
      (parent.type === "SpreadElement" && parent.argument === candidate)
    ) {
      candidate = parent;
      parent = candidate.parent;
      continue;
    }

    return false;
  }

  return false;
}

function parameterAnnotation(param: ESTree.Node): ESTree.Node | null {
  if (param.type === "AssignmentPattern") {
    return parameterAnnotation(param.left);
  }
  if (param.type === "TSParameterProperty") {
    return parameterAnnotation(param.parameter);
  }
  return param.typeAnnotation ?? null;
}

/** Require callback parameters to rely on their contextual types instead of explicit annotations. */
export const inferCallbackParamsRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow explicit parameter types in callback expressions.",
    },
    hasSuggestions: true,
    messages: {
      infer:
        "Move this type to the callback's contextual boundary and rely on parameter inference here.",
      inferSuggestion: "Remove the explicit callback parameter type.",
    },
  },
  create(context) {
    if (isGeneratedFile(context.physicalFilename)) {
      return {};
    }

    function checkCallback(node: ESTree.Node): void {
      if (!isContextualCallback(node)) {
        return;
      }

      for (const param of node.params) {
        const annotation = parameterAnnotation(param);
        if (!annotation) {
          continue;
        }
        context.report({
          node: annotation,
          messageId: "infer",
          suggest: [
            {
              messageId: "inferSuggestion",
              fix(fixer) {
                return fixer.remove(annotation);
              },
            },
          ],
        });
      }
    }

    return {
      ArrowFunctionExpression: checkCallback,
      FunctionExpression: checkCallback,
    };
  },
});
