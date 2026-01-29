import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { EditorPanel } from "./components/editor/EditorPanel";
import { GraphPanel } from "./components/graph/GraphPanel";
import { StateMachineProvider } from "./context/StateMachineContext";

function App() {
  return (
    <StateMachineProvider>
      <div className="h-screen w-screen bg-background text-zinc-100 flex flex-col">
        <header className="h-14 border-b border-zinc-800 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
            <h1 className="font-bold tracking-tight text-lg">StateFlow</h1>
          </div>
          <div className="flex gap-4 text-sm text-zinc-400">
            <button className="hover:text-white transition-colors">Docs</button>
            <button className="hover:text-white transition-colors">Export</button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={30} minSize={20}>
              <EditorPanel />
            </Panel>
            <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-primary transition-colors" />
            <Panel defaultSize={70} minSize={20}>
              <GraphPanel />
            </Panel>
          </PanelGroup>
        </main>
      </div>
    </StateMachineProvider>
  );
}

export default App;
