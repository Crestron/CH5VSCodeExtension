// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { readFile as fsReadFile, writeFile as fsWriteFile }  from 'fs';

/**
 * Read file by specified filepath;
 */
export function readFile(filepath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fsReadFile(filepath, (err, data) => {
			if (err) {
				return reject(err);
			}

			resolve(data.toString());
		});
	});
}

/**
 * Write file file by specified filepath;
 */
export function writeFile(filepath: string, body: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fsWriteFile(filepath, body, (err) => {
			if (err) {
				return reject(err);
			}

			resolve(body);
		});
	});
}
