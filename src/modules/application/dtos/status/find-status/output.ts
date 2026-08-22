export interface DependencyOutput {
  name: string;
  state: 'up' | 'down';
  latencyMs: number | null;
  detail?: string;
}

export interface FindStatusResult {
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  status: 'ok' | 'degraded';
  dependencies: DependencyOutput[];
}
