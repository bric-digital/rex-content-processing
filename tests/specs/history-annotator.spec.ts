// @ts-nocheck
import { test, expect } from './fixtures.js'

const SAMPLE_VISIT = {
  url: 'https://example.com/page',
  title: 'Example Page',
  domain: 'example.com',
  visitId: 'v-001',
  referringVisitId: '',
  historyItemId: 'h-001',
  visitTime: 1700000000000,
  transitionType: 'link',
  isLocal: true,
}

test.beforeEach(async ({ serviceWorker }) => {
  // Reset the singleton between tests so registrations from one test don't
  // leak into the next. This is test-only API on the registry class.
  await serviceWorker.evaluate(async () => {
    self.rexHistoryAnnotatorRegistry.resetForTesting()
  })
})

test('Empty registry: annotateVisit returns visit unchanged with empty annotations', async ({ serviceWorker }) => {
  const result = await serviceWorker.evaluate(async (visit) => {
    const registry = self.rexHistoryAnnotatorRegistry.getInstance()
    return registry.annotateVisit(visit)
  }, SAMPLE_VISIT)

  expect(result.url).toEqual('https://example.com/page')
  expect(result.title).toEqual('Example Page')
  expect(result.domain).toEqual('example.com')
  expect(result.visitId).toEqual('v-001')
  expect(result.visitTime).toEqual(1700000000000)
  expect(result.transitionType).toEqual('link')
  expect(result.isLocal).toEqual(true)
  expect(result.annotations).toEqual([])
})

test('Empty registry: isEmpty() returns true', async ({ serviceWorker }) => {
  const isEmpty = await serviceWorker.evaluate(() => {
    return self.rexHistoryAnnotatorRegistry.getInstance().isEmpty()
  })
  expect(isEmpty).toEqual(true)
})

test('Priority ordering: lower priority runs first', async ({ serviceWorker }) => {
  const result = await serviceWorker.evaluate(async (visit) => {
    class TagAnnotator extends self.REXHistoryVisitAnnotator {
      constructor(tagName, prio) {
        super()
        this._tagName = tagName
        this._prio = prio
      }
      name() { return this._tagName }
      priority() { return this._prio }
      async annotate(v) {
        return {
          ...v,
          annotations: [
            ...v.annotations,
            { annotator: this._tagName, decision: 'pass', metadata: {} },
          ],
        }
      }
    }

    // Register out of order to prove the registry sorts.
    new TagAnnotator('third', 30).enable()
    new TagAnnotator('first', 10).enable()
    new TagAnnotator('second', 20).enable()

    return self.rexHistoryAnnotatorRegistry.getInstance().annotateVisit(visit)
  }, SAMPLE_VISIT)

  expect(result.annotations.map((a) => a.annotator)).toEqual(['first', 'second', 'third'])
})

test('Immutable fields: registry restores them even when annotator strips them', async ({ serviceWorker }) => {
  const result = await serviceWorker.evaluate(async (visit) => {
    class EvilAnnotator extends self.REXHistoryVisitAnnotator {
      name() { return 'EvilAnnotator' }
      priority() { return 10 }
      async annotate(_v) {
        // Return an object missing every immutable field. The registry must
        // restore them from the snapshot taken before annotation began.
        return {
          url: 'CLOBBERED',
          title: 'CLOBBERED',
          domain: 'CLOBBERED',
          visitId: 'WRONG',
          referringVisitId: 'WRONG',
          historyItemId: 'WRONG',
          visitTime: 0,
          transitionType: 'WRONG',
          isLocal: false,
          annotations: [{ annotator: 'EvilAnnotator', decision: 'pass', metadata: {} }],
        }
      }
    }
    new EvilAnnotator().enable()
    return self.rexHistoryAnnotatorRegistry.getInstance().annotateVisit(visit)
  }, SAMPLE_VISIT)

  // Mutable fields: the annotator's value wins.
  expect(result.url).toEqual('CLOBBERED')
  expect(result.title).toEqual('CLOBBERED')
  expect(result.domain).toEqual('CLOBBERED')
  // Immutable fields: the registry restores them.
  expect(result.visitId).toEqual('v-001')
  expect(result.referringVisitId).toEqual('')
  expect(result.historyItemId).toEqual('h-001')
  expect(result.visitTime).toEqual(1700000000000)
  expect(result.transitionType).toEqual('link')
  expect(result.isLocal).toEqual(true)
  // The annotation record is preserved.
  expect(result.annotations).toHaveLength(1)
  expect(result.annotations[0].annotator).toEqual('EvilAnnotator')
})

test('Annotator throws: registry records error and continues with prior state', async ({ serviceWorker }) => {
  const result = await serviceWorker.evaluate(async (visit) => {
    class GoodAnnotator extends self.REXHistoryVisitAnnotator {
      name() { return 'GoodAnnotator' }
      priority() { return 10 }
      async annotate(v) {
        return {
          ...v,
          url: 'REDACTED_BY_GOOD',
          annotations: [
            ...v.annotations,
            { annotator: 'GoodAnnotator', decision: 'redact', metadata: { reason: 'first' } },
          ],
        }
      }
    }
    class ThrowingAnnotator extends self.REXHistoryVisitAnnotator {
      name() { return 'ThrowingAnnotator' }
      priority() { return 20 }
      async annotate(_v) {
        throw new Error('boom')
      }
    }
    class TailAnnotator extends self.REXHistoryVisitAnnotator {
      name() { return 'TailAnnotator' }
      priority() { return 30 }
      async annotate(v) {
        return {
          ...v,
          annotations: [
            ...v.annotations,
            { annotator: 'TailAnnotator', decision: 'pass', metadata: { saw_url: v.url } },
          ],
        }
      }
    }
    new GoodAnnotator().enable()
    new ThrowingAnnotator().enable()
    new TailAnnotator().enable()
    return self.rexHistoryAnnotatorRegistry.getInstance().annotateVisit(visit)
  }, SAMPLE_VISIT)

  // Good ran first, redacted url.
  expect(result.url).toEqual('REDACTED_BY_GOOD')
  // Three annotations: good, throwing (with error), tail.
  expect(result.annotations).toHaveLength(3)
  expect(result.annotations[0].annotator).toEqual('GoodAnnotator')
  expect(result.annotations[1].annotator).toEqual('ThrowingAnnotator')
  expect(result.annotations[1].decision).toEqual('pass')
  expect(result.annotations[1].metadata.error).toEqual('boom')
  expect(result.annotations[2].annotator).toEqual('TailAnnotator')
  // Tail saw the url that GoodAnnotator set, NOT a corrupted state.
  expect(result.annotations[2].metadata.saw_url).toEqual('REDACTED_BY_GOOD')
  // Immutable fields preserved through the chaos.
  expect(result.visitId).toEqual('v-001')
})

test('Re-registering same name() replaces the prior annotator', async ({ serviceWorker }) => {
  const result = await serviceWorker.evaluate(async (visit) => {
    class V1 extends self.REXHistoryVisitAnnotator {
      name() { return 'Versioned' }
      priority() { return 10 }
      async annotate(v) {
        return { ...v, annotations: [...v.annotations, { annotator: 'Versioned', decision: 'pass', metadata: { version: 1 } }] }
      }
    }
    class V2 extends self.REXHistoryVisitAnnotator {
      name() { return 'Versioned' }
      priority() { return 10 }
      async annotate(v) {
        return { ...v, annotations: [...v.annotations, { annotator: 'Versioned', decision: 'pass', metadata: { version: 2 } }] }
      }
    }
    new V1().enable()
    new V2().enable()
    return self.rexHistoryAnnotatorRegistry.getInstance().annotateVisit(visit)
  }, SAMPLE_VISIT)

  expect(result.annotations).toHaveLength(1)
  expect(result.annotations[0].metadata.version).toEqual(2)
})
