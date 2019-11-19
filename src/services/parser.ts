// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

// import { TextDocument, Files } from 'vscode-languageserver';
import { Ch5Element, Ch5Attribute, ElementsData, CommonData, Ch5Snippet } from '../types/metadata';
// import { Ch5Settings } from '../types/settings';

/**
 * Validate attribute
 * 
 * @param attribute 
 */
function validateAttribute(attribute: object): Ch5Attribute | undefined {
    let name: string;
    let value: string[];
    let documentation: string[];
    
    // check for required properties
    if ( !attribute.hasOwnProperty('name') ) {
        return undefined;
    } else {
        name = attribute['name'];
    }

    // check for value
    if ( attribute.hasOwnProperty('value') && typeof attribute['value'] === 'object' ) {
        value = attribute['value'];
    }

    // check for documentation
    if ( attribute.hasOwnProperty('documentation') && typeof attribute['value'] === 'object') {
        documentation = attribute['documentation'];
    }

    return {
        "name": name,
        "value": value,
        "documentation": documentation
    };
}

/**
 * Validate element
 * 
 * @param key 
 * @param elem 
 */
export function validateCh5Element(key: string, elem: any): Ch5Element {
    let attributes: Ch5Attribute[] = [];
    let description: string = '';
    let documentation: string[] = [];
    let snippets: Ch5Snippet[] = [];
    
    // check for required properties
    if ( !elem.hasOwnProperty('name') || !elem.hasOwnProperty('tagName') ) {
        throw new Error('Invalid element configuration with key: ' + key);
    }
   
    // check for attributes
    if ( elem.hasOwnProperty('attributes') ) {
        if ( typeof elem['attributes'] === "object" ) {
            for (let attribute of elem['attributes']) {
                const validAttribute = validateAttribute(attribute);

                if (validateAttribute) {
                    attributes.push(validAttribute);
                }
            }
        }
    }

    // check for description
    if ( elem.hasOwnProperty('description') && typeof elem.description === 'string') {
        description = elem['description'];
    }

    // check for documentation
    if ( elem.hasOwnProperty('documentation') ) {
        documentation = elem['documentation'];
    }

    // check for snippets
    if ( elem.hasOwnProperty('snippets') ) {
        snippets = elem['snippets'];
    }

    return {
        "name": elem.name,
        "tagName": elem.tagName,
        "attributes": attributes,
        "description": description,
        "documentation": documentation,
        "snippets": snippets
    };
}

/**
 * Parse data from json and validate
 * 
 * @param data 
 */
export function parseElementsData(data: any): ElementsData {
    const listOfElements: Ch5Element [] = [];
    const listOfCommonAttributes: Ch5Attribute[] = [];
    let excludeElements: string[];

    for(let key in data){
        switch(key) {
			case 'common' :
                const common: CommonData = data[key];
                
                if (common.hasOwnProperty('exclude') && common.exclude.length > 0) {
                    excludeElements = common.exclude;
                }

                if (common.hasOwnProperty('attributes')) {
                    for(let attribute of common.attributes) {
                        const validAttribute = validateAttribute(attribute);
                        listOfCommonAttributes.push(validAttribute);
                    }
                }

				break;
            case 'elements' :
                const elements: Ch5Element[] = data[key];
				for (let elementKey in data[key]) {
                    let element = validateCh5Element(elementKey, elements[elementKey]);
                    // push element to list of elements
                    listOfElements.push(element);
                }
				break;
			default: 
				break;
        }
    }

    return {
        common: {
            exclude: excludeElements,
            attributes: listOfCommonAttributes
        },
        elements: listOfElements
    };
}
