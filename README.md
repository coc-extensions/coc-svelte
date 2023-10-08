# Svelte for (Neo)Vim

> fork from [svelte-vscode](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-vscode).

Provides rich intellisense for Svelte components in (neo)vim, utilising the [svelte language server](https://github.com/sveltejs/language-tools/tree/master/packages/language-server).

## Install

``` vim
:CocInstall coc-svelte
```

> You have to install syntax plugin to get syntax highlight and get right filetype, for example `leafOfTree/vim-svelte-plugin`

## Setup

If you added `"files.associations": {"*.svelte": "html" }` to your CoC settings, remove it.

Do you want to use TypeScript/SCSS/Less/..? [See the docs](/docs/README.md#language-specific-setup).

## Features

You can expect the following within Svelte files:

-   Diagnostic messages
-   Support for svelte preprocessors that provide source maps
-   Formatting (via [prettier-plugin-svelte](https://github.com/sveltejs/prettier-plugin-svelte))
-   Hover info
-   Autocompletions
-   Go to definition

The extension also comes packaged with a TypeScript plugin, which when activated provides intellisense within JavaScript and TypeScript files for interacting with Svelte files.

##### `svelte.plugin.XXX`

Settings to toggle specific features of the extension. The full list of all settings [is here](https://github.com/sveltejs/language-tools/blob/master/packages/language-server/README.md#List-of-settings).

### Usage with Yarn 2 PnP

1. Run `yarn add -D svelte-language-server` to install svelte-language-server as a dev dependency
2. Run `yarn dlx @yarnpkg/pnpify --sdk vim` to generate or update the Vim/Yarn integration SDKs.
3. Set the `svelte.language-server.ls-path` setting in your user configuration, pointing it to the workspace-installed language server.
4. Restart vim.
5. Commit the changes to `.yarn/sdks`
