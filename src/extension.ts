import {
    window,
    workspace,
    ExtensionContext,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    TextDocument,
    RevealOutputChannelOn,
    Uri,
    commands,
} from 'coc.nvim';
import path from 'path';
import { Position, TextDocumentPositionParams } from 'vscode-languageserver-protocol';
import { activateTagClosing } from './html/autoClose';
import { TsPlugin } from './tsplugin';

let ls: LanguageClient;
export const activate = async (context: ExtensionContext) => {
    const runtimeConfig = workspace.getConfiguration('svelte.language-server');

    const { workspaceFolders } = workspace;
    const rootPath = Array.isArray(workspaceFolders)
        ? Uri.parse(workspaceFolders[0].uri).fsPath
        : undefined;

    const tempLsPath = runtimeConfig.get<string>('ls-path');
    const lsPath =
        tempLsPath && tempLsPath.trim() !== ''
            ? path.isAbsolute(tempLsPath)
                ? tempLsPath
                : path.join(rootPath as string, tempLsPath)
            : undefined;

    const serverModule = require.resolve(lsPath || 'svelte-language-server/bin/server.js');

    // Add --experimental-modules flag for people using node 12 < version < 12.17
    // Remove this in mid 2022
    const runExecArgv: string[] = ['--experimental-modules'];
    let port = runtimeConfig.get<number>('port') ?? -1;
    if (port < 0) {
        port = 6009;
    } else {
        console.log('setting port to', port);
        runExecArgv.push(`--inspect=${port}`);
    }
    const debugOptions = { execArgv: ['--nolazy', '--experimental-modules', `--inspect=${port}`] };

    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: runExecArgv },
        },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    };

    const serverRuntime = runtimeConfig.get<string>('runtime');
    if (serverRuntime) {
        serverOptions.run.runtime = serverRuntime;
        serverOptions.debug.runtime = serverRuntime;
        console.log('setting server runtime to', serverRuntime);
    }

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'svelte' }],
        revealOutputChannelOn: RevealOutputChannelOn.Never,
        synchronize: {
            configurationSection: ['svelte', 'javascript', 'typescript', 'prettier'],
            fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
        },
        initializationOptions: { config: workspace.getConfiguration('svelte.plugin') },
    };

    ls = createLanguageServer(serverOptions, clientOptions);
    await ls.start();

    ls.onReady().then(() => {
        const tagRequestor = (document: TextDocument, position: Position) => {
            const param: TextDocumentPositionParams = {
                textDocument: { uri: document.uri },
                position,
            };
            return ls.sendRequest<string>('html/tag', param);
        };
        const disposable = activateTagClosing(
            tagRequestor,
            { svelte: true },
            'html.autoClosingTags',
        );
        context.subscriptions.push(disposable);
        window.showInformationMessage('Svelte language server now active.');
    });

    context.subscriptions.push(
        commands.registerCommand('svelte.restartLanguageServer', async () => {
            await restartLS(true);
        }),
    );
    async function restartLS(showNotification: boolean) {
        if (ls) {
            await ls.stop();
        }
        ls = createLanguageServer(serverOptions, clientOptions);
        await ls.onReady();
        if (showNotification) window.showInformationMessage('Svelte language server restarted.');
    }

    function getLS() {
        return ls;
    }

    context.subscriptions.push(addDidChangeTextDocumentListener(getLS));

    TsPlugin.create(context);
};

export const deactivate = async () => {
    if (ls) await ls.stop();
};

function addDidChangeTextDocumentListener(getLS: () => LanguageClient) {
    // Only Svelte file changes are automatically notified through the inbuilt LSP
    // because the extension says it's only responsible for Svelte files.
    // Therefore we need to set this up for TS/JS files manually.
    return workspace.onDidChangeTextDocument((evt) => {
        if (evt.textDocument.uri.endsWith('.ts') || evt.textDocument.uri.endsWith('.js')) {
            getLS().sendNotification('$/onDidChangeTsOrJsFile', {
                uri: evt.textDocument.uri,
                changes: evt.contentChanges.map((c) => ({
                    range: {
                        start: { line: c.range.start.line, character: c.range.start.character },
                        end: { line: c.range.end.line, character: c.range.end.character },
                    },
                    text: c.text,
                })),
            });
        }
    });
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
    return new LanguageClient('svelte', 'Svelte', serverOptions, clientOptions);
}
