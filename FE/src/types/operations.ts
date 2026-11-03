export interface TimingSnapshot {
  name: string;
  count: number;
  errors: number;
  limited: number;
  averageMs: number;
  p95UpperBoundMs: number;
  maxMs: number;
}
export interface Operations {
  databaseReady: boolean;
  databaseProbeMs: number;
  runtime: {
    instanceId: string;
    startedAt: string;
    activeRequests: number;
    requests: TimingSnapshot[];
    database: TimingSnapshot;
    clientPlaybackFailures: Record<string, number>;
    cleanup: {
      lastRunAt: string | null;
      lastSuccessAt: string | null;
      removed: number;
      errorType: string | null;
    };
  };
}
