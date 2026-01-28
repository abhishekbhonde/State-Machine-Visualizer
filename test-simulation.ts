import { parseMachine } from "./src/lib/parser";
import { SimulationEngine } from "./src/lib/simulation";

const input = {
    initial: "step1",
    states: {
        step1: { on: { NEXT: "step2" } },
        step2: { on: { NEXT: "step3", BACK: "step1" } },
        step3: { type: "final" }
    }
};

const graph = parseMachine(input);
const sim = new SimulationEngine(graph);

console.log("Start:", sim.getState().activeStateId);

sim.send("NEXT");
console.log("After NEXT:", sim.getState().activeStateId); // step2

sim.send("NEXT");
console.log("After NEXT:", sim.getState().activeStateId); // step3

console.log("Available events at step3 (Final):", sim.getAvailableEvents()); // [] (Empty)

sim.timeTravel(1);
console.log("Time Travel to step 1 (ID: step2):", sim.getState().activeStateId);
console.log("History length:", sim.getState().history.length); // Should be 2 (step1, step2)
