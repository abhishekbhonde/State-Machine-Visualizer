import { parseMachine, ParserError } from "./parser";
import { analyzeGraph, type AnalysisResult } from "./analyzer";
import { SimulationEngine, type SimulationState } from "./simulation";
import { generateReport, type DiagnosticReport, formatParserError } from "./diagnostics";
import type { StateMachineGraph } from "./engine-types";

/**
 * StateMachineAPI
 * A unified facade for the State Machine Engine.
 * Designed to be used by React hooks or other UI components.
 */
export class StateMachineAPI {
    private graph: StateMachineGraph | null = null;
    private simulator: SimulationEngine | null = null;
    private lastAnalysis: AnalysisResult | null = null;
    private lastParserError: ParserError | null = null;

    /**
     * loadMachine
     * Parses the raw definition into an internal graph and initializes simulation.
     */
    loadMachine(definition: unknown): void {
        try {
            this.lastParserError = null;
            this.graph = parseMachine(definition);
            this.simulator = new SimulationEngine(this.graph);
            this.lastAnalysis = analyzeGraph(this.graph);
        } catch (error) {
            this.graph = null;
            this.simulator = null;
            this.lastAnalysis = null;
            if (error instanceof ParserError) {
                this.lastParserError = error;
            } else {
                this.lastParserError = new ParserError('INVALID_SCHEMA', (error as Error).message);
            }
            throw error;
        }
    }

    /**
     * analyzeMachine
     * Returns the raw graph analysis results (reachability, cycles, etc).
     */
    analyzeMachine(): AnalysisResult {
        if (!this.graph) {
            return {
                reachable: new Set(),
                orphans: new Set(),
                deadEnds: new Set(),
                cycles: [],
                nondeterministic: new Map()
            };
        }
        this.lastAnalysis = analyzeGraph(this.graph);
        return this.lastAnalysis;
    }

    /**
     * step
     * Advances the simulation by one event.
     */
    step(event: string): SimulationState {
        if (!this.simulator) {
            throw new Error("Machine not loaded. Call loadMachine first.");
        }
        return this.simulator.send(event);
    }

    /**
     * reset
     * Resets the simulation to the initial state.
     */
    reset(): SimulationState {
        if (!this.simulator) {
            throw new Error("Machine not loaded. Call loadMachine first.");
        }
        return this.simulator.reset();
    }

    /**
     * getDiagnostics
     * Returns a structured report of errors, warnings, and metrics.
     */
    getDiagnostics(): DiagnosticReport {
        if (this.lastParserError) {
            return formatParserError(this.lastParserError);
        }
        if (!this.graph || !this.lastAnalysis) {
            return {
                status: 'error',
                issues: [],
                summary: "No machine loaded",
                metrics: { totalStates: 0, totalTransitions: 0, cyclomaticComplexity: 0 }
            };
        }
        return generateReport(this.graph, this.lastAnalysis);
    }

    /**
     * Helpers for UI
     */
    getGraph() { return this.graph; }
    getSimulationState() { return this.simulator?.getState(); }
    getAvailableEvents() { return this.simulator?.getAvailableEvents() || []; }
}
