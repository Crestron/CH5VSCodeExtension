// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { TextDocument, Range, Position } from 'vscode-languageserver';
import { Ch5Cache } from '../services/cache';

import { Ch5Element } from '../types/metadata';
import { DataTypePrefix } from '../types/prefix';

import { getWordAtText, createWordRegExp} from './wordHelper';


// reg expresions
const wordRegex = createWordRegExp();

/**
 * Check for an element if is ch5 element
 */
export function isCh5Element(elementName: string, cache: Ch5Cache): boolean {
    let found: boolean = false;
    const ch5Data = cache.get(DataTypePrefix.Ch5);

    if (ch5Data.hasOwnProperty('elements')) {
        const elements: Ch5Element[] = ch5Data.elements;
        
        for (const element of elements) {
            if (element.hasOwnProperty('tagName') && element.tagName === elementName) {
                found = true;
            }
        }
    }

    return found;
}

/**
 * Get Ch5Elements tag names list
 * @param cache 
 */
export function getCh5ElementsTagNames(cache: Ch5Cache): string[] {
    const ch5Data = cache.get(DataTypePrefix.Ch5);
    return ch5Data.hasOwnProperty('elements') 
        ? ch5Data.elements.map((e: Ch5Element) => e.tagName)
        : [];
}

/**
 * Validate partial tag name if it could match a ch5 element
 * 
 * @param elNameStart 
 * @param cache 
 */
export function couldBeCh5Element(elNameStart: string, elementsTagNames: string[]): boolean {
    const ch5TagFound = elementsTagNames.find((elTagName: string) => elTagName.indexOf(elNameStart) === 0);
    return !!ch5TagFound;
}

export function ch5OpenTagComplete(tag: string, elementsTagNames: string[]): boolean {
    const ch5FullTagName = elementsTagNames.find((elTagName: string) => elTagName === tag);
    return !!ch5FullTagName;
}


/**
 * Get a word-range at the given position.
 */ 
export function getWordRangeAtPosition(text: string, position: Position): Range {
    let wordAtText = getWordAtText(
        position.character + 1,
        wordRegex,
        text,
        0
    );

    if (wordAtText) {
        return Range.create(position.line, wordAtText.startColumn - 1, position.line, wordAtText.endColumn - 1);
    }
    
    return undefined;
}

/**
 * Get text for an entire line
 */
export function getLineText(document: TextDocument, position: Position): string {
    const startPosition: Position = Position.create(position.line, 0);
    const endPosition: Position = Position.create(position.line + 1, 0);
    const lineRange: Range = Range.create(startPosition, endPosition); 
    const lineText: string = document.getText(lineRange);

    return lineText;
}

/**
 * Check if an object is empty
 * 
 * @param obj 
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Check for quotes in a string
 * 
 * @param string 
 */
export function hasQuotes(string: string): boolean {
    const regex = /(['"])/g;
    let m;

    while ((m = regex.exec(string)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        return true;
    }

    return false;
}
