export type TransitionConfig = {
    target: string;
    cond?: string;
    actions?: string[];
};

export type StateDefinition = {
    on?: {
        [event: string]: string | TransitionConfig;
    };
    type?: 'initial' | 'final' | 'default';
    meta?: Record<string, any>;
};

export type MachineDefinition = {
    initial: string;
    states: {
        [key: string]: StateDefinition;
    };
};

export type ParseResult = {
    machine: MachineDefinition | null;
    error: string | null;
};
