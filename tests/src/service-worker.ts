// @ts-nocheck

import rexCorePlugin from '@bric/rex-core/service-worker'

import contentProcessingPlugin from '@bric/rex-content-processing/service-worker'
import { REXContentProcessorManager } from '@bric/rex-content-processing/library'
import { REXRegexpContentProcessor, REXSanitizePIIContentProcessor } from '@bric/rex-content-processing/processors'

console.log(`Imported ${rexCorePlugin} into service worker context...`)
console.log(`Imported ${contentProcessingPlugin} into service worker context...`)

self['rexCorePlugin'] = rexCorePlugin
self['contentProcessingPlugin'] = contentProcessingPlugin

rexCorePlugin.setup()

self['regexpContentProcessor'] = new REXRegexpContentProcessor()
self['sanitizePiiContentProcessor'] = new REXSanitizePIIContentProcessor()

console.log(`Imported ${self['regexpContentProcessor']} into service worker context...`)
console.log(`Imported ${self['sanitizePiiContentProcessor']} into service worker context...`)

REXContentProcessorManager.getInstance().registerProcessor(self['sanitizePiiContentProcessor'], 10)
REXContentProcessorManager.getInstance().registerProcessor(self['regexpContentProcessor'], 0)
