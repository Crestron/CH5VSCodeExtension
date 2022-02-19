// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import * as path from 'path';
import * as request from 'request';
import Ajv from 'ajv';
import { writeFile, readFile } from '../utils/fs';

import { Ch5Cache } from './cache';
import { Metadata } from '../types/metadata';

// Ajv validator
const schemaPath = path.join(__dirname, '../../schema/metadata.schema.json');
const ajv = new Ajv({ allErrors: true });

// Temp metadata path
const metadataPath = path.join(__dirname, '../../temp/metadata.json');

/**
 * Get metadata from url.
 * If error try to read local file
 * If status code is 200 then store data in a local file
 * If status code is 304 then try to read the local file 
 * 
 * @param url 
 */
function getMetadata(url): Promise<string> {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) { 
            // logic for error
            if (error) {
                readFile(metadataPath).then((dataFromFile) => {
                    resolve(dataFromFile);
                }).catch(() => {
                    reject('Cannot read metadata. Try again later');
                });

                return undefined;
            }

            // logic for 200 sCode
            if (response.statusCode === 200) {
                // store data in local file
                writeFile(metadataPath, body).then(() => {
                    console.log('Metadata file stored');
                }).catch((err) => {
                    reject(err);
                    return undefined;
                });

                return resolve(body);
            }

            // logic for 304 sCode
            if (response.statusCode === 304) {
                readFile(metadataPath).then((dataFromFile) => {
                    resolve(dataFromFile);
                }).catch(() => {
                    // if error in reading file or file not exist then use body for response
                    resolve(body);
                });
            }
        });
    });
}

/**
 * Make data from JSON file and store data in cache if any
 * 
 * @param cache 
 * @param body 
 * @param settings 
 */
function makeDataFromJSON(cache: Ch5Cache, metadata: any): Metadata {
    // save metadata in cache
    for (const key in metadata) {
        if (metadata.hasOwnProperty(key)) {
            const elementsData = metadata[key];

            cache.set(key, elementsData);
        }
    }

    return metadata;
}


export function doScannerUrl(url: string, cache: Ch5Cache): Promise<Metadata> {
    return new Promise((resolve, reject) => {
        getMetadata(url).then((data) => {
            const metadata = JSON.parse(data);
            const validateMetadata = ajv.compile(require(schemaPath));
            const valid = validateMetadata(metadata);

            if (!valid) {
                return reject(
                    ajv.errorsText(validateMetadata.errors)
                );
            }

            resolve(
                makeDataFromJSON(cache, metadata)
            );
        }).catch((err) => {
            reject(err);
        });
    });
}
