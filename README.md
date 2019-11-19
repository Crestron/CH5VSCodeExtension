<p align="center">
  <img src="https://kenticoprod.azureedge.net/kenticoblob/crestron/media/crestron/generalsiteimages/crestron-logo.png">
</p>
 
# Crestron VSCode Extension - Getting Started

#### Continuous Integration and Deployment Status

| DEV NIGHTLY - latest-dev | Status |
| ------ | ----------- |
| Build Pipeline | Work In Progress |
| Release Pipeline - Azure Blob | Work In Progress |

| MASTER-QE - latest-qe | Status |
| ------ | ----------- |
| Build Pipeline | Work In Progress |
| Release Pipeline - Azure Blob | Work In Progress |
| VsCode Marketplace | Work In Progress |

> Crestron Components IntelliSense (Snippets, Completion, Suggestions, Hover Help, Diagnostics, Action choices) for all html files in the workspace.

## Build Requirements

- Node and npm versions:
    - node v8.11.1 
    - npm v5.6.0 

## Install

Plugin installation is performed in several stages:

### Local installation

Extensions are installed in a per user extensions folder. Depending on your platform, the location is in the following folder:

* Windows %USERPROFILE%\.vscode\extensions
* macOS ~/.vscode/extensions
* Linux ~/.vscode/extensions

1. Take the extension folder and place it in the above location depending on your platform
2. Navigate to extension folder and run ```npm install``` to install all node modules in the workspace
3. After all node modules are installed you have run ```npm run compile```

### Install from a VSIX

You can manually install a VS Code extension packaged in a `.vsix` file. Pressing `F1` and search the **Install from VSIX...** command in the Extensions view command drop-down, or the **Extensions: Install from VSIX...** command in the **Command Palette**, point to the `.vsix` file.

You can also install using the VS Code `--install-extension` command line switch providing the path to the `.vsix` file.

```code --install-extension myextension.vsix```

## Usage

Just install the plugin and use it.

## Crestron Commands

Press `F1` to open **Command Pallete** and type `Crestron`.

## Generating VSIX file

1. Make sure you have Node.js installed. Then in terminal run:

    `npm install -g vsce`

    `vsce` is the command line tool you'll use to publish extensions to the Extension Marketplace. You can also load extensions locally and share them via email or a UNC drive.

2. Keep in mind that all node modules has to be installed. If not installed run:

    `npm install`

3. Run `npm run generate-package`. This will create `.vsix` file in the root of extension folder


## Supported features

* Code Completion Proposals (crestron elements, attributes, attributes values) — [description](http://code.visualstudio.com/docs/extensions/language-support#_show-code-completion-proposals)
* Hover — [description](http://code.visualstudio.com/docs/extensions/language-support#_show-hovers)
