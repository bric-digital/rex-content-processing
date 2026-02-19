import corePlugin from '@bric/rex-core/service-worker'
import contentProcessingPlugin from '@bric/rex-content-processing/service-worker'

console.log(`Imported ${corePlugin} into service worker context...`)
console.log(`Imported ${contentProcessingPlugin} into service worker context...`)

corePlugin.setup()
