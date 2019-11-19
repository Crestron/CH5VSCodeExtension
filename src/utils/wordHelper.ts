// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { IWordAtPosition } from '../types/word';

export const USUAL_WORD_SEPARATORS = '`~!@#$%^&*()=+[{]}\\|;:\'",.<>/?';

/**
 * Create a word definition regular expression based on default word separators.
 * Optionally provide allowed separators that should be included in words.
 *
 * The default would look like this:
 * /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
 */
export function createWordRegExp(allowInWords: string = ''): RegExp {
	let source = '(-?\\d*\\.\\d\\w*)|([^';
	for (let i = 0; i < USUAL_WORD_SEPARATORS.length; i++) {
		if (allowInWords.indexOf(USUAL_WORD_SEPARATORS[i]) >= 0) {
			continue;
		}
		source += '\\' + USUAL_WORD_SEPARATORS[i];
	}
	source += '\\s]+)';
	return new RegExp(source, 'g');
}

function getWordAtPos(column: number, wordDefinition: RegExp, text: string, textOffset: number): IWordAtPosition {
	// find whitespace enclosed text around column and match from there

	let pos = column - 1 - textOffset;
	let start = text.lastIndexOf(' ', pos - 1) + 1;
	let end = text.indexOf(' ', pos);
	if (end === -1) {
		end = text.length;
	}

	wordDefinition.lastIndex = start;
	let match: RegExpMatchArray;
	while (match = wordDefinition.exec(text)) {
		if (match.index <= pos && wordDefinition.lastIndex >= pos) {
			return {
				word: match[0],
				startColumn: textOffset + 1 + match.index,
				endColumn: textOffset + 1 + wordDefinition.lastIndex
			};
		}
	}

	return null;
}

/**
 * Get a IWordAtPosition based on regular expression.
 */
export function getWordAtText(column: number, wordDefinition: RegExp, text: string, textOffset: number): IWordAtPosition {
	// finding a word
	wordDefinition.lastIndex = 0;
	let match = wordDefinition.exec(text);

	if (!match) {
		return null;
	}
	
	const ret = getWordAtPos(column, wordDefinition, text, textOffset);
	// we reset the lastIndex
	wordDefinition.lastIndex = 0;

	return ret;
}
