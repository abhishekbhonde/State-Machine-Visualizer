import type { StateMachineGraph, StateID, EventName } from "./engine-types";

// Simulation Types
export interface SimulationState {
    activeStateId: StateID;
    steps: number;
    history: StateID[];
    log: string[]; // Human readable log of what happened "Event X -> State Y"
}

export type TransitionResult =
    | { success: true; nextState: StateID; actions: string[] }
    | { success: false; reason: 'INVALID_EVENT' | 'NO_TRANSITION' | 'GUARD_PREVENTED' };

/**
 * Pure Transition Function
 * Core logic: (Graph, CurrentState, Event) -> Result
 */
export const transition = (
    graph: StateMachineGraph,
    currentStateId: StateID,
    event: EventName,
    // context?: any (Future: Extended state)
): TransitionResult => {
    const node = graph.nodes.get(currentStateId);
    if (!node) {
        return { success: false, reason: 'NO_TRANSITION' }; // Should not happen in valid graph
    }

    const transition = node.transitions.get(event);

    // 1. Check if event is handled
    if (!transition) {
        return { success: false, reason: 'INVALID_EVENT' };
    }

    // 2. Check Guard (Future: Evaluate cond)
    if (transition.cond) {
        // For now, we don't have a context evaluator, so we optimistically allow.
        // OR we could fail if strict.
        // Let's assume passed for MVP.
    }

    // 3. Return Success
    return {
        success: true,
        nextState: transition.target,
        actions: transition.actions
    };
};

/**
 * Simulation Controller Class
 * Manages stateful execution over time.
 */
export class SimulationEngine {
    private state: SimulationState;
    private graph: StateMachineGraph;

    constructor(graph: StateMachineGraph) {
        this.graph = graph;
        this.state = {
            activeStateId: graph.initial,
            steps: 0,
            history: [graph.initial],
            log: [`Initialized at ${graph.initial}`]
        };
    }

    /**
     * Resets the simulation to initial state.
     */
    reset() {
        this.state = {
            activeStateId: this.graph.initial,
            steps: 0,
            history: [this.graph.initial],
            log: [`Reset to ${this.graph.initial}`]
        };
        return this.getState();
    }

    /**
     * Executes an event.
     */
    send(event: EventName): SimulationState {
        const result = transition(this.graph, this.state.activeStateId, event);

        if (result.success) {
            this.state.activeStateId = result.nextState;
            this.state.steps++;
            this.state.history.push(result.nextState);
            this.state.log.push(`Event '${event}' -> Transitioned to '${result.nextState}'`);
        } else {
            this.state.log.push(`Event '${event}' -> Failed: ${result.reason}`);
        }

        return this.getState();
    }

    /**
     * Returns current available events for the active state.
     */
    getAvailableEvents(): EventName[] {
        const node = this.graph.nodes.get(this.state.activeStateId);
        return node ? Array.from(node.transitions.keys()) : [];
    }

    getState(): SimulationState {
        return { ...this.state }; // Return defensive copy
    }

    /**
     * Jump back in time to a specific step index.
     */
    timeTravel(stepIndex: number): SimulationState {
        if (stepIndex < 0 || stepIndex >= this.state.history.length) {
            return this.getState();
        }

        const targetStateId = this.state.history[stepIndex];

        // Truncate history and log to this point
        // Or keep full history and just move pointer? 
        // For simple time travel, let's revert state.
        this.state = {
            activeStateId: targetStateId,
            steps: stepIndex,
            history: this.state.history.slice(0, stepIndex + 1),
            log: this.state.log.slice(0, stepIndex + 1),
        };
        this.state.log.push(`Time traveled to step ${stepIndex}`);

        return this.getState();
    }
}
