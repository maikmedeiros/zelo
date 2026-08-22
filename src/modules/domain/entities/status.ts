export type DependencyState = 'up' | 'down';

export interface DependencyStatus {
  name: string;
  state: DependencyState;
  latencyMs: number | null;
  detail?: string;
}

export interface ServiceStatus {
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  dependencies: DependencyStatus[];
}
