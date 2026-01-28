import { StateMachineGraph, StateID } from "./engine-types";
import { SimulationEngine, SimulationState } from "./simulation";
import { MachineDefinition, StateDefinition, TransitionConfig } from "./types";

/**
 * Serialized Simulation Data
 * Capture the full context of a user's session.
 */
export interface SerializedSession {
    machine: MachineDefinition;
    simulation?: {
        history: StateID[];
        log: string[];
        currentStep: number;
    };
    meta?: {
        createdAt: string;
        version: string;
    };
}

/**
 * EXPORT: Convert Internal Graph back to Clean JSON.
 * Useful for normalizing sloppy input or saving graph edits.
 */
export const graphToJSON = (graph: StateMachineGraph): MachineDefinition => {
    const states: Record<string, StateDefinition> = {};

    for (const [id, node] of graph.nodes) {
        const stateDef: StateDefinition = {
            type: node.type,
            meta: node.meta,
        };

        if (node.transitions.size > 0) {
            stateDef.on = {};
            for (const [event, t] of node.transitions) {
                // Determine if we can use shorthand (string) or need object
                if (t.cond || (t.actions && t.actions.length > 0)) {
                    stateDef.on[event] = {
                        target: t.target,
                        cond: t.cond,
                        actions: t.actions
                    } as TransitionConfig;
                } else {
                    stateDef.on[event] = t.target;
                }
            }
        }

        states[id] = stateDef;
    }

    return {
        initial: graph.initial,
        states,
        // We could preserve ID if stored in graph
    };
};

/**
 * EXPORT: Full Session Snapshot
 */
export const exportSession = (
    graph: StateMachineGraph,
    sim: SimulationEngine
): string => {
    const machine = graphToJSON(graph);
    const simState = sim.getState();

    const session: SerializedSession = {
        machine,
        simulation: {
            history: simState.history,
            log: simState.log,
            currentStep: simState.steps
        },
        meta: {
            createdAt: new Date().toISOString(),
            version: "1.0.0"
        }
    };

    return JSON.stringify(session, null, 2);
};

/**
 * IMPORT: Hydrate Simulation from Session
 */
export const importSession = (
    jsonString: string
): { machine: MachineDefinition; history: StateID[] } => {
    try {
        const session = JSON.parse(jsonString) as SerializedSession;

        // Basic validation
        if (!session.machine || !session.machine.states) {
            throw new Error("Invalid session format: Missing machine definition.");
        }

        return {
            machine: session.machine,
            history: session.simulation ? session.simulation.history : []
        };
    } catch (e) {
        throw new Error(`Failed to import session: ${(e as Error).message}`);
    }
};
