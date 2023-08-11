async function start() {
  await require("esbuild").build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    treeShaking: true,
    keepNames: false,
    minify: true,
    sourcemap: true,
    external: ["typescript", "coc.nvim", "svelte-language-server/bin/server.js"],
    platform: "node",
    target: "node14.14",
    outfile: "lib/index.js",
  });
}

start().catch(e => {
  console.error(e);
});
