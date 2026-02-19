import { REXConfiguration } from '@bric/rex-core/extension'
import rexCorePlugin, { REXServiceWorkerModule, registerREXModule } from '@bric/rex-core/service-worker'
import { REXContentProcessorManager } from '@bric/rex-content-processing/library'

/*
 * This class primarily exists to sync remote configuration between the remote endpoint and the actual content processors.
 */
class REXContentProcessingModule extends REXServiceWorkerModule {
  constructor() {
    super()
  }

  moduleName() {
    return 'ContentProcessingModule'
  }

  setup() {
    this.refreshConfiguration()
  }

  refreshConfiguration() {
    rexCorePlugin.fetchConfiguration()
      .then((configuration:REXConfiguration) => {
        if (configuration !== undefined) {
          const contentConfig = configuration['content_processing']

          if (contentConfig !== undefined) {
            this.updateConfiguration(contentConfig)

            return
          }
        }

        setTimeout(() => {
          this.refreshConfiguration()
        }, 1000)
      })
  }

  updateConfiguration(config) {
    REXContentProcessorManager.getInstance().updateConfiguration(config)
  }

  handleMessage(message:any, sender:any, sendResponse:(response:any) => void):boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (message.messageType == 'processContent') {
      REXContentProcessorManager.getInstance().processContent(message.content)
        .then((content) => {
          sendResponse(content)
        })

      return true
    }

    return false
  }
}

const plugin = new REXContentProcessingModule()

registerREXModule(plugin)

export default plugin
