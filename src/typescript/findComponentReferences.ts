import {
    commands,
    LanguageClient,
    ExtensionContext,
    Uri,
    window,
    workspace,
    Position,
    Location,
    Range,
} from 'coc.nvim';
import { Location as LSLocation } from 'vscode-languageserver-protocol';

export async function addFindComponentReferencesListener(
    getLS: () => LanguageClient,
    context: ExtensionContext,
) {
    const disposable = commands.registerCommand(
        'svelte.typescript.findComponentReferences',
        handler,
    );

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
                title: 'Finding component references',
            },
            async (_, token) => {
                const lsLocations = await getLS().sendRequest<LSLocation[] | null>(
                    '$/getComponentReferences',
                    document.uri.toString(),
                    token,
                );

                if (!lsLocations) {
                    return;
                }

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
            },
        );
    }
}
