import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MachineDefinition, ParseResult } from '../lib/types';
import { getReachability } from '../lib/graphUtils';

interface StateMachineContextType {
  code: string;
  setCode: (code: string) => void;
  parsed: ParseResult;
  diagnostics: { unreachable: string[]; deadEnds: string[] };
  simulate: boolean;
  setSimulate: (sim: boolean) => void;
  activeState: string | null;
  setActiveState: (state: string | null) => void;
}

const DEFAULT_CODE = `{
  "initial": "idle",
  "states": {
    "idle": {
      "on": {
        "FETCH": "loading"
      }
    },
    "loading": {
      "on": {
        "RESOLVE": "success",
        "REJECT": "failure"
      }
    },
    "success": {
      "type": "final"
    },
    "failure": {
      "on": {
        "RETRY": "loading"
      }
    }
  }
}`;

const StateMachineContext = createContext<StateMachineContextType | undefined>(undefined);

export const StateMachineProvider = ({ children }: { children: React.ReactNode }) => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [parsed, setParsed] = useState<ParseResult>({ machine: null, error: null });
  const [diagnostics, setDiagnostics] = useState<{ unreachable: string[]; deadEnds: string[] }>({ unreachable: [], deadEnds: [] });
  const [simulate, setSimulate] = useState(false);
  const [activeState, setActiveState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const machine = JSON.parse(code) as MachineDefinition;
      // Basic validation
      if (!machine.initial || !machine.states) {
        throw new Error("Invalid format: Missing 'initial' or 'states' property.");
      }
      setParsed({ machine, error: null });

      // Calculate Diagnostics
      const { reachable, deadEnds } = getReachability(machine);
      const allStates = Object.keys(machine.states);
      const unreachable = allStates.filter(s => !reachable.has(s));
      setDiagnostics({ unreachable, deadEnds: Array.from(deadEnds) });

      // Reset active state if editing
      if (!simulate) {
        setActiveState(machine.initial);
      }
    } catch (e) {
      setParsed({ machine: null, error: (e as Error).message });
      setDiagnostics({ unreachable: [], deadEnds: [] });
    }
  }, [code, simulate]);

  useEffect(() => {
    if (parsed.machine && (activeState === null || !parsed.machine.states[activeState])) {
      setActiveState(parsed.machine.initial);
    }
  }, [parsed.machine]);

  return (
    <StateMachineContext.Provider value={{ code, setCode, parsed, diagnostics, simulate, setSimulate, activeState, setActiveState }}>
      {children}
    </StateMachineContext.Provider>
  );
};

export const useStateMachine = () => {
  const context = useContext(StateMachineContext);
  if (!context) {
    throw new Error('useStateMachine must be used within a StateMachineProvider');
  }
  return context;
};
