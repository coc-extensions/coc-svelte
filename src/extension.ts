import {
    workspace,
    ExtensionContext,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    RevealOutputChannelOn,
    commands,
} from 'coc.nvim';
import { TextDocument, Position, TextDocumentPositionParams } from 'vscode-languageserver-protocol';
import { activateTagClosing } from './html/autoClose';

export function activate(context: ExtensionContext) {
    const serverModule = require.resolve('svelte-language-server/bin/server.js');

    const runtimeConfig = workspace.getConfiguration('svelte.language-server');

    const runExecArgv: string[] = [];
    let port = runtimeConfig.get<number>('port') ?? -1;
    if (port < 0) {
        port = 6009;
    } else {
        console.log('setting port to', port);
        runExecArgv.push(`--inspect=${port}`);
    }
    const debugOptions = { execArgv: ['--nolazy', `--inspect=${port}`] };

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
            configurationSection: ['svelte'],
            fileEvents: workspace.createFileSystemWatcher('{**/*.js,**/*.ts}', false, false, false),
        },
        initializationOptions: { config: workspace.getConfiguration('svelte.plugin') },
    };

    let ls = createLanguageServer(serverOptions, clientOptions);
    context.subscriptions.push(ls.start());

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
        workspace.showMessage('Svelte language server now active.');
    });

    context.subscriptions.push(
        commands.registerCommand('svelte.restartLanguageServer', async () => {
            await ls.stop();
            ls = createLanguageServer(serverOptions, clientOptions);
            context.subscriptions.push(ls.start());
            await ls.onReady();
            workspace.showMessage('Svelte language server restarted.');
        }),
    );
}

function createLanguageServer(serverOptions: ServerOptions, clientOptions: LanguageClientOptions) {
    return new LanguageClient('svelte', 'Svelte', serverOptions, clientOptions);
}
