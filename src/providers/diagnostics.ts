// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { getLanguageService as getHTMLLanguageService, Scanner, TokenType, LanguageService } from 'vscode-html-languageservice';
import { Connection, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from 'vscode-languageserver-textdocument';


import { Ch5Settings } from "../types/settings";
import { DataTypePrefix } from '../types/prefix';
import { lintRules } from '../types/lintRules';
import { Ch5Attribute } from '../types/metadata';

import { Ch5Cache } from '../services/cache';

import { isCh5Element, hasQuotes } from '../utils/helpers';
import { globalEventHandlers } from '../utils/globalEventHandlers';

import { findBestMatch } from 'string-similarity';
import { isMatch } from "micromatch";

// Do diagnostics
export async function doDiagnostics(document: TextDocument, cache: Ch5Cache, connection: Connection, settings: Ch5Settings): Promise<void> {
    const htmlLanguageService: LanguageService = getHTMLLanguageService();

    let probNr = 0;
    let diagnostics: Diagnostic[] = [];

    // List of custom attributes for diagnostic. Accepted also wildcard
    const includeCustomAttributeRules = settings.customAttributesInclude || [];

    let currentTag: string = '';
    let currentAttributeName: string = '';
    let dataType: DataTypePrefix = DataTypePrefix.Ch5;

    let scanner: Scanner = htmlLanguageService.createScanner(document.getText());
    let token: TokenType = scanner.scan();
    let unitTypes: string[] = [];

    const unitMatchPath = new RegExp('^(?:\\d+)(\\D\\w{1,2})$');
    const sizeAttributePath = new RegExp('(height|width)');
    const standardUnitTypes = {
        px: 'px',
        vw: 'viewport',
        vh: 'viewport'
    }

    // DIAGNOSTIC START
    while (token !== TokenType.EOS && probNr < settings.maxNumberOfProblems) {
        switch (token) {
            case TokenType.StartTag:
                currentTag = scanner.getTokenText();

                // if not ch5 element switch data type to html-elements
                if (!isCh5Element(currentTag, cache)) {
                    dataType = DataTypePrefix.Html;
                } else {
                    dataType = DataTypePrefix.Ch5;
                }
                unitTypes = [];
                break;
            // provide diagnostics for attributes names
            case TokenType.AttributeName:
                // provide diagnostics for ch5 elements
                if (isCh5Element(currentTag, cache)) {
                    const cachedAttributes = cache.getElementAttributes(currentTag, DataTypePrefix.Ch5);
                    const attributesName = cachedAttributes.map(attribute => attribute.name).concat(globalEventHandlers);
                    const lowerCaseTokenText = scanner.getTokenText().toLowerCase();
                    let validAttribute: boolean = true;

                    // find best match from list of metadata attributes of current attribute
                    const match = findBestMatch(lowerCaseTokenText, attributesName);

                    // only provide diagnostic if best match rating is over stringDistanceRatingAllowance(default 0.3)
                    if (match.bestMatch.rating !== 1 && match.bestMatch.rating >= settings.stringDistanceRatingAllowance) {
                        validAttribute = false;
                    }

                    if (lowerCaseTokenText.startsWith('aria-') || lowerCaseTokenText.startsWith('data-')) {
                        validAttribute = true;
                    }

                    const attribute = cachedAttributes.find((attribute) => {
                        return attribute.name.toLowerCase() === scanner.getTokenText().toLowerCase();
                    });
                    if (attribute && attribute.hidden) {
                        validAttribute = false;
                    }

                    if (!validAttribute) {
                        probNr++;
                        let diagnostic: Diagnostic = {
                            code: lintRules.invalidAttribute.id,
                            severity: lintRules.invalidAttribute.level,
                            range: {
                                start: document.positionAt(scanner.getTokenOffset()),
                                end: document.positionAt(scanner.getTokenEnd())
                            },
                            message: `'${scanner.getTokenText()}' is not a valid attribute for element '${currentTag}'.`,
                            source: 'crestron',
                        };

                        diagnostics.push(diagnostic);
                    }
                    // provide diagnostics for ch5 custom attributes
                } else {
                    const cachedAttributes = cache.getElementAttributes(currentTag, DataTypePrefix.Html);
                    let validAttribute: Ch5Attribute | boolean = true;

                    // ignore attributes like those of Angular
                    for (const rule of includeCustomAttributeRules) {
                        if (isMatch(scanner.getTokenText().toLocaleLowerCase(), rule)) {
                            validAttribute = cachedAttributes.find(function (attribute) {
                                return attribute.name.toLocaleLowerCase() === scanner.getTokenText().toLocaleLowerCase();
                            });
                        }
                    }

                    const attribute = cachedAttributes.find((attribute) => {
                        return attribute.name.toLowerCase() === scanner.getTokenText().toLowerCase();
                    });
                    if (attribute && attribute.hidden) {
                        validAttribute = false;
                    }

                    if (!validAttribute) {
                        probNr++;
                        let diagnostic: Diagnostic = {
                            code: lintRules.invalidAttribute.id,
                            severity: lintRules.invalidAttribute.level,
                            range: {
                                start: document.positionAt(scanner.getTokenOffset()),
                                end: document.positionAt(scanner.getTokenEnd())
                            },
                            message: `'${scanner.getTokenText()}' is not a valid custom ch5 attribute for element '${currentTag}'.`,
                            source: 'crestron',
                        };

                        diagnostics.push(diagnostic);
                    }
                }

                // save attribute name
                currentAttributeName = scanner.getTokenText();
                break;
            // provide diagnostics for attributes values
            case TokenType.AttributeValue:
                const attribute = cache.getAttribute(currentAttributeName, currentTag, dataType);
                let attributeValue = scanner.getTokenText();
                let standardUnitType: string;

                const unitType = attributeValue.replace(/"/g, '').match(unitMatchPath);

                if (isCh5Element(currentTag, cache) && attribute !== undefined && sizeAttributePath.test(attribute.name)) {
                    if (unitType !== null && unitTypes.length === 0) {
                        standardUnitType = standardUnitTypes[unitType[1]];
                        unitTypes.push(standardUnitType);
                    } else if (unitType !== null && unitTypes.length > 0) {
                        standardUnitType = standardUnitTypes[unitType[1]];
                        if (unitTypes.indexOf(standardUnitType) < 0) {
                            let diagnostic: Diagnostic = {
                                code: lintRules.invalidAttribute.id,
                                severity: lintRules.invalidAttribute.level,
                                range: {
                                    start: document.positionAt(scanner.getTokenOffset()),
                                    end: document.positionAt(scanner.getTokenEnd())
                                },
                                message: `'${scanner.getTokenText()}' size unit type is not the same for all attributes. Keep going with '${unitTypes[0]}' unit type. `,
                                source: 'crestron',
                            };
                            diagnostics.push(diagnostic);
                        }
                    }
                }

                let startPosition = document.positionAt(scanner.getTokenOffset());
                let endPosition = document.positionAt(scanner.getTokenEnd());

                // check to see if attribute value has quotes
                if (hasQuotes(attributeValue)) {
                    attributeValue = attributeValue.replace(/["']/g, "");

                    startPosition.character = startPosition.character + 1;
                    endPosition.character = endPosition.character - 1;
                }

                if (attribute && attribute.hasOwnProperty('value') && attribute.value.length > 0) {
                    let validValue = attribute.value.find(value => {
                        return value === attributeValue;
                    });

                    if (!validValue) {
                        probNr++;

                        let diagnostic: Diagnostic = {
                            code: lintRules.invalidAttributeValue.id,
                            severity: lintRules.invalidAttributeValue.level,
                            range: {
                                start: startPosition,
                                end: endPosition
                            },
                            message: `'${attributeValue}' is not a valid value for attribute '${currentAttributeName}'.`,
                            source: 'crestron'
                        };

                        diagnostics.push(diagnostic);
                    }
                }
                break;
            default:
                break;
        }

        token = scanner.scan();
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}
