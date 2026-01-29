import type { MachineDefinition, TransitionConfig } from './types';
import type {
    StateMachineGraph,
    InternalStateNode,
    InternalTransition,
    StateID
} from './engine-types';

// Structured Error Types
export class ParserError extends Error {
    public code: 'INVALID_SCHEMA' | 'INVALID_REFERENCE' | 'MISSING_INITIAL';
    public details: string;
    public path?: string[];

    constructor(
        code: 'INVALID_SCHEMA' | 'INVALID_REFERENCE' | 'MISSING_INITIAL',
        details: string,
        path?: string[]
    ) {
        super(details);
        this.name = 'ParserError';
        this.code = code;
        this.details = details;
        this.path = path;
    }
}

/**
 * Normalizes a transition definition (string | object) into a strict config object.
 */
const normalizeTransition = (
    targetDef: string | TransitionConfig,
    sourceId: StateID,
    event: string
): InternalTransition => {
    if (typeof targetDef === 'string') {
        return {
            source: sourceId,
            target: targetDef,
            event,
            actions: []
        };
    }
    return {
        source: sourceId,
        target: targetDef.target,
        event,
        cond: targetDef.cond,
        actions: targetDef.actions || []
    };
};

/**
 * Parses raw JSON input into the Engine's Internal Graph representation.
 * Performs validation during the build process.
 */
export const parseMachine = (input: unknown): StateMachineGraph => {
    // 1. Basic Schema Validation (Runtime check)
    // In a real app, use Zod or Ajv here. usage: `UserSchema.parse(input)`
    // We'll do manual checks for now to keep deps low.
    const machine = input as MachineDefinition;

    if (!machine || typeof machine !== 'object') {
        throw new ParserError('INVALID_SCHEMA', 'Input must be an object.');
    }
    if (typeof machine.initial !== 'string') {
        throw new ParserError('MISSING_INITIAL', "Machine must define an 'initial' state ID.");
    }
    if (!machine.states || typeof machine.states !== 'object') {
        throw new ParserError('INVALID_SCHEMA', "Machine must define a 'states' object.");
    }

    const graph: StateMachineGraph = {
        id: (machine as any).id || 'crypto-machine', // fallback ID
        initial: machine.initial,
        nodes: new Map()
    };

    // 2. First Pass: Create Nodes (Vertices)
    // We do this first to ensure all IDs exist before linking edges
    for (const [id, def] of Object.entries(machine.states)) {
        const node: InternalStateNode = {
            id,
            type: def.type || 'default',
            meta: def.meta || {},
            transitions: new Map(),
            outgoing: []
        };
        graph.nodes.set(id, node);
    }

    // 3. Validation: Initial State Existence
    if (!graph.nodes.has(graph.initial)) {
        throw new ParserError(
            'INVALID_REFERENCE',
            `Initial state '${graph.initial}' is not defined in 'states'.`,
            ['initial']
        );
    }

    // 4. Second Pass: Build Edges (Adjacency List)
    for (const [id, def] of Object.entries(machine.states)) {
        const sourceNode = graph.nodes.get(id)!;

        if (def.on) {
            for (const [event, targetDef] of Object.entries(def.on)) {

                // Normalize
                const transition = normalizeTransition(targetDef, id, event);

                // Validation: Target Existence
                if (!graph.nodes.has(transition.target)) {
                    throw new ParserError(
                        'INVALID_REFERENCE',
                        `State '${id}' transitions to unknown target '${transition.target}' on event '${event}'.`,
                        ['states', id, 'on', event]
                    );
                }

                // Add to Node
                sourceNode.transitions.set(event, transition);
                sourceNode.outgoing.push(transition);
            }
        }
    }

    return graph;
};
