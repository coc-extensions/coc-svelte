// Original source: https://github.com/Microsoft/vscode/blob/master/extensions/html-language-features/client/src/tagClosing.ts

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { workspace, Disposable, snippetManager } from 'coc.nvim';

import {
    TextDocument,
    Position,
    TextDocumentContentChangeEvent,
} from 'vscode-languageserver-protocol';

export function activateTagClosing(
    tagProvider: (document: TextDocument, position: Position) => Thenable<string>,
    supportedLanguages: { [id: string]: boolean },
    configName: string,
): Disposable {
    const disposables: Disposable[] = [];
    workspace.onDidChangeTextDocument(
        (event) => {
            const editor = workspace.getDocument(event.textDocument.uri);
            if (editor) {
                onDidChangeTextDocument(editor.textDocument, event.contentChanges);
            }
        },
        null,
        disposables,
    );

    let isEnabled = false;
    updateEnabledState();

    let timeout: NodeJS.Timer | undefined = void 0;

    async function updateEnabledState() {
        isEnabled = false;
        const editor = await workspace.document;
        if (!editor) {
            return;
        }
        const document = editor.textDocument;
        if (!supportedLanguages[document.languageId]) {
            return;
        }
        if (!workspace.getConfiguration(void 0, document.uri).get<boolean>(configName)) {
            return;
        }
        isEnabled = true;
    }

    async function onDidChangeTextDocument(
        document: TextDocument,
        changes: readonly TextDocumentContentChangeEvent[],
    ) {
        if (!isEnabled) {
            return;
        }
        const activeEditor = await workspace.document;
        const activeDocument = activeEditor?.textDocument;
        if (document !== activeDocument || changes.length === 0) {
            return;
        }
        if (typeof timeout !== 'undefined') {
            clearTimeout(timeout);
        }
        const lastChange = changes[changes.length - 1];
        const lastCharacter = lastChange.text[lastChange.text.length - 1];
        if (
            ('range' in lastChange && (lastChange.rangeLength ?? 0) > 0) ||
            (lastCharacter !== '>' && lastCharacter !== '/')
        ) {
            return;
        }
        const rangeStart =
            'range' in lastChange
                ? lastChange.range.start
                : Position.create(0, document.getText().length);
        const version = document.version;
        timeout = setTimeout(async () => {
            const position = Position.create(
                rangeStart.line,
                rangeStart.character + lastChange.text.length,
            );
            const text = await tagProvider(document, position);
            if (text && isEnabled) {
                const activeEditor = await workspace.document;
                if (activeEditor) {
                    const activeDocument = activeEditor.textDocument;
                    if (document === activeDocument && activeDocument.version === version) {
                        snippetManager.insertSnippet(text, false, {
                            start: position,
                            end: Position.create(position.line, position.character),
                        });
                    }
                }
            }
            timeout = void 0;
        }, 100);
    }
    return {
        dispose: () => {
            disposables.forEach((disposable) => {
                disposable.dispose();
            });
        },
    };
}
