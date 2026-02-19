import check from 'check-types'

export class REXContentProcessor {
  updateConfiguration(config) { // eslint-disable-line @typescript-eslint/no-unused-vars

  }

  processString(content:string):Promise<string> {
    return new Promise((resolve) => {
      resolve(content)
    })
  }

  name(): string {
    return 'REXContentProcessor'
  }

  enable(priority:number = 0) {
    REXContentProcessorManager.getInstance().registerProcessor(this, priority)
  }

  disable() {
    REXContentProcessorManager.getInstance().unregisterProcessor(this)
  }
}

export class REXContentProcessorManager {
  static instance:REXContentProcessorManager|null = null

  processorKeys:string[] = []
  processors = {}

  constructor() {
    if (REXContentProcessorManager.instance !== null) {
      return REXContentProcessorManager.instance;
    }

    REXContentProcessorManager.instance = this;

    return this;
  }

  public static getInstance():REXContentProcessorManager {
    if (REXContentProcessorManager.instance === null) {
      REXContentProcessorManager.instance = new REXContentProcessorManager()
    }

    return REXContentProcessorManager.instance;
  }

  updateConfiguration(config) {
    for (const key of this.processorKeys) {
      const processor:REXContentProcessor = this.processors[key]

      processor.updateConfiguration(config)
    }
  }

  processItem(item, processor, force:boolean = false):Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    return new Promise((resolve) => {
      if (check.string(item) && force) {
        processor.processString(item)
        .then((result) => {
          resolve(result)
        })
      } else if (check.array(item)) {
        const toUpdate = [... item]

        const updated = []

        const processNextChild = () => {
          if (toUpdate.length === 0) {
            resolve(updated)
          } else {
            const nextItem = toUpdate.shift()

            this.processItem(nextItem, processor, force)
              .then((updatedItem) => {
                updated.push(updatedItem)

                processNextChild()
              })
          }
        }

        processNextChild()
      } else if (check.object(item)) {
        const toUpdate = {}

        const keys = [... Object.keys(item)]

        const processNextKey = () => {
          if (keys.length === 0) {
            resolve(toUpdate)
          } else {
            const nextKey = keys.shift()

            const value = item[nextKey]

            if (nextKey.endsWith('*')) {
              force = true
            }

            this.processItem(value, processor, force)
              .then((updatedItem) => {
                toUpdate[nextKey] = updatedItem

                processNextKey()
              })
          }
        }

        processNextKey()
      } else {
        resolve(item)
      }
    })
  }

  processContent(content):Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    return new Promise((resolve) => {
      const pending:REXContentProcessor[] = []

      for (const key of this.processorKeys) {
        pending.push(this.processors[key])
      }

      let inProgress = content

      const nextPending = () => {
        if (pending.length === 0) {
          resolve(inProgress)
        } else {
          const processor = pending.shift()

          this.processItem(inProgress, processor)
            .then((result) => {
              inProgress = result

              nextPending()
            })
        }
      }

      nextPending()
    })
  }

  registerProcessor(processor:REXContentProcessor, priority:number = 0) {
    const priorityStr:string = `${Math.floor(priority)}`

    const toRemoves = []

    for (const key of this.processorKeys) {
      if (key.endsWith(`-${processor.name()}`)) {
        toRemoves.push(key)
      }
    }

    for (const toRemove of toRemoves) {
      let index = this.processorKeys.indexOf(toRemove)

      while (index >= 0) {
        this.processorKeys.splice(index, 1)

        index = this.processorKeys.indexOf(toRemove)
      }
    }

    const processorKey = `${priorityStr.padStart(9, '0')}-${processor.name()}`

    this.processorKeys.push(processorKey)
    this.processorKeys.sort()
    this.processorKeys.reverse()

    this.processors[processorKey] = processor
  }

  unregisterProcessor(processor:REXContentProcessor,) {
    const toRemoves = []

    for (const key of this.processorKeys) {
      if (key.endsWith(`-${processor.name()}`)) {
        toRemoves.push(key)
      }
    }

    for (const toRemove of toRemoves) {
      let index = this.processorKeys.indexOf(toRemove)

      while (index >= 0) {
        this.processorKeys.splice(index, 1)

        index = this.processorKeys.indexOf(toRemove)
      }
    }
  }
}
