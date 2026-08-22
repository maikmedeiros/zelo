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
  /** `degraded` quando qualquer dependência está fora — o controller traduz em 503. */
  status: 'ok' | 'degraded';
  dependencies: DependencyOutput[];
}
