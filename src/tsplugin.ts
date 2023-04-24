import { commands, ExtensionContext, window, workspace } from 'coc.nvim';

export class TsPlugin {
    private enabled: boolean;
    context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.enabled = this.isEnabled();
        this.context = context;
        this.toggleTsPlugin(this.enabled);

        context.subscriptions.push(
            workspace.onDidChangeConfiguration(() => {
                const enabled = this.isEnabled();
                if (enabled !== this.enabled) {
                    this.enabled = enabled;
                    this.toggleTsPlugin(this.enabled);
                }
            }),
        );
    }

    private isEnabled(): boolean {
        return workspace.getConfiguration('svelte').get<boolean>('enable-ts-plugin') ?? false;
    }

    private async toggleTsPlugin(enable: boolean) {
        workspace.getConfiguration('svelte').update('enable-ts-plugin', enable, true);
    }

    async askToEnable() {
        const shouldAsk = workspace
            .getConfiguration('svelte')
            .get<boolean>('ask-to-enable-ts-plugin');
        if (this.enabled || !shouldAsk) {
            return;
        }

        const answers = ['Ask again later', "Don't show this message again", 'Enable Plugin'];
        const response = await window.showInformationMessage(
            'The coc-svelte extension now contains a TypeScript plugin. ' +
                'Enabling it will provide intellisense for Svelte files from TS/JS files. ' +
                'Would you like to enable it? ' +
                'You can always enable/disable it later on through the extension settings.',
            ...answers,
        );

        if (response === answers[2]) {
            workspace.getConfiguration('svelte').update('enable-ts-plugin', true, true);
        } else if (response === answers[1]) {
            workspace.getConfiguration('svelte').update('ask-to-enable-ts-plugin', false, true);
        }
    }
}
