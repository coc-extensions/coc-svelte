import {
    window,
    workspace,
    services,
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
import { addFindComponentReferencesListener } from './typescript/findComponentReferences';
import { addFindFileReferencesListener } from './typescript/findFileReferences';
import { TsPlugin } from './tsplugin';
import { setupSvelteKit } from './sveltekit';

let lsApi: { getLS(): LanguageClient } | undefined;

export function activate(context: ExtensionContext) {
    // The extension is activated on TS/JS/Svelte files because else it might be too late to configure the TS plugin:
    // If we only activate on Svelte file and the user opens a TS file first, the configuration command is issued too late.
    // We wait until there's a Svelte file open and only then start the actual language client.
    const tsPlugin = new TsPlugin(context);

    if (workspace.textDocuments.some((doc) => doc.languageId === 'svelte')) {
        lsApi = activateSvelteLanguageServer(context);
        tsPlugin.askToEnable();
    } else {
        const onTextDocumentListener = workspace.onDidOpenTextDocument((doc) => {
            if (doc.languageId === 'svelte') {
                lsApi = activateSvelteLanguageServer(context);
                tsPlugin.askToEnable();
                onTextDocumentListener.dispose();
            }
        });

        context.subscriptions.push(onTextDocumentListener);
    }

    setupSvelteKit(context);

    // This API is considered private and only exposed for experimenting.
    // Interface may change at any time. Use at your own risk!
    return {
        /**
         * As a function, because restarting the server
         * will result in another instance.
         */
        getLanguageServer() {
            if (!lsApi) {
                lsApi = activateSvelteLanguageServer(context);
            }

            return lsApi.getLS();
        },
    };
}

export function deactivate() {
    const stop = lsApi?.getLS().stop();
    lsApi = undefined;
    return stop;
}

export function activateSvelteLanguageServer(context: ExtensionContext) {
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
            configurationSection: [
                'svelte',
                'javascript',
                'typescript',
                'prettier',
                'css',
                'less',
                'scss',
                'html',
            ],
            fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
        },
        initializationOptions: { config: workspace.getConfiguration('svelte.plugin') },
    };

    let ls = createLanguageServer(serverOptions, clientOptions);

    ls.start().then(() => {
        const tagRequestor = (document: TextDocument, position: Position) => {
            if (!['svelte', 'html'].includes(document.uri.split('.').at(-1))) {
                //console.log(
                //    'tagRequestor rejected on no svelte file!',
                //    document.uri.split('.').at(-1),
                //);
                return;
            }
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
        await ls.stop();
        ls = createLanguageServer(serverOptions, clientOptions);
        context.subscriptions.push(services.registerLanguageClient(ls));
        await ls.onReady().then(() => {
            if (showNotification) {
                window.showInformationMessage('Svelte language server restarted.');
            }
        });
    }

    function getLS() {
        return ls;
    }

    addDidChangeTextDocumentListener(getLS, context);
    addFindFileReferencesListener(getLS, context);
    addFindComponentReferencesListener(getLS, context);
    return {
        getLS,
    };
}

function addDidChangeTextDocumentListener(getLS: () => LanguageClient, context: ExtensionContext) {
    // Only Svelte file changes are automatically notified through the inbuilt LSP
    // because the extension says it's only responsible for Svelte files.
    // Therefore we need to set this up for TS/JS files manually.
    const disposable = workspace.onDidChangeTextDocument((evt) => {
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
    context.subscriptions.push(disposable);
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
    return new LanguageClient('svelte', 'Svelte', serverOptions, clientOptions);
}
