import { parseMachine } from "./src/lib/parser";
import { SimulationEngine } from "./src/lib/simulation";
import { exportSession, importSession, graphToJSON } from "./src/lib/io";

const originalMachine = {
    initial: "A",
    states: {
        A: { on: { NEXT: { target: "B", cond: "isValid" } } },
        B: { on: { BACK: "A" } }
    }
};

// 1. Setup Session
const graph = parseMachine(originalMachine);
const sim = new SimulationEngine(graph);
sim.send("NEXT"); // A -> B

// 2. Export
console.log("--- Exported Session ---");
const sessionJson = exportSession(graph, sim);
console.log(sessionJson);

// 3. Verify Determinism (Graph -> JSON)
console.log("--- Clean Graph JSON ---");
const cleanJson = JSON.stringify(graphToJSON(graph), null, 2);
console.log(cleanJson);

// 4. Import
console.log("--- Import Test ---");
const { machine, history } = importSession(sessionJson);
console.log("Imported Initial:", machine.initial);
console.log("Restored History:", history);
