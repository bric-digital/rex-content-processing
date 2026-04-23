// @ts-nocheck

import rexCorePlugin from '@bric/rex-core/service-worker'

import contentProcessingPlugin from '@bric/rex-content-processing/service-worker'
import { REXContentProcessorManager } from '@bric/rex-content-processing/library'
import { REXOpenRedactionContentProcessor, REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON, REXRegexpContentProcessor, REXSanitizePIIContentProcessor } from '@bric/rex-content-processing/processors'

console.log(`Imported ${rexCorePlugin} into service worker context...`)
console.log(`Imported ${contentProcessingPlugin} into service worker context...`)

self['rexCorePlugin'] = rexCorePlugin
self['contentProcessingPlugin'] = contentProcessingPlugin

rexCorePlugin.setup()

self['regexpContentProcessor'] = new REXRegexpContentProcessor()
self['sanitizePiiContentProcessor'] = new REXSanitizePIIContentProcessor()

console.log(`Imported ${self['regexpContentProcessor']} into service worker context...`)
console.log(`Imported ${self['sanitizePiiContentProcessor']} into service worker context...`)

self['openRedactContentProcessor'] = new REXOpenRedactionContentProcessor()

// Updating here as the default config is a bit too chonky to include and sync with config.json.

self['openRedactContentProcessor'].updateConfiguration({
    'openRedaction': REX_OPEN_REDACTION_DEFAULT_CONFIGURATION_JSON
})

console.log(`Imported ${self['openRedactContentProcessor']} into service worker context...`)

REXContentProcessorManager.getInstance().registerProcessor(self['sanitizePiiContentProcessor'], 10)
REXContentProcessorManager.getInstance().registerProcessor(self['openRedactContentProcessor'], 5)
REXContentProcessorManager.getInstance().registerProcessor(self['regexpContentProcessor'], 0)
