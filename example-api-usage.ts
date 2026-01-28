import { StateMachineAPI } from "./src/lib/api";

const engine = new StateMachineAPI();

const definition = {
    initial: "idle",
    states: {
        idle: { on: { START: "running" } },
        running: { on: { STOP: "idle" } }
    }
};

console.log("--- Loading Machine ---");
engine.loadMachine(definition);

console.log("--- Diagnostics ---");
console.log(engine.getDiagnostics().summary);

console.log("--- Simulation ---");
console.log("Current State:", engine.getSimulationState()?.activeStateId);
console.log("Available Events:", engine.getAvailableEvents());

engine.step("START");
console.log("State after START:", engine.getSimulationState()?.activeStateId);

engine.reset();
console.log("State after RESET:", engine.getSimulationState()?.activeStateId);
