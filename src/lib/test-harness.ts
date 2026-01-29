import { parseMachine } from "./parser";
import { analyzeGraph } from "./analyzer";
import { SimulationEngine } from "./simulation";

/**
 * Simple Test Runner Utility
 */
const describe = (name: string, fn: () => void) => {
    console.log(`\n📦 Testing: ${name}`);
    fn();
};

const it = (name: string, fn: () => void) => {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (error) {
        console.log(`  ❌ ${name}`);
        console.error(`     Error: ${(error as Error).message}`);
    }
};

const expect = (actual: any) => ({
    toBe: (expected: any) => {
        if (actual !== expected) throw new Error(`Expected ${expected}, but got ${actual}`);
    },
    toEqual: (expected: any) => {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) throw new Error(`Expected ${e}, but got ${a}`);
    },
    toThrow: (code: string) => {
        let threw = false;
        try {
            actual();
        } catch (e) {
            if ((e as any).code === code) threw = true;
        }
        if (!threw) throw new Error(`Expected to throw error with code ${code}`);
    },
    toContain: (item: any) => {
        if (actual instanceof Set) {
            if (!actual.has(item)) throw new Error(`Expected set to contain ${item}`);
        } else if (Array.isArray(actual)) {
            if (!actual.includes(item)) throw new Error(`Expected array to contain ${item}`);
        }
    }
});

/**
 * --- TEST SUITE ---
 */

describe("Parser Unit Tests", () => {
    it("should parse a valid machine", () => {
        const input = {
            initial: "idle",
            states: { idle: { on: { START: "running" } }, running: {} }
        };
        const graph = parseMachine(input);
        expect(graph.nodes.size).toBe(2);
        expect(graph.initial).toBe("idle");
    });

    it("should throw MISSING_INITIAL if initial is missing", () => {
        const input = { states: { a: {} } };
        expect(() => parseMachine(input as any)).toThrow("MISSING_INITIAL");
    });

    it("should throw INVALID_REFERENCE for broken transition targets", () => {
        const input = {
            initial: "a",
            states: { a: { on: { GO: "b" } } } // 'b' doesn't exist
        };
        expect(() => parseMachine(input)).toThrow("INVALID_REFERENCE");
    });
});

describe("Graph Analysis: Cycle Detection", () => {
    it("should detect a simple A -> B -> A cycle", () => {
        const input = {
            initial: "A",
            states: {
                A: { on: { NEXT: "B" } },
                B: { on: { BACK: "A" } }
            }
        };
        const graph = parseMachine(input);
        const analysis = analyzeGraph(graph);
        expect(analysis.cycles.length).toBe(1);
        expect(analysis.cycles[0].has("A")).toBe(true);
        expect(analysis.cycles[0].has("B")).toBe(true);
    });

    it("should not detect cycles in a DAG", () => {
        const input = {
            initial: "start",
            states: {
                start: { on: { NEXT: "end" } },
                end: { type: "final" }
            }
        };
        const graph = parseMachine(input);
        const analysis = analyzeGraph(graph);
        expect(analysis.cycles.length).toBe(0);
    });
});

describe("Graph Analysis: Reachability", () => {
    it("should identify unreachable states", () => {
        const input = {
            initial: "A",
            states: {
                A: { on: { NEXT: "B" } },
                B: {},
                C: {} // Unreachable
            }
        };
        const graph = parseMachine(input);
        const analysis = analyzeGraph(graph);
        expect(analysis.reachable.has("A")).toBe(true);
        expect(analysis.reachable.has("B")).toBe(true);
        expect(analysis.reachable.has("C")).toBe(false);
        expect(analysis.orphans.has("C")).toBe(true);
    });
});

describe("Simulation Correctness", () => {
    it("should transition correctly on events", () => {
        const input = {
            initial: "off",
            states: {
                off: { on: { TOGGLE: "on" } },
                on: { on: { TOGGLE: "off" } }
            }
        };
        const graph = parseMachine(input);
        const sim = new SimulationEngine(graph);

        expect(sim.getState().activeStateId).toBe("off");

        sim.send("TOGGLE");
        expect(sim.getState().activeStateId).toBe("on");

        sim.send("TOGGLE");
        expect(sim.getState().activeStateId).toBe("off");
    });

    it("should reset to initial state", () => {
        const input = {
            initial: "A",
            states: { A: { on: { GO: "B" } }, B: {} }
        };
        const graph = parseMachine(input);
        const sim = new SimulationEngine(graph);

        sim.send("GO");
        expect(sim.getState().activeStateId).toBe("B");

        sim.reset();
        expect(sim.getState().activeStateId).toBe("A");
        expect(sim.getState().steps).toBe(0);
    });

    it("should handle invalid events gracefully", () => {
        const input = {
            initial: "A",
            states: { A: { on: { GO: "B" } }, B: {} }
        };
        const graph = parseMachine(input);
        const sim = new SimulationEngine(graph);

        const stateBefore = sim.getState().activeStateId;
        sim.send("UNKNOWN_EVENT");
        expect(sim.getState().activeStateId).toBe(stateBefore); // No change
    });
});

console.log("\n--- Testing Complete ---");
