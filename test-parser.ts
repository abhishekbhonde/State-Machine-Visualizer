import { parseMachine, ParserError } from "./src/lib/parser";

const validInput = {
    initial: "idle",
    states: {
        idle: {
            on: { START: "running" }
        },
        running: {
            on: { STOP: "idle" }
        }
    }
};

try {
    const graph = parseMachine(validInput);
    console.log("Success! Graph built with", graph.nodes.size, "nodes.");

    // Check adjacency
    const idleNode = graph.nodes.get("idle");
    console.log("Idle outgoing:", idleNode?.outgoing);
} catch (e) {
    console.error("Parse failed:", e);
}

const invalidInput = {
    initial: "idle",
    states: {
        idle: {
            on: { JUMP: "missing_state" } // Error: missing_state undefined
        }
    }
};

try {
    parseMachine(invalidInput);
} catch (e) {
    if (e instanceof ParserError) {
        console.log("Caught expected error:", e.code, e.message);
    }
}
