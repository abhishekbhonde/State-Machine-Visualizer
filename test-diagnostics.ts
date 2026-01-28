import { parseMachine } from "./src/lib/parser";
import { analyzeGraph } from "./src/lib/analyzer";
import { generateReport } from "./src/lib/diagnostics";

const problematicMachine = {
    initial: "A",
    states: {
        A: { on: { NEXT: "B" } },
        B: { on: { LOOP: "A" } }, // Cycle
        C: { type: "default" }    // Orphan & Dead End
    }
};

const graph = parseMachine(problematicMachine);
const analysis = analyzeGraph(graph);
const report = generateReport(graph, analysis);

console.log(JSON.stringify(report, null, 2));
