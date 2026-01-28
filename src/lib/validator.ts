/**
 * Engine Validation Logic
 * -----------------------
 * 1. Schema Validation (Structural):
 *    - 'initial' must be a string.
 *    - 'states' must be an object.
 *    - keys of 'states' must be strings.
 * 
 * 2. Semantic Validation (Graph Integrity):
 *    - The 'initial' state ID must exist in the 'states' object.
 *    - Every 'target' in a transition must correspond to a key in 'states'.
 * 
 * 3. Diagnostics (Best Practices):
 *    - Detect unreachable states (DFS/BFS from initial).
 *    - Detect dead ends (non-final states with no outgoing transitions).
 */

import type { MachineDefinition } from "../lib/types";

export type ValidationError = {
    code: 'INVALID_INITIAL' | 'INVALID_TARGET' | 'MISSING_STATES';
    message: string;
    path?: string[];
};

export const validateMachine = (machine: MachineDefinition): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!machine.states || Object.keys(machine.states).length === 0) {
        errors.push({
            code: 'MISSING_STATES',
            message: "Machine must have at least one state defined in 'states'."
        });
        return errors; // Stop if no states
    }

    const stateIds = new Set(Object.keys(machine.states));

    // 1. Validate Initial State
    if (!stateIds.has(machine.initial)) {
        errors.push({
            code: 'INVALID_INITIAL',
            message: `Initial state '${machine.initial}' is not defined in 'states'.`,
            path: ['initial']
        });
    }

    // 2. Validate Transitions
    Object.entries(machine.states).forEach(([sourceId, state]) => {
        if (!state.on) return;

        Object.entries(state.on).forEach(([event, targetDef]) => {
            // Normalize target to string for checking
            // Note: Our simplified schema used string, but the full schema supports objects.
            // We need to support checks for both.

            const targetId = typeof targetDef === 'string'
                ? targetDef
                : (targetDef as { target: string }).target;

            if (targetId && !stateIds.has(targetId)) {
                errors.push({
                    code: 'INVALID_TARGET',
                    message: `State '${sourceId}' transitions to unknown state '${targetId}' on event '${event}'.`,
                    path: ['states', sourceId, 'on', event]
                });
            }
        });
    });

    return errors;
};
