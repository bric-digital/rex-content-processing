import { test, expect } from '@playwright/test';
import { REXContentProcessorManager } from '@bric/rex-content-processing/library'
import { REXOpenRedactionContentProcessor } from '@bric/rex-content-processing/processors'
import {
  addressCases,
  bankCases,
  cardCases,
  emailCases,
  governmentIdCases,
  phoneCases
} from './openredaction-cases.js';
import {
  applyOpenRedactionTestConfiguration,
  assertOpenRedactionCases
} from './openredaction-test-utils.js';

test.describe('REX OpenRedaction Content Processor', () => {
  test('OpenRedaction Content Processor redacts sensitive values', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      const input = { 'test*': 'Contact me at jane.doe@example.org or 555-666-9999.' }
      const processed = await REXContentProcessorManager.getInstance().processContent(input)

      expect(processed).not.toEqual(input)
      expect(processed['test*']).not.toContain('jane.doe@example.org')
      expect(processed['test*']).not.toContain('555-666-9999')
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor updates configuration and handles invalid config', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      openRedactionProcessor.updateConfiguration({
        openRedaction: JSON.stringify({
          version: '1.0',
          timestamp: '2026-02-24T00:00:00.000Z',
          options: {
            includeEmails: false,
            includePhones: false,
            includeNames: false,
            includeAddresses: false
          }
        })
      })

      const emailOnly = 'Contact me at jane.doe@gmail.com.'
      const redactionDisabled = await openRedactionProcessor.processString(emailOnly)
      expect(redactionDisabled).toEqual(emailOnly)

      expect(() => {
        openRedactionProcessor.updateConfiguration({
          openRedaction: 'not-valid-json'
        })
      }).toThrow('Unable to parse string into JSON configuration for OpenRedaction, configuration not updated.')
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction empty JSON update removes default redaction behavior', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      const unicodePhone = '555–123–4567.'

      const redactedWithDefault = await openRedactionProcessor.processString(unicodePhone)
      expect(redactedWithDefault).not.toEqual(unicodePhone)
      expect(redactedWithDefault).toContain('[PHONE_US_')

      openRedactionProcessor.updateConfiguration({
        openRedaction: '{}'
      })

      const redactedWithEmptyConfig = await openRedactionProcessor.processString(unicodePhone)
      expect(redactedWithEmptyConfig).toEqual(unicodePhone)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - phones', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, phoneCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - emails', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, emailCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - cards', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, cardCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - government IDs', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, governmentIdCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - addresses', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, addressCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction Content Processor default behavior - banking', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      await assertOpenRedactionCases(openRedactionProcessor, bankCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - phones', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, phoneCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - emails', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, emailCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - cards', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, cardCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - government IDs', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, governmentIdCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - addresses', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, addressCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });

  test('OpenRedaction configured behavior - banking', async ({ page }) => {
    const openRedactionProcessor = new REXOpenRedactionContentProcessor()
    openRedactionProcessor.enable()

    try {
      applyOpenRedactionTestConfiguration(openRedactionProcessor)
      await assertOpenRedactionCases(openRedactionProcessor, bankCases)
    } finally {
      openRedactionProcessor.disable()
    }
  });
});
