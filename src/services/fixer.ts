// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import {CodeAction, TextEdit} from "vscode-languageserver";

import { findBestMatch } from 'string-similarity';

import { Rule, Problem } from "../types/lint";
import { lintRules} from "../types/lintRules";

import { Action, CodeActionCreator } from "./action";

interface FixCreator {
	(problem): CodeAction[];
}

let fixes = new Map<string, FixCreator>();

// Invalid attribute fixer
let invalidAttributeFixer: FixCreator = (problem: Problem): CodeAction[] | undefined => {    
    function getBestMatch(): string {
        // compare attribute names from metadata with attribute names from node and get difference
        const suggestions = problem.node.allAttributes.filter(x => problem.node.currentAttributes.indexOf(x) === -1);
        const match = findBestMatch(problem.context, suggestions);

        return  match.bestMatch.target;
    }
    
    const diagnostic = problem.diagnostic;

    if (diagnostic) {
        const attributeName = problem.context;
        const bestMatch = getBestMatch();

        const actions = [
            new Action( 
                `Remove declaration for: '${attributeName}'`, 
                TextEdit.del(diagnostic.range),
                problem
            ),
            new Action(
                `Change spelling to: '${bestMatch}'`,
                TextEdit.replace(diagnostic.range, bestMatch),
                problem
            )
        ];

        return CodeActionCreator.make(actions);
    }

    return undefined;
};
fixes[lintRules.invalidAttribute.id] = invalidAttributeFixer;


//Invalid attribute value fixer
let invalidAttributeValueFixer: FixCreator = (problem: Problem): CodeAction[] | undefined => {
    let codeAction: CodeAction[] = [];
    const diagnostic = problem.diagnostic;
    
    if (diagnostic) {
        const context = problem.context;

        const actions = [
            new Action( 
                `Remove declaration for: '${context}'`, 
                TextEdit.del(diagnostic.range),
                problem
            ),
        ];

        return CodeActionCreator.make(actions);
    }

    return codeAction;
};
fixes[lintRules.invalidAttributeValue.id] = invalidAttributeValueFixer;

/**
 * Create code action for rule failure
 * 
 * @param rule 
 * @param problem 
 */
export function createFixForProblem(rule: Rule, problem: Problem): CodeAction[] | undefined {
	let creator = fixes[rule.id];
    
    if (creator) {
		return creator(problem);
    }
    
	return undefined;
}
