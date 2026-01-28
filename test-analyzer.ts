import { parseMachine } from "./src/lib/parser";
import { analyzeGraph } from "./src/lib/analyzer";

const cyclicMachine = {
    initial: "A",
    states: {
        A: { on: { NEXT: "B" } },
        B: { on: { NEXT: "C" } },
        C: { on: { LOOP: "A", END: "D" } }, // Cycle: A->B->C->A
        D: { type: "final" },
        E: { on: { NEXT: "F" } }, // Orphan source
        F: { type: "default" }    // Orphan target (Dead End)
    }
};

try {
    const graph = parseMachine(cyclicMachine);
    const result = analyzeGraph(graph);

    console.log("Analysis Results:");
    console.log("Reachable:", Array.from(result.reachable));
    console.log("Orphans:", Array.from(result.orphans));
    console.log("Dead Ends:", Array.from(result.deadEnds)); // Should be none (D is final)
    console.log("Cycles:", result.cycles.map(s => Array.from(s)));

} catch (e) {
    console.error(e);
}
