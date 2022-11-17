interface Stat {
    name: string;
    description?: string;
    num?: number;
    patternDescription?: string;
    additionalData?: string;
}
export declare class DiagnosticsService {
    outputDst: string;
    private static instance?;
    stats: Record<string, Stat>;
    private constructor();
    static getInstance(outputDst?: string): DiagnosticsService;
    addStat(stat: Stat): void;
    updateStat(name: string, data: Partial<Stat>): void;
    incrementStat(name: string, increment?: number): void;
    writeAllStats(): void;
}
export {};
