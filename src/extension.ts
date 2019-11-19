// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';

import * as vscode from 'vscode';

import {
	LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, TextEdit
} from 'vscode-languageclient';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Crestron Components" is now active!');

	async function applyTextEdits(uri: string, documentVersion: number, edits: TextEdit[]): Promise<boolean> {
		let textEditor = vscode.window.activeTextEditor;
		if (textEditor && textEditor.document.uri.toString() === uri) {
			if (documentVersion !== -1 && textEditor.document.version !== documentVersion) {
				vscode.window.showInformationMessage(`CH5 fixes are outdated and can't be applied to the document.`);
				return true;
			}
			return textEditor.edit(mutator => {
				for (let edit of edits) {
					mutator.replace(client.protocol2CodeConverter.asRange(edit.range), edit.newText);
				}
			});
		}
		return true;
	}

	// The server is implemented in node
	const serverModule = path.join(__dirname, 'server.js');
	// The debug options for the server
	const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	};

	// active editor
	const activeEditor = vscode.window.activeTextEditor;

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for all html files
		documentSelector: [{ language: 'html', scheme: 'file' }],
		synchronize: {
			// Notify the server about file changes to vsc-config.json files contain in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/vsc-config.json'),
		},
		initializationOptions: {
			settings: vscode.workspace.getConfiguration('ch5'),
			activeEditorUri: activeEditor ? activeEditor.document.uri.toString() : null
		}
	};

	// Create the language client and start the client.
	const client = new LanguageClient('crestronComponents', 'Crestron Components Language Server', serverOptions, clientOptions);

	const disposable: vscode.Disposable[] = [];
	// Start the client. This will also launch the server
	disposable[0] = client.start();
	// register command for update metadata
	disposable[1] = vscode.commands.registerCommand('_ch5.updateMetaData', () => {
		// send a notification to server for knowing that is time to update metadata
		client.sendRequest('updateCrestronMetaData');
	});
	// register command for apply text edits on code actions
	disposable[2] = vscode.commands.registerCommand('_ch5.applyTextEdits', applyTextEdits);

	context.subscriptions.push(...disposable);
}

// this method is called when your extension is deactivated
export function deactivate(){

}
