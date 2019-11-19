// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import {
    TextDocument, Files, Position, Range,
    CompletionList, CompletionItemKind, InsertTextFormat
} from 'vscode-languageserver';

import { getLanguageService as getHTMLLanguageService, HTMLDocument, Node, TokenType, Scanner, LanguageService } from 'vscode-html-languageservice';

import { Ch5Attribute, Ch5Snippet } from '../types/metadata';
import { DataTypePrefix } from '../types/prefix';

import { Ch5Cache } from '../services/cache';

import { 
    getCh5ElementsTagNames, 
    ch5OpenTagComplete, 
    couldBeCh5Element, 
    isCh5Element, 
    getWordRangeAtPosition, 
    getLineText, 
    isEmpty} from '../utils/helpers';

/**
 * Do Completion
 */
// TODO: completion where no text inserted. Return all attributes 
export function doCompletion(document: TextDocument, position: Position, cache: Ch5Cache): CompletionList {
    let result: CompletionList = {
        isIncomplete: false,
        items: []
    };
    const documentPath = Files.uriToFilePath(document.uri) || document.uri;
    
    if (!documentPath || isEmpty(cache.storage())) {
		return result;
    }
    
    const text: string = document.getText();
    const offset: number = document.offsetAt(position);
    const htmlLanguageService: LanguageService = getHTMLLanguageService();
    const htmlDocument: HTMLDocument = htmlLanguageService.parseHTMLDocument(document);
    const node: Node = htmlDocument.findNodeAt(offset);
    
    if (!node) {
        return result;
    }
    
    // COMPLETION START
    let dataType: DataTypePrefix = DataTypePrefix.Ch5;
    let scanner: Scanner = htmlLanguageService.createScanner(text, node.start);
    let currentTag: string = '';
    let currentAttributeName: string = '';

    let token: TokenType = scanner.scan();

    while (token !== TokenType.EOS && scanner.getTokenOffset() <= offset) {
        switch (token) {
            // privide ch5 element tag names completion
            case TokenType.StartTag:
                // update current tag name
                currentTag = scanner.getTokenText();

                const ch5TagsNames: string[] = getCh5ElementsTagNames(cache);
                const couldBeCh5ElTagName: boolean = couldBeCh5Element(currentTag, ch5TagsNames);

                // if not ch5 element switch data type to html-elements
                if (!isCh5Element(currentTag, cache) && !couldBeCh5ElTagName) {
                    dataType = DataTypePrefix.Html;
                }

                const endToken: number = scanner.getTokenEnd();

                if (offset <= endToken && couldBeCh5ElTagName) {
                    // get autocomplete items only by text between start of the tag 
                    // and current cursor position (cTagText)
                    const tagTxtBetweenOffsetAndTagEnd: string = text.substr(offset, endToken - offset);
                    const openTagComplete: boolean = ch5OpenTagComplete(currentTag, ch5TagsNames);
                    const cTagText: string = openTagComplete 
                        ? currentTag.slice(0, currentTag.length - tagTxtBetweenOffsetAndTagEnd.length) 
                        : currentTag;
                    return elementsCompletion(cTagText, cache);
                }
                
                break;
            // provide attribute names completion
            case TokenType.AttributeName:
                // save attribute name
                // lowercase attr name to avoid issue related attr search (all attrs are lowercase in schema.json)s
                currentAttributeName = scanner.getTokenText().toLowerCase();

                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attributes = cache.getElementAttributes(currentTag, dataType);
                    return attributeCompletion(currentAttributeName, attributes);
                }
            break;
            // provide attribute values completion
            case TokenType.AttributeValue:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attribute = cache.getAttribute(currentAttributeName, currentTag, dataType);           
                    return attributeValueCompletion(attribute);
                }
                break;
            // provide snippets completion
            case TokenType.Content:
                if (offset <= scanner.getTokenEnd()) {
                    const snippets = cache.getSnippets();
                    
                    return snippetsCompletion(document, position, snippets);
                }
                break;
            default:
                if (offset <= scanner.getTokenEnd()) {
                    return result;
                }
                break;
        }

        token = scanner.scan();
    }

    return result;
}

/**
 * Create snippets sugestions
 * 
 * @param document 
 * @param position 
 * @param cache 
 */
function snippetsCompletion(document: TextDocument, position:Position, snippets: Ch5Snippet[]): CompletionList {
    const lineText = getLineText(document, position);
    let wordRange: Range  = getWordRangeAtPosition(lineText, position);
    let word: string = document.getText(wordRange);
    
    // create empty completion list
    let completions = CompletionList.create([], false);

    if (snippets.length > 0) {
        for (let snippet of snippets) {
            if (snippet.hasOwnProperty('prefix') && snippet.prefix.indexOf(word) !== -1 ) {
                const autocompleteItem = {
                    label: snippet.prefix,
                    kind: CompletionItemKind.Snippet,
                    insertText: snippet.body.join('\n'),
                    insertTextFormat: InsertTextFormat.Snippet,
                    detail: snippet.description,
                    documentation: ''
                };
                completions.items.push(autocompleteItem);
            } 
        }
    }

    return completions;
}

function elementsCompletion(currentTag: string, cache: Ch5Cache): CompletionList {
    const completions = CompletionList.create([], false);

    const ch5Elements = cache.getCh5ElementsByIncompleteTagName(currentTag);
    if (ch5Elements.length > 0) {
        for (let ch5El of ch5Elements) {
            const autocompleteItem = {
                label: ch5El.tagName,
                kind: CompletionItemKind.Text,
                insertText: ch5El.tagName,
                detail: ch5El.description,
                documentation: ch5El.documentation.join('\n')
            };
            completions.items.push(autocompleteItem);
        }
    }

    return completions;
}

/**
 * Provide CompletionList for attribute values
 * 
 * @param attribute 
 */
function attributeValueCompletion(attribute: Ch5Attribute): CompletionList {  
    let labels: string[] = [];

    if (attribute) {
        // loop through attribute values
        labels = getAttributeValues(attribute);
    }       

    const completions = CompletionList.create([], false);

    labels.forEach(label => {
        const autocompleteItem = {
            label: label,
            kind: CompletionItemKind.Value,
            detail:'',
            documentation: ''
        };
        completions.items.push(autocompleteItem);
    });

    return completions;
}

/**
 * Provide CompletionList for attribute completion
 * 
 * @param word 
 * @param attributes 
 */
function attributeCompletion(word: string, attributes: Ch5Attribute[]): CompletionList {
    const completions = CompletionList.create([], false);
    
    // if data then provide suggestions
    if (attributes.length > 0) {
        for (let attribute of attributes) {
            if ( attribute['name'].indexOf(word) !== -1 ) {
                const autocompleteItem = {
                    label: attribute.name,
                    kind: CompletionItemKind.Value,
                    insertText: attribute.name + '="${1}"',
                    insertTextFormat: InsertTextFormat.Snippet,
                    detail:'',
                    documentation: attribute.documentation.join('\n')
                };
                completions.items.push(autocompleteItem);
            }
        }
    }

    return completions;
}


/**
 * Gets suggestion values of an attribute
 * 
 * @param attribute 
 */
function getAttributeValues(attribute: Ch5Attribute): string[] {
    const values = [];
    
    if (attribute && 
        attribute.hasOwnProperty('value') && 
        typeof attribute['value'] !== 'undefined' 
    ) {
        for ( let value of attribute['value'] ) {
            values.push(value);
        }
    }

    return values;
}
