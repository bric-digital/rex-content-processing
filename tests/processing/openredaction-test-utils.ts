import { expect } from '@playwright/test';
import {
  REXOpenRedactionContentProcessor,
  REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON
} from '@bric/rex-content-processing/processors'
import { OpenRedactionCase } from './openredaction-cases.js';

export async function assertOpenRedactionCases(
  openRedactionProcessor: REXOpenRedactionContentProcessor,
  cases: OpenRedactionCase[]
) {
  const failures:string[] = []

  for (const testCase of cases) {
    const redacted = await openRedactionProcessor.processString(testCase.input)
    if (testCase.expected !== undefined) {
      if (redacted !== testCase.expected) {
        failures.push(
          `Input: ${JSON.stringify(testCase.input)}\nExpected: ${JSON.stringify(testCase.expected)}\nActual: ${JSON.stringify(redacted)}`
        )
      }
    }
    if (testCase.expectedPattern !== undefined) {
      if (!testCase.expectedPattern.test(redacted)) {
        failures.push(
          `Input: ${JSON.stringify(testCase.input)}\nExpected pattern: ${testCase.expectedPattern.toString()}\nActual: ${JSON.stringify(redacted)}`
        )
      }
    }
  }

  expect(
    failures,
    failures.length > 0 ? `OpenRedaction behavior mismatches:\n\n${failures.join('\n\n')}` : ''
  ).toEqual([])
}

export function applyOpenRedactionTestConfiguration(openRedactionProcessor:REXOpenRedactionContentProcessor) {
  openRedactionProcessor.updateConfiguration({
    openRedaction: REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON
  })
}
