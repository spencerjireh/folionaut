import { env } from '@/config/env'
import { logger } from '@/lib/logger'

let tracingInitialized = false

export async function initializeTracing(): Promise<void> {
  if (!env.OTEL_ENABLED || tracingInitialized) {
    return
  }

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } =
      await import('@opentelemetry/auto-instrumentations-node')
    const { resourceFromAttributes } = await import('@opentelemetry/resources')
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } =
      await import('@opentelemetry/semantic-conventions')

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'folionaut',
        [ATTR_SERVICE_VERSION]: '1.0.0',
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    })

    sdk.start()
    tracingInitialized = true
    logger.info('OpenTelemetry tracing initialized')

    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .catch((err) => logger.error({ error: err }, 'Failed to shutdown OpenTelemetry'))
    })
  } catch (error) {
    logger.warn({ error: (error as Error).message }, 'Failed to initialize OpenTelemetry tracing')
  }
}

export function isTracingEnabled(): boolean {
  return tracingInitialized
}
