import { workspace } from 'coc.nvim';
import * as path from 'path';

export async function fileExists(file: string) {
    try {
        const path = await workspace.findUp(file);
        return Boolean(path);
    } catch (err) {
        return false;
    }
}

export async function findFile(searchPath: string, fileName: string) {
    for (;;) {
        const filePath = path.join(searchPath, fileName);
        if (await fileExists(filePath)) {
            return filePath;
        }
        const parentPath = path.dirname(searchPath);
        if (parentPath === searchPath) {
            return;
        }
        searchPath = parentPath;
    }
}

export async function checkProjectType(path: string) {
    const tsconfig = await findFile(path, 'tsconfig.json');
    const jsconfig = await findFile(path, 'jsconfig.json');
    const isTs = !!tsconfig && (!jsconfig || tsconfig.length >= jsconfig.length);
    if (isTs) {
        try {
            const packageJSONPath = require.resolve('typescript/package.json', {
                paths: [tsconfig],
            });
            const { version } = require(packageJSONPath);
            const [major, minor] = version.split('.');
            if ((Number(major) === 4 && Number(minor) >= 9) || Number(major) > 4) {
                return 'ts-satisfies';
            } else {
                return 'ts';
            }
        } catch (e) {
            return 'ts';
        }
    } else {
        return 'js';
    }
}
