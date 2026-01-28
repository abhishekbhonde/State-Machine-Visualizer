import { StateMachineGraph, StateID } from "./engine-types";
import { AnalysisResult } from "./analyzer";
import { ParserError } from "./parser";

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticIssue {
    code: string;
    severity: DiagnosticSeverity;
    message: string;
    path?: string[]; // JSON path for UI highlighting
    relatedIds?: string[]; // Graph node IDs involved
}

export interface DiagnosticReport {
    status: 'valid' | 'warning' | 'error';
    issues: DiagnosticIssue[];
    summary: string;
    metrics: {
        totalStates: number;
        totalTransitions: number;
        cyclomaticComplexity: number; // Simple count of cycles for now
    };
}

/**
 * Generates a structured diagnostic report from analysis results.
 */
export const generateReport = (
    graph: StateMachineGraph,
    analysis: AnalysisResult
): DiagnosticReport => {
    const issues: DiagnosticIssue[] = [];

    // 1. Unreachable States (Orphans)
    analysis.orphans.forEach(id => {
        issues.push({
            code: 'UNREACHABLE_STATE',
            severity: 'warning',
            message: `State '${id}' is not reachable from the initial state.`,
            relatedIds: [id],
            path: ['states', id]
        });
    });

    // 2. Dead Ends
    analysis.deadEnds.forEach(id => {
        issues.push({
            code: 'DEAD_END',
            severity: 'warning',
            message: `State '${id}' is a dead end (not final, no transitions).`,
            relatedIds: [id],
            path: ['states', id]
        });
    });

    // 3. Cycles
    analysis.cycles.forEach(cycle => {
        const cyclePath = Array.from(cycle).join(' -> ');
        issues.push({
            code: 'CYCLE_DETECTED',
            severity: 'info',
            message: `Cycle detected: ${cyclePath}`,
            relatedIds: Array.from(cycle)
        });
    });

    // Metrics
    let transitionCount = 0;
    for (const node of graph.nodes.values()) {
        transitionCount += node.outgoing.length;
    }

    // Determine status
    const hasError = issues.some(i => i.severity === 'error');
    const hasWarning = issues.some(i => i.severity === 'warning');
    const status = hasError ? 'error' : (hasWarning ? 'warning' : 'valid');

    // Generate Summary
    const summaryLines = [
        `Analysis Complete: ${status.toUpperCase()}`,
        `Found ${issues.length} issues.`
    ];
    if (analysis.orphans.size > 0) summaryLines.push(`- ${analysis.orphans.size} unreachable states.`);
    if (analysis.deadEnds.size > 0) summaryLines.push(`- ${analysis.deadEnds.size} dead-end states.`);
    if (analysis.cycles.length > 0) summaryLines.push(`- ${analysis.cycles.length} cycles detected.`);

    return {
        status,
        issues,
        summary: summaryLines.join('\n'),
        metrics: {
            totalStates: graph.nodes.size,
            totalTransitions: transitionCount,
            cyclomaticComplexity: analysis.cycles.length
        }
    };
};

/**
 * Helper to convert a ParserError into a Report format
 */
export const formatParserError = (error: ParserError): DiagnosticReport => {
    return {
        status: 'error',
        issues: [{
            code: error.code,
            severity: 'error',
            message: error.message,
            path: error.path
        }],
        summary: `Fatal Error: ${error.message}`,
        metrics: {
            totalStates: 0,
            totalTransitions: 0,
            cyclomaticComplexity: 0
        }
    };
};
