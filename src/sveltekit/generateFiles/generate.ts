import {
    Position,
    Uri,
    workspace,
    WorkspaceEdit,
    CreateFile,
    TextDocumentEdit,
    TextEdit,
} from 'coc.nvim';
import { join } from 'path';
import { FileType, GenerateConfig } from './types';

function getFilePathFromConfig(
    config: GenerateConfig,
    resource: GenerateConfig['resources'][0],
): string {
    const ext = resource.type === FileType.PAGE ? config.pageExtension : config.scriptExtension;
    return join(config.path, `${resource.filename}.${ext}`);
}

export async function generateResources(config: GenerateConfig) {
    // The dir may need to be created, but there isn't an easy way in coc.nvim
    const filepathsAndResources = config.resources.map(
        (resource): [string, GenerateConfig['resources'][0]] => [
            getFilePathFromConfig(config, resource),
            resource,
        ],
    );

    for (const [filepath, resource] of filepathsAndResources) {
        const data = await resource.generate(config);
        await workspace.createFile(filepath)
        const edits: WorkspaceEdit = {
          changes: {
            [filepath]: [TextEdit.insert(Position.create(0, 0), data)]
          }
        }
        workspace.applyEdit(edits)
    }

    // save documents and open the first
    await Promise.all(
        filepathsAndResources.map(async ([uri], i) => {
            const doc = workspace.textDocuments.find(
                (t) => Uri.parse(t.uri).path === Uri.parse(uri).path,
            );
            if (doc) {
                // double check whether the doc needs to be saved
                if (i === 0) {
                    await workspace.openTextDocument(uri);
                }
            }
        }),
    );
}
