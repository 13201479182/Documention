import { exec } from 'child_process';

// prettier-ignore
const plugins = [
    // 工具类插件
    'ms-ceintl.vscode-language-pack-zh-hans',       // 1. Chinese (Simplified) (简体中文) Language Pack for Visual Studio Code
    'vscode-icons-team.vscode-icons',               // 2. vscode-icons
    'alefragnani.project-manager',                  // 3. Project Manager
    'gruntfuggly.todo-tree',                        // 4. Todo Tree
    'eamodio.gitlens',                              // 5. GitLens — Git supercharged
    'editorconfig.editorconfig',                    // 6. EditorConfig for VS Code

    // Markdown插件
    'bierner.markdown-preview-github-styles',       // 1. Markdown Preview Github Styling
    'bierner.markdown-emoji',                       // 2. Markdown Emoji
    'bierner.emojisense',                           // 3. :emojisense:
    'bierner.markdown-checkbox',                    // 4. Markdown Checkboxes
    'bierner.markdown-footnotes',                   // 5. Markdown Footnotes
    'bierner.markdown-mermaid',                     // 6. Markdown Preview Mermaid Support
    'mervin.markdown-formatter',                    // 7. markdown-formatter
    'davidanson.vscode-markdownlint',               // 8. markdownlint
];

function installPlugins(installedPlugins) {
    let loadedCount = 0;
    let loadTotal = plugins.length;
    for (const plugin of plugins) {
        if (installedPlugins.includes(plugin)) {
            console.log(`vsix log: plugin install progress ${++loadedCount}/${loadTotal}`);
        } else {
            const child = exec(
                `code --force --install-extension ${plugin}`,
                (err, stdout, stderr) => {
                    if (err) {
                        console.error(`vsix err log: ${err}`);
                    } else {
                        console.log(
                            `vsix log: plugin install progress ${++loadedCount}/${loadTotal}`,
                        );
                    }
                    // 结束子进程
                    child.kill();
                },
            );
        }
    }
}

exec('code --list-extensions', (err, stdout, stderr) => {
    if (err) {
        return console.log(err);
    }
    const installedPlugins = stdout.split('\n').filter(item => item);
    installPlugins(installedPlugins);
});
