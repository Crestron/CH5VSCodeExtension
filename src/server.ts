/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
    createConnection, Connection, IPCMessageReader, IPCMessageWriter,
    TextDocuments, InitializeParams, InitializeResult, Hover,
    TextDocumentPositionParams, Position, CompletionParams,
    CompletionList, CompletionItem, CodeActionContext, TextDocumentSyncKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { Ch5Settings } from './types/settings';

import { getCacheStorage, clearCacheStorage } from './services/cache';
import { doScannerUrl } from './services/scanner';

import { doHover } from './providers/hover';
import { doCompletion } from './providers/completion';
import { doDiagnostics } from './providers/diagnostics';
import { doCodeAction } from './providers/codeActions';

// Cache Storage
const cache = getCacheStorage();

// Common variables
let settings: Ch5Settings;
let url: string;

// Create a connection for the server
const connection: Connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// when connection is initialized do a full scan
connection.onInitialize(async (params: InitializeParams) => {
    //workspaceRoot = params.rootPath;
    settings = params.initializationOptions.settings;
    //activeDocumentUri = params.initializationOptions.activeEditorUri;
    url = settings.sourceURL;

    // scan url for data and cache them in storage
    await doScannerUrl(url, cache).then(() => {
        connection.window.showInformationMessage('Crestron Components meta-data is ready');
    }).catch((err) => {
        if (settings.showErrors) {
            showErrorMessages(err);
        }
    });

    return <InitializeResult>{
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: { resolveProvider: true },
            hoverProvider: true,
            codeActionProvider: true
        }
    };
});

// Update settings
// TODO: support for user/workspace settings
connection.onDidChangeConfiguration((params) => {
    settings = params.settings.ch5;
});

// This handler provides update for metadata
connection.onRequest('updateCrestronMetaData', async () => {
    // clear cache before update metadata;
    clearCacheStorage(cache);

    // scan url for data and cache them in storage
    await doScannerUrl(url, cache).then(() => {
        // show success message
        connection.window.showInformationMessage("Crestron Components meta-data update is done");
    }).catch((err) => {
        if (settings.showErrors) {
            showErrorMessages(err);
        }
    });
});

// This handler provides the initial list of the completion items.
connection.onCompletion((positionParams: CompletionParams): CompletionList => {
    const document: TextDocument = documents.get(positionParams.textDocument.uri);
    const position: Position = Position.create(positionParams.position.line, positionParams.position.character);

    return doCompletion(document, position, cache);
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    // TODO: On Completion Resolve
    if (item.label === 'type') {
        item.detail = 'Type attribute details';
        item.documentation = 'Type attribute documentation';
    }

    return item;
});

// This handler provides the hover value help pop-up.
connection.onHover((positionParams: TextDocumentPositionParams): Hover => {
    const document: TextDocument = documents.get(positionParams.textDocument.uri);
    const position: Position = Position.create(positionParams.position.line, positionParams.position.character);
    
    return doHover(document, position, cache);
});

//This handler provides response for the `CodeAction` request.
connection.onCodeAction((params) => {
    const document: TextDocument = documents.get(params.textDocument.uri);
    const context: CodeActionContext = params.context;

    return doCodeAction(context, document, cache);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    const document: TextDocument = change.document;

    doDiagnostics(document, cache, connection, settings);
});

// Dispose cache when connections shuts down
connection.onShutdown(() => {
    cache.dispose();
});

// Listen on the connection
connection.listen();

/**
 * Show error messages to vscode window
 * @param err 
 */
function showErrorMessages(err: string | string[]): void {
    if (typeof err === "object") {
        for (let errorMessage of err) {
            connection.window.showErrorMessage(errorMessage);
        }
    } else {
        connection.window.showErrorMessage(err);
    }
}
