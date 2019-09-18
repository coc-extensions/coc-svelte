import * as path from 'path'

import {
  workspace,
  ExtensionContext,
  commands,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
} from 'coc.nvim'
import { TextDocument, Position, TextDocumentPositionParams } from 'vscode-languageserver-protocol'
import { activateTagClosing } from './html/autoClose'

export function activate(context: ExtensionContext) {
  let serverModule = context.asAbsolutePath(
    path.join('./', 'node_modules', 'svelte-language-server', 'bin', 'server.js'),
  )

  let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  }

  const lsConfig = workspace.getConfiguration('svelte.language-server')

  const serverRuntime = lsConfig.get<string>('runtime')
  if (serverRuntime) {
    serverOptions.run.runtime = serverRuntime
    serverOptions.debug.runtime = serverRuntime
    console.log('setting server runtime to', serverRuntime)
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'svelte' }],
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    synchronize: {
      configurationSection: ['svelte', 'html'],
    },
  }

  let ls = createLanguageServer(serverOptions, clientOptions)
  context.subscriptions.push(ls.start())

  ls.onReady().then(() => {
    let tagRequestor = (document: TextDocument, position: Position) => {
      let param: TextDocumentPositionParams = {
        textDocument: {
          uri: document.uri,
        },
        position,
      }
      return ls.sendRequest<string>('html/tag', param)
    }
    let disposable = activateTagClosing(tagRequestor, { svelte: true }, 'svelte.plugin.html.autoClosingTags')
    context.subscriptions.push(disposable)
  })

  context.subscriptions.push(
    commands.registerCommand('svelte.restartLanguageServer', async () => {
      await ls.stop()
      ls = createLanguageServer(serverOptions, clientOptions)
      context.subscriptions.push(ls.start())
      await ls.onReady()
    }),
  )
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
  return new LanguageClient('svelte', 'Svelte', serverOptions, clientOptions)
}
