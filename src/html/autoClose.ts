// Original source: https://github.com/Microsoft/vscode/blob/master/extensions/html-language-features/client/src/tagClosing.ts

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict'

import { workspace, Disposable, snippetManager } from 'coc.nvim'
import {
  TextDocumentContentChangeEvent,
  TextDocument,
  Position,
} from 'vscode-languageserver-protocol'

export function activateTagClosing(
  tagProvider: (document: TextDocument, position: Position) => Thenable<string>,
  supportedLanguages: { [id: string]: boolean },
  configName: string,
): Disposable {
  let disposables: Disposable[] = []
  workspace.onDidChangeTextDocument(
    event => {
      const document = workspace.getDocument(event.textDocument.uri)
      if (document) {
        onDidChangeTextDocument(document.textDocument, event.contentChanges)
      }
    },
    null,
    disposables,
  )

  let isEnabled = false
  updateEnabledState()

  disposables.push(
    workspace.registerAutocmd({
      event: ['BufEnter'],
      request: false,
      callback: updateEnabledState,
    }),
  )

  let timeout: NodeJS.Timer | undefined = void 0

  async function updateEnabledState() {
    isEnabled = false
    let doc = await workspace.document
    let document = doc.textDocument
    if (!supportedLanguages[document.languageId]) {
      return
    }
    if (!workspace.getConfiguration(void 0, document.uri).get<boolean>(configName)) {
      return
    }
    isEnabled = true
  }

  async function onDidChangeTextDocument(
    document: TextDocument,
    changes: TextDocumentContentChangeEvent[],
  ) {
    if (!isEnabled) {
      return
    }
    const doc = await workspace.document
    let activeDocument = doc.textDocument
    if (document !== activeDocument || changes.length === 0) {
      return
    }
    if (typeof timeout !== 'undefined') {
      clearTimeout(timeout)
    }
    let lastChange = changes[changes.length - 1]
    let lastCharacter = lastChange.text[lastChange.text.length - 1]
    if (lastChange.rangeLength! > 0 || (lastCharacter !== '>' && lastCharacter !== '/')) {
      return
    }
    let rangeStart = lastChange.range!.start
    let version = document.version
    timeout = setTimeout(async () => {
      let position = Position.create(rangeStart.line, rangeStart.character + lastChange.text.length)
      const text = await tagProvider(document, position)
      if (text && isEnabled) {
        const doc = await workspace.document
        let activeDocument = doc.textDocument
        if (document === activeDocument && activeDocument.version === version) {
          snippetManager.insertSnippet(text, false, {
            start: position,
            end: Position.create(position.line, position.character),
          })
        }
      }
      timeout = void 0
    }, 100)
  }

  return {
    dispose() {
      disposables.forEach(disposable => {
        disposable.dispose()
      })
    },
  }
}
