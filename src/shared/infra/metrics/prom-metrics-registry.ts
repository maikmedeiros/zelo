import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

export class PromMetricsRegistry {
  readonly registry = new Registry();
  readonly httpRequestDuration: Histogram<'method' | 'route' | 'status_code'>;

  constructor(appName: string) {
    this.registry.setDefaultLabels({ app: appName });
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  observeHttpRequest(labels: {
    method: string;
    route: string;
    statusCode: number;
    durationSeconds: number;
  }): void {
    this.httpRequestDuration.observe(
      { method: labels.method, route: labels.route, status_code: labels.statusCode },
      labels.durationSeconds,
    );
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
