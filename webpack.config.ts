import CopyPlugin from 'copy-webpack-plugin'

import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const moduleRules = {
  rules: [{
    test: /\.([cm]?ts|tsx)$/,
    loader: "ts-loader",
    options: { allowTsInNodeModules: true }
  }, {
    test: /\.css$/,
    use: ['style-loader', 'css-loader']
  },],
};

const mode:String = 'development'

const resolve = {
  extensionAlias: {
    ".js": [".ts", ".js"],
    ".mjs": [".mts", ".mjs"]
  }
}

export default [{
  entry: {
    browser: './tests/src/browser.ts',
  },
  output: {
    filename: '[name]/bundle.js',
    path: path.resolve(__dirname, 'dist', 'extension', 'js'),
  },
  module: moduleRules,
  mode,
  resolve,
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./tests/extension", to: ".." },
      ],
    }),],
}, {
  entry: {
    extension: './tests/src/extension.ts',
  },
  output: {
    filename: '[name]/bundle.js',
    path: path.resolve(__dirname, 'dist', 'extension', 'js'),
  },
  module: moduleRules,
  mode,
  resolve
}, {
  entry: {
    serviceWorker: './tests/src/service-worker.ts',
  },
  output: {
    filename: '[name]/bundle.js',
    path: path.resolve(__dirname, 'dist', 'extension', 'js'),
  },
  module: moduleRules,
  mode,
  resolve
}]
