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

### Settings

##### `svelte.language-server.runtime`

Path to the node executable you would like to use to run the language server.
This is useful when you depend on native modules such as node-sass as without
this they will run in the context of vscode, meaning node version mismatch is likely.

##### `svelte.language-server.ls-path`

You normally don't set this. Path to the language server executable. If you installed the \"svelte-language-server\" npm package, it's within there at \"bin/server.js\". Path can be either relative to your workspace root or absolute. Set this only if you want to use a custom version of the language server.

##### `svelte.language-server.port`

You normally don't set this. At which port to spawn the language server.
Can be used for attaching to the process for debugging / profiling.
If you experience crashes due to "port already in use", try setting the port.
-1 = default port is used.

##### `svelte.plugin.typescript.enable`

Enable the TypeScript plugin. _Default_: `true`

##### `svelte.plugin.typescript.diagnostics`

Enable diagnostic messages for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.hover`

Enable hover info for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.documentSymbols`

Enable document symbols for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.completions`

Enable completions for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.findReferences`

Enable find-references for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.definitions`

Enable go to definition for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.codeActions`

Enable code actions for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.selectionRange`

Enable selection range for TypeScript. _Default_: `true`

##### `svelte.plugin.typescript.rename.enable`

Enable rename/move Svelte files functionality. _Default_: `true`

##### `svelte.plugin.typescript.signatureHelp.enable`

Enable signature help (parameter hints) for JS/TS. _Default_: `true`

##### `svelte.plugin.css.enable`

Enable the CSS plugin. _Default_: `true`

##### `svelte.plugin.css.globals`

Which css files should be checked for global variables (`--global-var: value;`). These variables are added to the css completions. String of comma-separated file paths or globs relative to workspace root.

##### `svelte.plugin.css.diagnostics`

Enable diagnostic messages for CSS. _Default_: `true`

##### `svelte.plugin.css.hover`

Enable hover info for CSS. _Default_: `true`

##### `svelte.plugin.css.completions`

Enable auto completions for CSS. _Default_: `true`

##### `svelte.plugin.css.documentColors`

Enable document colors for CSS. _Default_: `true`

##### `svelte.plugin.css.colorPresentations`

Enable color picker for CSS. _Default_: `true`

##### `svelte.plugin.css.documentSymbols`

Enable document symbols for CSS. _Default_: `true`

##### `svelte.plugin.css.selectionRange`

Enable selection range for CSS. _Default_: `true`

##### `svelte.plugin.html.enable`

Enable the HTML plugin. _Default_: `true`

##### `svelte.plugin.html.hover`

Enable hover info for HTML. _Default_: `true`

##### `svelte.plugin.html.completions`

Enable auto completions for HTML. _Default_: `true`

##### `svelte.plugin.html.tagComplete`

Enable HTML tag auto closing. _Default_: `true`

##### `svelte.plugin.html.documentSymbols`

Enable document symbols for HTML. _Default_: `true`

##### `svelte.plugin.svelte.enable`

Enable the Svelte plugin. _Default_: `true`

##### `svelte.plugin.svelte.diagnostics.enable`

Enable diagnostic messages for Svelte. _Default_: `true`

##### `svelte.plugin.svelte.compilerWarnings`

Svelte compiler warning codes to ignore or to treat as errors. Example: { 'css-unused-selector': 'ignore', 'unused-export-let': 'error'}

##### `svelte.plugin.svelte.format.enable`

Enable formatting for Svelte (includes css & js). _Default_: `true`

##### `svelte.plugin.svelte.hover.enable`

Enable hover info for Svelte (for tags like #if/#each). _Default_: `true`

##### `svelte.plugin.svelte.completions.enable`

Enable autocompletion for Svelte (for tags like #if/#each). _Default_: `true`

##### `svelte.plugin.svelte.codeActions.enable`

Enable code actions for Svelte. _Default_: `true`

##### `svelte.plugin.svelte.selectionRange.enable`

Enable selection range for Svelte. _Default_: `true`


### Usage with Yarn 2 PnP

1. Run `yarn add -D svelte-language-server` to install svelte-language-server as a dev dependency 
2. Run `yarn dlx @yarnpkg/pnpify --sdk vim` to generate or update the (neo)vim/Yarn integration SDKs. This also sets the `svelte.language-server.ls-path` setting for the workspace, pointing it to the workspace-installed language server.
3. Restart (neo)vim.
4. Commit the changes to `.yarn/sdks`

