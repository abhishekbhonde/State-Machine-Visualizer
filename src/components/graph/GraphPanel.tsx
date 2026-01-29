import { Background, Controls, ReactFlow, useEdgesState, useNodesState, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';
import { useStateMachine } from '../../context/StateMachineContext';
import { parseMachineToGraph } from '../../lib/graphUtils';
import { cn } from "../../lib/utils";

export const GraphPanel = () => {
    const { parsed, activeState, simulate, setSimulate, setActiveState } = useStateMachine();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (parsed.machine) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = parseMachineToGraph(parsed.machine, activeState);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        }
    }, [parsed.machine, activeState, setNodes, setEdges]); // Rerender when machine or activeState changes


    const onEdgeClick = (_: React.MouseEvent, edge: any) => {
        if (simulate && parsed.machine && activeState) {
            const currentStateDef = parsed.machine.states[activeState];
            // Find if this edge corresponds to a valid transition from activeState
            if (edge.source === activeState) {
                // Check which event this is
                // Edge label is the event
                const event = edge.label as string;
                // Verify transition
                if (currentStateDef.on) {
                    const targetDef = currentStateDef.on[event];
                    const target = typeof targetDef === 'string' ? targetDef : targetDef.target;
                    if (target === edge.target) {
                        setActiveState(target);
                    }
                }
            }
        }
    }

    return (
        <div className={cn("h-full w-full bg-black relative overflow-hidden")}>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => {
                        setSimulate(!simulate);
                        // Reset to initial if starting simulation?
                        if (!simulate && parsed.machine) {
                            setActiveState(parsed.machine.initial);
                        }
                    }}
                    className={cn(
                        "px-3 py-1.5 rounded text-xs transition-colors border font-medium",
                        simulate
                            ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20"
                            : "bg-primary/10 text-primary border-primary/50 hover:bg-primary/20"
                    )}
                >
                    {simulate ? 'Stop Simulation' : 'Simulate'}
                </button>
            </div>

            {/* Simulation Controls Overlay */}
            {simulate && activeState && parsed.machine && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest bg-black/80 px-2 py-1 rounded">Available Events</div>
                    <div className="flex gap-2">
                        {parsed.machine.states[activeState]?.on ? (
                            Object.keys(parsed.machine.states[activeState].on!).map(event => (
                                <button
                                    key={event}
                                    onClick={() => {
                                        const targetDef = parsed.machine!.states[activeState!].on![event];
                                        const target = typeof targetDef === 'string' ? targetDef : targetDef.target;
                                        setActiveState(target);
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded shadow-lg border border-zinc-700 transition-all hover:border-primary hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                >
                                    {event}
                                </button>
                            ))
                        ) : (
                            <div className="text-xs text-zinc-600 italic px-3 py-1 bg-zinc-900 rounded">No outgoing events (Final)</div>
                        )}
                    </div>
                </div>
            )}

            {!parsed.machine && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                    Invalid Configuration
                </div>
            )}

            <div className="h-full w-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onEdgeClick={onEdgeClick}
                    colorMode="dark"
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="#27272a" gap={20} size={1} />
                    <Controls className="!bg-zinc-800 !border-zinc-700 !fill-zinc-400" />
                </ReactFlow>
            </div>
        </div>
    );
};
