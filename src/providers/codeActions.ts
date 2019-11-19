// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';
import {
    TextDocument, CodeActionContext, CodeAction
} from 'vscode-languageserver';

import { getLanguageService as getHTMLLanguageService,LanguageService, HTMLDocument, Node } from 'vscode-html-languageservice';

import { lintRules } from '../types/lintRules';
import { Rule, Problem } from '../types/lint';

import { isCh5Element } from '../utils/helpers';

import { createFixForProblem } from '../services/fixer';
import { Ch5Cache } from '../services/cache';
import { DataTypePrefix } from '../types/prefix';

export function doCodeAction(context: CodeActionContext, document: TextDocument, cache: Ch5Cache): CodeAction[] | undefined {
    const htmlLanguageService: LanguageService = getHTMLLanguageService();
    const htmlDocument: HTMLDocument = htmlLanguageService.parseHTMLDocument(document);

    if (context.diagnostics) {
        for (const diagnostic of context.diagnostics) {
            let context = document.getText(diagnostic.range);
            let rule: Rule = lintRules[diagnostic.code];
            let node: Node = htmlDocument.findNodeAt(document.offsetAt(diagnostic.range.start));
            let dataType: DataTypePrefix = DataTypePrefix.Ch5;
            // if not ch5 element switch data type to html-elements
            if (!isCh5Element(node.tag, cache)) {
                dataType = DataTypePrefix.Html;
            }
            let attributes = cache.getElementAttributes(node.tag, dataType);
           
            let problem: Problem = {
                node: {
                    allAttributes: attributes.map(attribute => attribute.name),
                    currentAttributes: node['attributeNames'],
                },
                context: context,
                diagnostic: diagnostic,
                documentVersion: document.version,
                documentUri: document.uri
            };
            
            return createFixForProblem(rule, problem);
        }
    }

    return undefined;
}
