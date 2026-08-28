import { eslintCompatPlugin } from "@oxlint/plugins";

import { inlineJsxCallbackRule } from "./rules/inline-jsx-callback.ts";
import { noBannedReactReexportRule } from "./rules/no-banned-react-reexport.ts";
import { noManualMemoizationRule } from "./rules/no-manual-memoization.ts";
import { noUseEffectRule } from "./rules/no-use-effect.ts";
import { noUseStateRule } from "./rules/no-use-state.ts";

/** Opt-in Oxlint rules for React feature code (state, effects, memoization, and callbacks). */
const antiSlopReactPlugin = eslintCompatPlugin({
  meta: { name: "anti-slop-react" },
  rules: {
    "inline-jsx-callback": inlineJsxCallbackRule,
    "no-banned-react-reexport": noBannedReactReexportRule,
    "no-manual-memoization": noManualMemoizationRule,
    "no-use-effect": noUseEffectRule,
    "no-use-state": noUseStateRule,
  },
});

export default antiSlopReactPlugin;
