/**
 * Engine Analysis Algorithms
 * --------------------------
 * Algorithms for static analysis of the State Machine Graph.
 */

import type { StateMachineGraph, StateID } from "./engine-types";

// Result of the Analysis
export interface AnalysisResult {
    reachable: Set<StateID>;
    orphans: Set<StateID>;
    deadEnds: Set<StateID>;
    cycles: Set<StateID>[]; // List of cycles detected (as sets of IDs)
    nondeterministic: Map<StateID, string[]>; // StateID -> duplicate events
}

/**
 * 1. Reachability Analysis (BFS)
 * Time Complexity: O(V + E)
 * - V: Number of states
 * - E: Number of transitions
 */
export const analyzeReachability = (graph: StateMachineGraph) => {
    const reachable = new Set<StateID>();
    const queue = [graph.initial];
    reachable.add(graph.initial);

    while (queue.length > 0) {
        const id = queue.shift()!;
        const node = graph.nodes.get(id);
        if (!node) continue;

        for (const transition of node.outgoing) {
            if (!reachable.has(transition.target)) {
                reachable.add(transition.target);
                queue.push(transition.target);
            }
        }
    }

    // Orphans are all nodes NOT in the reachable set
    const orphans = new Set<StateID>();
    for (const id of graph.nodes.keys()) {
        if (!reachable.has(id)) orphans.add(id);
    }

    return { reachable, orphans };
};

/**
 * 2. Dead-End Detection
 * Time Complexity: O(V)
 * A dead end is a non-final state with no outgoing transitions.
 */
export const analyzeDeadEnds = (graph: StateMachineGraph, reachable: Set<StateID>) => {
    const deadEnds = new Set<StateID>();
    for (const [id, node] of graph.nodes) {
        // Only care about reachable states
        if (!reachable.has(id)) continue;

        // If not final and no outgoing edges
        if (node.type !== 'final' && node.outgoing.length === 0) {
            deadEnds.add(id);
        }
    }
    return deadEnds;
};

/**
 * 3. Cycle Detection (DFS)
 * Time Complexity: O(V + E)
 * Returns a list of cycles (simple cycles).
 */
export const analyzeCycles = (graph: StateMachineGraph) => {
    const cycles: Set<StateID>[] = [];
    const visited = new Set<StateID>();
    const recursionStack = new Set<StateID>();

    const dfs = (currentId: StateID, path: StateID[]) => {
        visited.add(currentId);
        recursionStack.add(currentId);
        path.push(currentId);

        const node = graph.nodes.get(currentId);
        if (node) {
            for (const t of node.outgoing) {
                if (!visited.has(t.target)) {
                    dfs(t.target, path);
                } else if (recursionStack.has(t.target)) {
                    // Cycle found!
                    // Extract the cycle from the path
                    const cycleStartIndex = path.indexOf(t.target);
                    const cyclePath = path.slice(cycleStartIndex);
                    cycles.push(new Set(cyclePath));
                }
            }
        }

        recursionStack.delete(currentId);
        path.pop();
    };

    // Run DFS from initial state
    if (graph.nodes.has(graph.initial)) {
        dfs(graph.initial, []);
    }

    // Note: This simple DFS finds cycles reachable from initial.
    // If we want ALL cycles (even in orphans), we'd loop over all nodes.

    return cycles;
};

/**
 * 4. Nondeterminism Detection
 * Time Complexity: O(V * E_avg)
 * Detects if a state has multiple transitions for the same event (without mutually exclusive guards).
 * Note: Our InternalStateNode uses a Map for transitions, which inherently de-duplicates keys.
 * However, the raw schema could have had arrays.
 * Since our Parser currently enforces Map<Event, Transition>, simple duplicate keys are overwritten.
 * 
 * TODO: To support true nondeterminism detection (e.g. array of transitions for same event),
 * we would need to update InternalStateNode to store transitions as Map<Event, Transition[]>
 */
export const analyzeNondeterminism = (_graph: StateMachineGraph) => {
    // Placeholder: Our parser currently enforces determinism by overwriting duplicate keys.
    // If we upgrade the parser to allow arrays, we implement this check here.
    return new Map<StateID, string[]>();
};

/**
 * Main Analysis Orchestrator
 */
export const analyzeGraph = (graph: StateMachineGraph): AnalysisResult => {
    const { reachable, orphans } = analyzeReachability(graph);
    const deadEnds = analyzeDeadEnds(graph, reachable);
    const cycles = analyzeCycles(graph);
    const nondeterministic = analyzeNondeterminism(graph);

    return {
        reachable,
        orphans,
        deadEnds,
        cycles,
        nondeterministic
    };
};
