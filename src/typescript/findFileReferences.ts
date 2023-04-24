import {
    commands,
    ExtensionContext,
    LanguageClient,
    Uri,
    window,
    workspace,
    Position,
    Location,
    Range,
} from 'coc.nvim';
import { Location as LSLocation } from 'vscode-languageserver-protocol';

/**
 * adopted from https://github.com/microsoft/vscode/blob/5f3e9c120a4407de3e55465588ce788618526eb0/extensions/typescript-language-features/src/languageFeatures/fileReferences.ts
 */
export async function addFindFileReferencesListener(
    getLS: () => LanguageClient,
    context: ExtensionContext,
) {
    const disposable = commands.registerCommand('svelte.typescript.findAllFileReferences', handler);

    context.subscriptions.push(disposable);

    async function handler(resource?: Uri) {
        if (!resource) {
            const documentUriString = window.activeTextEditor?.document.uri;
            resource = documentUriString ? Uri.parse(documentUriString) : undefined;
        }

        if (!resource || resource.scheme !== 'file') {
            return;
        }

        const document = await workspace.openTextDocument(resource);

        await window.withProgress(
            {
                title: 'Finding file references',
            },
            async (_, token) => {
                const lsLocations = await getLS().sendRequest<LSLocation[] | null>(
                    '$/getFileReferences',
                    document.uri.toString(),
                    token,
                );

                if (!lsLocations) {
                    return;
                }

                const config = workspace.getConfiguration('references');
                const existingSetting = config.inspect<string>('preferredLocation');

                await config.update('preferredLocation', 'view');
                try {
                    await commands.executeCommand(
                        'editor.action.showReferences',
                        resource,
                        Position.create(0, 0),
                        lsLocations.map((ref) =>
                            Location.create(
                                ref.uri,
                                Range.create(
                                    ref.range.start.line,
                                    ref.range.start.character,
                                    ref.range.end.line,
                                    ref.range.end.character,
                                ),
                            ),
                        ),
                    );
                } finally {
                    await config.update(
                        'preferredLocation',
                        existingSetting?.workspaceFolderValue ?? existingSetting?.workspaceValue,
                    );
                }
            },
        );
    }
}
