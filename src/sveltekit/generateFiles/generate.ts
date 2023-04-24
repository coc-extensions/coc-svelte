import { Position, Uri, workspace, WorkspaceChange, TextEdit } from 'coc.nvim';
import { join } from 'path';
import { FileType, GenerateConfig } from './types';

function getFilePathFromConfig(config: GenerateConfig, resource: GenerateConfig['resources'][0]) {
    const ext = resource.type === FileType.PAGE ? config.pageExtension : config.scriptExtension;
    return join(config.path, `${resource.filename}.${ext}`);
}

export async function generateResources(config: GenerateConfig) {
    // The dir may need to be created, but there isn't an easy way in coc.nvim
    const change = new WorkspaceChange();

    for (const resource of config.resources) {
        const filepath = getFilePathFromConfig(config, resource);
        change.createFile(filepath, {
            overwrite: false,
            ignoreIfExists: true,
        });
    }
    // Convert change to TextEdit
    const edit = change.edit;

    for (const resource of config.resources) {
        const data = await resource.generate(config);
        const filepath = getFilePathFromConfig(config, resource);
        const relevantChanges = edit.changes ? edit.changes[filepath] || [] : [];
        edit.changes = {
            ...edit.changes,
            [filepath]: [...relevantChanges, TextEdit.insert(Position.create(0, 0), data)],
        };
    }

    await workspace.applyEdit(edit);

    // save documents and open the first
    const changes = edit.changes;
    if (changes) {
        await Promise.all(
            Object.entries(changes).map(async ([uri], i) => {
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
}
