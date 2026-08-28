import { createFileRoute } from "@tanstack/react-router";
import { nextCount, phaseLabel, type DemoPhase } from "../client/demo-state.ts";

/** Landing page for the starter demo. */
export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search) => {
    const parsed = Number(search.count);
    return { count: Number.isInteger(parsed) && parsed >= 0 ? parsed : 0 };
  },
  component: HomePage,
});

function HomePage() {
  const { count } = Route.useSearch();
  const navigate = Route.useNavigate();
  const phase: DemoPhase = count > 0 ? "ready" : "idle";

  return (
    <main className="demo-app">
      <p className="eyebrow">Alchemy starter</p>
      <h1>Starter</h1>
      <p className="lede">
        A small Vite + React app with the same verification toolchain as Chemistry: Alchemy, oxlint
        anti-slop, oxfmt, lefthook, Playwright, and React Doctor.
      </p>
      <p className="phase" data-phase={phase}>
        {phaseLabel(phase)}
      </p>
      <div className="demo-actions">
        <button
          type="button"
          className="primary"
          onClick={() => navigate({ search: { count: nextCount(count) } })}
        >
          Increment
        </button>
        <p className="count" aria-live="polite">
          Count {count}
        </p>
      </div>
    </main>
  );
}
