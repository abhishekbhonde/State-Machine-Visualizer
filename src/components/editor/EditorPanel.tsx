import Editor from "@monaco-editor/react";
import { cn } from "../../lib/utils";
import { useStateMachine } from "../../context/StateMachineContext";

export const EditorPanel = () => {
    const { code, setCode, parsed, simulate, diagnostics } = useStateMachine();

    return (
        <div className={cn("h-full w-full bg-grid-pattern p-0 flex flex-col border-r border-zinc-900", simulate && "opacity-50 pointer-events-none grayscale")}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Definition</h2>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">JSON</span>
                </div>
                {simulate && (
                    <span className="text-xs text-primary flex items-center gap-1">
                        🔒 Locked (Simulating)
                    </span>
                )}
                {!simulate && (
                    <div className="flex gap-4">
                        {diagnostics.unreachable.length > 0 && (
                            <span className="text-[10px] text-yellow-500 flex items-center gap-1" title={`Unreachable: ${diagnostics.unreachable.join(', ')}`}>
                                ⚠️ {diagnostics.unreachable.length} Unreachable
                            </span>
                        )}
                        {diagnostics.deadEnds.length > 0 && (
                            <span className="text-[10px] text-orange-500 flex items-center gap-1" title={`Dead Ends: ${diagnostics.deadEnds.join(', ')}`}>
                                🛑 {diagnostics.deadEnds.length} Dead End
                            </span>
                        )}
                    </div>
                )}
                {parsed.error && !simulate && (
                    <span className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
                        ● Error
                    </span>
                )}
            </div>
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => !simulate && setCode(val || "")}
                    options={{
                        readOnly: simulate,
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                    }}
                    onMount={(_, monaco) => {
                        // Custom theme definition matching our Noir aesthetic
                        monaco.editor.defineTheme('noir-theme', {
                            base: 'vs-dark',
                            inherit: true,
                            rules: [],
                            colors: {
                                'editor.background': '#050505',
                                'editor.lineHighlightBackground': '#101010',
                            }
                        });
                        monaco.editor.setTheme('noir-theme');
                    }}
                />

                {parsed.error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-900/10 border border-red-900/50 p-3 rounded text-xs text-red-400 font-mono z-50">
                        {parsed.error}
                    </div>
                )}
            </div>
        </div>
    );
};
