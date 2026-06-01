/**
 * History visit annotation pipeline.
 *
 * Parallel to REXContentProcessorManager (in library.mts) but for typed
 * history visits, not generic string transforms.
 *
 * Annotators run in ascending priority() order — LOWER priority runs FIRST.
 * (This differs from REXContentProcessorManager, which runs higher priority
 * last via sort+reverse on padded numeric keys. Do not copy that pattern here.)
 *
 * Registry guarantees:
 *   - Every visit produces exactly one AnnotatedVisit. Annotators MAY NOT drop records.
 *   - Immutable fields (visitId, referringVisitId, historyItemId, visitTime,
 *     transitionType, isLocal) are restored after each annotator runs, so a
 *     misbehaving annotator cannot strip them.
 *   - An annotator throwing an exception does not corrupt the visit. The
 *     registry catches, logs (annotator name + visitId only — the URL may
 *     have been redacted by an earlier annotator), records an error
 *     AnnotationRecord, and continues with the prior visit state.
 */

export interface VisitInput {
  url: string
  title: string
  domain: string
  visitId: string
  referringVisitId: string
  historyItemId: string
  visitTime: number
  transitionType: string
  isLocal: boolean
}

export interface AnnotationRecord {
  annotator: string
  decision: 'pass' | 'redact'
  metadata: Record<string, unknown>
}

export interface AnnotatedVisit extends VisitInput {
  annotations: AnnotationRecord[]
}

export const REDACTION_SENTINELS = {
  NOT_ON_ALLOWLIST: 'CATEGORY:NOT_ON_ALLOWLIST',
  DOMAIN_ONLY: 'DOMAIN ONLY',
  CATEGORY_PREFIX: 'CATEGORY:',
} as const

export abstract class REXHistoryVisitAnnotator {
  abstract name(): string
  abstract priority(): number
  abstract annotate(visit: AnnotatedVisit): Promise<AnnotatedVisit>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  updateConfiguration(_config: any): void {
    // Default no-op; subclasses override as needed.
  }

  enable(): void {
    REXHistoryAnnotatorRegistry.getInstance().registerHistoryAnnotator(this)
  }

  disable(): void {
    REXHistoryAnnotatorRegistry.getInstance().unregisterHistoryAnnotator(this)
  }
}

type ImmutableKey =
  | 'visitId'
  | 'referringVisitId'
  | 'historyItemId'
  | 'visitTime'
  | 'transitionType'
  | 'isLocal'

type ImmutableSnapshot = Pick<VisitInput, ImmutableKey>

export class REXHistoryAnnotatorRegistry {
  private static instance: REXHistoryAnnotatorRegistry | null = null
  private annotators: REXHistoryVisitAnnotator[] = []

  public static getInstance(): REXHistoryAnnotatorRegistry {
    if (REXHistoryAnnotatorRegistry.instance === null) {
      REXHistoryAnnotatorRegistry.instance = new REXHistoryAnnotatorRegistry()
    }
    return REXHistoryAnnotatorRegistry.instance
  }

  /** Test-only: clear all registered annotators. Do not call in production code. */
  public static resetForTesting(): void {
    REXHistoryAnnotatorRegistry.instance = new REXHistoryAnnotatorRegistry()
  }

  registerHistoryAnnotator(annotator: REXHistoryVisitAnnotator): void {
    this.annotators = this.annotators.filter((a) => a.name() !== annotator.name())
    this.annotators.push(annotator)
    this.annotators.sort((a, b) => a.priority() - b.priority())
  }

  unregisterHistoryAnnotator(annotator: REXHistoryVisitAnnotator): void {
    this.annotators = this.annotators.filter((a) => a.name() !== annotator.name())
  }

  isEmpty(): boolean {
    return this.annotators.length === 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfiguration(config: any): void {
    for (const annotator of this.annotators) {
      try {
        annotator.updateConfiguration(config)
      } catch (error) {
        console.error(
          `[rex-content-processing] Annotator ${annotator.name()} updateConfiguration threw:`,
          error,
        )
      }
    }
  }

  async annotateVisit(visit: VisitInput): Promise<AnnotatedVisit> {
    const immutable: ImmutableSnapshot = {
      visitId: visit.visitId,
      referringVisitId: visit.referringVisitId,
      historyItemId: visit.historyItemId,
      visitTime: visit.visitTime,
      transitionType: visit.transitionType,
      isLocal: visit.isLocal,
    }

    let current: AnnotatedVisit = { ...visit, annotations: [] }

    for (const annotator of this.annotators) {
      try {
        const next = await annotator.annotate(current)
        current = { ...next, ...immutable }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(
          `[rex-content-processing] Annotator ${annotator.name()} threw for visit ${immutable.visitId}:`,
          error,
        )
        current = {
          ...current,
          ...immutable,
          annotations: [
            ...current.annotations,
            {
              annotator: annotator.name(),
              decision: 'pass',
              metadata: { error: message },
            },
          ],
        }
      }
    }

    return current
  }
}

export const historyAnnotatorRegistry = REXHistoryAnnotatorRegistry
