/**
 * Engine Internal Data Structures
 * -------------------------------
 * These types represent the normalized, processed state of the machine.
 * Unlike the Input Schema, these structures are optimized for:
 * 1. O(1) Lookups (Maps instead of Objects)
 * 2. Graph Traversal (Explicit adjacency lists)
 * 3. Type Safety (No union types for transitions)
 */

export type StateID = string;
export type EventName = string;

/**
 * 1. Transition Representation
 * Normalized transition object.
 * - 'event' is explicitly included.
 * - 'actions' is always an array (never undefined).
 * - 'source' is included for reverse-lookup convenience.
 */
export interface InternalTransition {
    source: StateID;
    target: StateID;
    event: EventName;
    cond?: string;      // Guard condition ID
    actions: string[];  // Side-effects
}

/**
 * 2. State Representation
 * Normalized state node.
 * - 'transitions' allows O(1) lookup by event.
 * - 'outgoing' allows fast iteration for graph drawing.
 */
export interface InternalStateNode {
    id: StateID;
    type: 'initial' | 'final' | 'default';

    // O(1) Lookup: "What happens on event X?"
    transitions: Map<EventName, InternalTransition>;

    // Adjacency List: "Where can I go from here?"
    outgoing: InternalTransition[];

    meta: Record<string, any>;
}

/**
 * 3. Graph Representation (Adjacency List + Index)
 * The core engine data structure.
 */
export interface StateMachineGraph {
    id: string;
    initial: StateID;

    // The master index of all nodes
    nodes: Map<StateID, InternalStateNode>;
}

/**
 * 4. Metadata & Analysis
 * Results of static analysis algorithms (BFS/DFS).
 */
export interface GraphAnalysis {
    isValid: boolean;
    errors: string[];

    // Reachability
    reachable: Set<StateID>;    // States reachable from initial
    orphans: Set<StateID>;      // States defined but unreachable

    // Termination properties
    terminal: Set<StateID>;     // States marked type: 'final'
    deadEnds: Set<StateID>;     // States that are NOT final but have NO outgoing transitions

    // Graph properties
    hasCycles: boolean;         // True if the graph contains loops
}
