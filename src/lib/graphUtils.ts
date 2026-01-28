import { type Node, type Edge, Position } from '@xyflow/react';
import dagre from 'dagre';
import type { MachineDefinition } from './types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

export const getReachability = (machine: MachineDefinition) => {
    if (!machine || !machine.states) {
        return { reachable: new Set<string>(), deadEnds: new Set<string>() };
    }

    const reachable = new Set<string>();
    const deadEnds = new Set<string>();
    const queue = [machine.initial];
    reachable.add(machine.initial);

    // BFS for reachability
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const state = machine.states[currentId];
        if (state && state.on) {
            Object.values(state.on).forEach(target => {
                if (!reachable.has(target) && machine.states[target]) {
                    reachable.add(target);
                    queue.push(target);
                }
            });
        }
    }

    // Identify dead ends (reachable states with no outgoing transitions that aren't final)
    Object.entries(machine.states).forEach(([id, state]) => {
        if (reachable.has(id)) {
            if (state.type !== 'final' && (!state.on || Object.keys(state.on).length === 0)) {
                deadEnds.add(id);
            }
        }
    });

    return { reachable, deadEnds };
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'LR' }); // Left to Right layout

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
        };
    });

    return { nodes: newNodes, edges };
};

export const parseMachineToGraph = (machine: MachineDefinition, activeState: string | null) => {
    if (!machine || !machine.states) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const { reachable, deadEnds } = getReachability(machine);

    // 2. Build Graph Elements
    Object.entries(machine.states).forEach(([id, state]) => {
        // Determine node properties
        const isInitial = id === machine.initial;
        const isFinal = state.type === 'final';
        const isActive = id === activeState;
        const isReachable = reachable.has(id);
        const isDeadEnd = deadEnds.has(id);

        nodes.push({
            id,
            data: { label: id, isInitial, isFinal, isActive },
            position: { x: 0, y: 0 },
            type: 'default',
            style: {
                background: isActive ? 'rgba(34, 211, 238, 0.1)' : '#0a0a0a',
                color: !isReachable ? '#52525b' : (isActive ? '#fff' : '#e4e4e7'), // Dim if unreachable
                border: isActive
                    ? '1px solid #22d3ee'
                    : (isReachable ? (isDeadEnd ? '1px dashed #ef4444' : '1px solid #3f3f46') : '1px dashed #3f3f46'),
                borderRadius: '8px',
                padding: '10px',
                width: NODE_WIDTH,
                boxShadow: isActive ? '0 0 15px rgba(34, 211, 238, 0.3)' : 'none',
                opacity: isReachable ? 1 : 0.5,
                transition: 'all 0.3s ease',
            },
        });

        if (state.on) {
            Object.entries(state.on).forEach(([event, target]) => {
                edges.push({
                    id: `${id}-${event}-${target}`,
                    source: id,
                    target,
                    label: event,
                    type: 'smoothstep',
                    style: {
                        stroke: isActive ? '#22d3ee' : (isReachable ? '#52525b' : '#3f3f46'),
                        strokeDasharray: isReachable ? 'none' : '5,5',
                    },
                    labelStyle: { fill: isActive ? '#22d3ee' : '#71717a', fontWeight: 500, fontSize: 12 },
                    markerEnd: { type: 'arrowclosed' as any, color: isActive ? '#22d3ee' : '#52525b' },
                });
            });
        }
    });

    return getLayoutedElements(nodes, edges);
};
