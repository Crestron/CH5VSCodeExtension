// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import {
	Hover, Files, Position, MarkupContent, MarkupKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { 
    getLanguageService as getHTMLLanguageService, HTMLDocument, Node, LanguageService, TokenType, Scanner 
} from 'vscode-html-languageservice';

import { Ch5Element, Ch5Attribute, Deprecated } from '../types/metadata';
import { Ch5Cache } from '../services/cache';
import { DataTypePrefix } from '../types/prefix';

import { isCh5Element, isEmpty} from '../utils/helpers';

/**
 * Do Hover 
 */
export function doHover(document: TextDocument, position: Position, cache: Ch5Cache): Hover | null {
    const documentPath = Files.uriToFilePath(document.uri) || document.uri;
    
    if (!documentPath || isEmpty(cache.storage())) {
		return null;
    }

    const offset: number = document.offsetAt(position);
    const htmlLanguageService: LanguageService = getHTMLLanguageService();
    const htmlDocument: HTMLDocument = htmlLanguageService.parseHTMLDocument(document);
    const node: Node = htmlDocument.findNodeAt(offset);

    if (!node) {
        return null;
    }
    
    const tagName: string | null = node.hasOwnProperty('tag') ? node.tag :  null;
    if (!tagName) {
        return null;
    }

    let dataType = DataTypePrefix.Ch5;
    if (!isCh5Element(tagName, cache)) {
        dataType =  DataTypePrefix.Html;
    }

    let element = cache.getElement(tagName, dataType);
    let attributes = cache.getElementAttributes(tagName, dataType);
    let scanner: Scanner = htmlLanguageService.createScanner(document.getText(), node.start);
    let token: TokenType = scanner.scan();

    while (token !== TokenType.EOS && scanner.getTokenOffset() <= offset) {
        switch (token) {
             // hover for start tag elements
            case TokenType.StartTag: 
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    return getElementDocumentation(element);
                }
                break;
            // hover for attribute name
            case TokenType.AttributeName:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    let attribute = attributes.find((attribute) => {
                        return attribute.name.toLowerCase() === scanner.getTokenText().toLowerCase();
                    });

                    return getAttributeDocumentation(attribute);
                }
                break;
            // hover for end tag elements
            case TokenType.EndTag: 
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    return getElementDocumentation(element);
                }
                break;
            default:
                if (offset <= scanner.getTokenEnd()) {
                    return null;
                }
                break;
        }

        token = scanner.scan();
    }

    return null;
}



/**
 * Get tag hover documentation
 * 
 * @param elementName 
 * @param element 
 */
function getElementDocumentation(element: Ch5Element): Hover {
    // Content for Hover popup
    let contents: MarkupContent = {
        kind: MarkupKind.Markdown,
        value: ''
    };

    if (element && element.hasOwnProperty('documentation')) {
        contents.value =  element['documentation'].join('\n');
    }
    
    return {
		contents
	};
}

/**
 * Get attribute hover documentation
 * 
 * @param attributeName 
 * @param elementName 
 * @param element 
 */
function getAttributeDocumentation(attribute: Ch5Attribute): Hover {
    // Content for Hover popup
    let contents: MarkupContent = {
        kind: MarkupKind.Markdown,
        value: ''
    };
    
    // check if attribute has documentation 
    if (attribute && attribute.hasOwnProperty('documentation') && typeof attribute.documentation !== 'undefined') {
        contents.value = attribute['documentation'].join('\n');
    }

    // check if attribute has deprecated 
    if (attribute && attribute.hasOwnProperty('deprecated') && typeof attribute.deprecated !== 'undefined') {
        const deprecatedDocs = attribute['deprecated'];
        const stringifiedDeprecated = JSON.stringify(deprecatedDocs);

        const versionIndex = stringifiedDeprecated.indexOf('version');
        const version = stringifiedDeprecated.substring(versionIndex + 'version'.length + 3, stringifiedDeprecated.indexOf(',') - 1);

        const descriptionIndex = stringifiedDeprecated.indexOf('description');
        const description = stringifiedDeprecated.substring(descriptionIndex + 'description'.length + 3, stringifiedDeprecated.length - 2);

        contents.value = contents.value + '\n' + description + ' Deprecated since version ' + version;
    }

    return {
		contents
	};
}
