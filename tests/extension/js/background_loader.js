/* global importScripts */

if (typeof window === 'undefined') {
  window = {} // eslint-disable-line no-global-assign
}

const scripts = [
  'serviceWorker/bundle.js',
]

importScripts.apply(null, scripts)
