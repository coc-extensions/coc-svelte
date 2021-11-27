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

-   Svelte
    -   Diagnostic messages for warnings and errors
    -   Support for svelte preprocessors that provide source maps
    -   Svelte specific formatting (via [prettier-plugin-svelte](https://github.com/sveltejs/prettier-plugin-svelte))
-   HTML
    -   Hover info
    -   Autocompletions
    -   [Emmet](https://emmet.io/)
    -   Symbols in Outline panel
-   CSS / SCSS / LESS
    -   Diagnostic messages for syntax and lint errors
    -   Hover info
    -   Autocompletions
    -   Formatting (via [prettier](https://github.com/prettier/prettier))
    -   [Emmet](https://emmet.io/)
    -   Color highlighting and color picker
    -   Symbols in Outline panel
-   TypeScript / JavaScript
    -   Diagnostics messages for syntax errors, semantic errors, and suggestions
    -   Hover info
    -   Formatting (via [prettier](https://github.com/prettier/prettier))
    -   Symbols in Outline panel
    -   Autocompletions
    -   Go to definition
    -   Code Actions

##### `svelte.plugin.XXX`

Settings to toggle specific features of the extension. The full list of all settings [is here](https://github.com/sveltejs/language-tools/blob/master/packages/language-server/README.md#List-of-settings).

### Usage with Yarn 2 PnP

1. Run `yarn add -D svelte-language-server` to install svelte-language-server as a dev dependency
2. Run `yarn dlx @yarnpkg/pnpify --sdk vim` to generate or update the Vim/Yarn integration SDKs.
3. Set the `svelte.language-server.ls-path` setting in your user configuration, pointing it to the workspace-installed language server.
4. Restart vim.
5. Commit the changes to `.yarn/sdks`
