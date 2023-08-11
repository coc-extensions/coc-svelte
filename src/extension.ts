import * as coc from "coc.nvim";
import {
  commands,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  TextDocument,
  TransportKind,
  Uri,
  window,
  workspace,
} from "coc.nvim";
import path from "path";
import { Position } from "vscode-languageserver-protocol";
import { activateTagClosing } from "./html/autoClose";

import { TsPlugin } from "./tsplugin";

const createLanguageClientOptions = (): LanguageClientOptions => ({
  documentSelector: [{ scheme: "file", language: "svelte" }],
  revealOutputChannelOn: RevealOutputChannelOn.Never,
  synchronize: {
    configurationSection: ["svelte", "javascript", "typescript", "prettier"],
    fileEvents: workspace.createFileSystemWatcher(
      "{**/*.js,**/*.ts}",
      false,
      false,
      false,
    ),
  },
  initializationOptions: {
    config: coc.workspace.getConfiguration("svelte.plugin"),
  },
});
class SvelteLs {
  statusItem = coc.window.createStatusBarItem();
  disposables: coc.Disposable[] = [];
  constructor(public client: LanguageClient) {}
  dispose() {
    this.statusItem.dispose();
  }
}

let ls: LanguageClient;
const statusItemBuilter = (ctx: ExtensionContext) => {
  const item = coc.window.createStatusBarItem();
  item.text = "svelte-language-server";
  ctx.subscriptions.push(item);
  return item;
};

export const activate = async (context: ExtensionContext) => {
  const status = statusItemBuilter(context);
  const runtimeConfig = workspace.getConfiguration("svelte.language-server");
  const CLIENT_OPTIONS = createLanguageClientOptions();

  const { workspaceFolders } = workspace;
  const rootPath = Array.isArray(workspaceFolders)
    ? Uri.parse(workspaceFolders[0].uri).fsPath
    : undefined;

  const tempLsPath = runtimeConfig.get<string>("ls-path");
  const lsPath =
    tempLsPath && tempLsPath.trim() !== ""
      ? path.isAbsolute(tempLsPath)
        ? tempLsPath
        : path.join(rootPath as string, tempLsPath)
      : undefined;

  const serverModule = require.resolve(
    lsPath || "svelte-language-server/bin/server.js",
  );

  // Add --experimental-modules flag for people using node 12 < version < 12.17
  // Remove this in mid 2022
  const runExecArgv: string[] = ["--experimental-modules"];
  let port = runtimeConfig.get<number>("port") ?? -1;
  if (port < 0) {
    port = 6009;
  } else {
    console.log("setting port to", port);
    runExecArgv.push(`--inspect=${port}`);
  }
  const debugOptions = {
    execArgv: ["--nolazy", "--experimental-modules", `--inspect=${port}`],
  };

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: runExecArgv },
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const serverRuntime = runtimeConfig.get<string>("runtime");
  if (serverRuntime) {
    serverOptions.run.runtime = serverRuntime;
    serverOptions.debug.runtime = serverRuntime;
    console.log("setting server runtime to", serverRuntime);
  }

  ls = createLanguageServer(serverOptions, CLIENT_OPTIONS);
  await ls.start();

  ls.onReady().then(() => {
    const disposable = activateTagClosing(
      tagRequestor,
      { svelte: true },
      "html.autoClosingTags",
    );
    context.subscriptions.push(disposable);
    window.showInformationMessage("Svelte language server now active.");
  });

  context.subscriptions.push(
    commands.registerCommand("svelte.restartLanguageServer", async () => {
      await restartLS(true);
    }),
  );
  async function restartLS(showNotification: boolean) {
    if (ls) await ls.stop();
    ls = createLanguageServer(serverOptions, CLIENT_OPTIONS);
    await ls.onReady();
    if (showNotification)
      window.showInformationMessage("Svelte language server restarted.");
  }

  context.subscriptions.push(
    workspace.onDidChangeTextDocument((event) => {
      if (!event.textDocument.uri.endsWith(".ts")) return;
      if (!event.textDocument.uri.endsWith(".js")) return;
      ls.sendNotification("$/onDidChangeTsOrJsFile", {
        uri: event.textDocument.uri,
        changes: event.contentChanges.map((changes) => ({
          text: changes.text,
          range: {
            start: {
              line: changes.range.start.line,
              character: changes.range.start.character,
            },
            end: {
              line: changes.range.end.line,
              character: changes.range.end.character,
            },
          },
        })),
      });
    }),
  );
  TsPlugin.create(context);
};

export const deactivate = async () => {
  if (ls) await ls.stop();
};

const addEventListener =
  (ctx: ExtensionContext) => (arg: any & coc.Disposable) => {
    ctx.subscriptions.push(arg);
  };

const tagRequestor = (document: TextDocument, position: Position) =>
  ls.sendRequest<string>("html/tag", {
    textDocument: { uri: document.uri },
    position,
  });
const createLanguageServer = (
  serverOptions: ServerOptions,
  clientOptions: LanguageClientOptions,
) => new LanguageClient("svelte", "Svelte", serverOptions, clientOptions);
