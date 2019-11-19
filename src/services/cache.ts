// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { ElementsData, Ch5Element, Ch5Attribute, Ch5Snippet } from '../types/metadata';
import { DataTypePrefix } from '../types/prefix';

export interface Ch5Cache {
    has: (uri: string) => boolean;
    get: (uri: string) => ElementsData;
    getElement: (name: string, uri: DataTypePrefix) => Ch5Element | undefined;
    getCh5ElementsByIncompleteTagName: (incompleteTagName: string) => Ch5Element[];
    getAttribute: (name: string, tag: string, uri: DataTypePrefix) => Ch5Attribute | undefined;
    getElementAttributes: (tag: string, uri: DataTypePrefix) => Ch5Attribute[] | undefined;
    getSnippets: () => Ch5Snippet[];
    set: (uri: string, element: ElementsData) => void;
    drop: (uri: string) => void;
    dispose: () => void;
    storage: () => object;
    keys: () => string[];
}

/**
 * Returns Cache storage.
 */
export function getCacheStorage(): Ch5Cache {
    let storage: object = {};

    return {
        has: (uri: DataTypePrefix) => {
            return storage.hasOwnProperty(uri);
        },
        get: (uri: DataTypePrefix) => {
            return storage[uri] || null;
        },
        set: (uri: string, data: ElementsData) => {
            storage[uri] = data;
        },
        getAttribute: (name: string, tag: string, uri: DataTypePrefix): Ch5Attribute | undefined => {
            const data: ElementsData = storage[uri];

            // get common attributes
            function getCommonAttributes(): Ch5Attribute[] | undefined {
                if (data && data.hasOwnProperty('common') && typeof data.common !== 'undefined') {
                    let common = data.common;
                    let exclude = common.exclude;

                    if (common.hasOwnProperty('attributes') && typeof common.attributes !== 'undefined') {
                        // exclude common attributes if element excluded
                        if (exclude && exclude.indexOf(tag) !== -1) {
                            return undefined;
                        }

                        return common.attributes;

                    }
                }

                return undefined;
            }

            const commonAttributes = getCommonAttributes();
            let allAttributes: Ch5Attribute[];

            // check for elements
            if (data && data.hasOwnProperty('elements') && data.elements.length > 0) {
                const elements = data.elements;

                for (let element of elements) {
                    if (element.tagName === tag && element.hasOwnProperty('attributes')) {
                        allAttributes = element.attributes;

                        // add common attributes to element attributes
                        if (commonAttributes) {
                            allAttributes = element.attributes.concat(commonAttributes);
                        }
                    }
                }
            }
            // common attributes if no element 
            else {
                allAttributes = commonAttributes;
            }


            if (allAttributes) {
                let found = allAttributes.find((attribute) => {
                    return attribute.name === name;
                });

                return found;
            }

            return undefined;
        },
        getElementAttributes: (tag, uri) => {
            const data: ElementsData = storage[uri];

            if (data) {
                let common = data.hasOwnProperty('common') ? data.common : null;
                let exclude: string[] = common.hasOwnProperty('exclude') ? common.exclude : [];
                let elements: Ch5Element[] = data.hasOwnProperty('elements') ? data.elements : [];
                let commonAttributes: Ch5Attribute[] = common.hasOwnProperty('attributes') ? common.attributes : [];

                // exclude common attributes if element excluded
                if (exclude && exclude.indexOf(tag) !== -1) {
                    commonAttributes = [];
                }

                let allAttributes: Ch5Attribute[] = [];
                // if data then provide suggestions for elements
                if (elements.length > 0) {
                    for (const element of elements) {
                        if (element.tagName === tag && element.hasOwnProperty('attributes')) {
                            let currentAttributes = element.attributes;

                            allAttributes = currentAttributes.concat(commonAttributes);
                        }
                    }
                }
                // if no elements then provide common attributes for all html elements
                else {
                    allAttributes = commonAttributes;
                }

                return allAttributes;
            }

            return undefined;
        },
        getElement: (name, uri) => {
            const data: ElementsData = storage[uri];

            if (data && data.hasOwnProperty('elements')) {
                let element = data.elements.find((element) => {
                    return element.tagName === name;
                });

                return element;
            }

            return undefined;
        },
        getCh5ElementsByIncompleteTagName: (incompleteTagName: string) => {
            const data: ElementsData = storage[DataTypePrefix.Ch5];
            if (data.hasOwnProperty('elements')) {
                return data.elements.filter((e: Ch5Element) => e.tagName.indexOf(incompleteTagName) === 0);
            }
            return [];
        },
        getSnippets: () => {
            let snippets: Ch5Snippet[] = [];

            for (let key in storage) {
                const elementsData: ElementsData = storage[key];

                // check for elements snippets  
                if (elementsData.hasOwnProperty('elements')) {
                    let elements = elementsData.elements;

                    // loop through elements and check for snippets
                    for (let element of elements) {
                        if (element.hasOwnProperty('snippets')) {
                            // loop through snippets
                            for (let key in element.snippets) {
                                snippets.push(element.snippets[key]);
                            }
                        }
                    }
                }
            }

            return snippets;
        },
        dispose: () => {
            storage = {};
        },
        drop: (uri: DataTypePrefix) => {
            if (storage.hasOwnProperty(uri)) {
                delete storage[uri];
            }
        },
        storage: () => storage,
        keys: () => Object.keys(storage)
    };
}

/**
 * Cache invalidation. Removes items from the Cache when they are no longer available.
 */
export function clearCacheStorage(cache: Ch5Cache): void {
    const storage = cache.storage();

    Object.keys(storage).forEach((key) => {
        cache.drop(key);
    });
}
