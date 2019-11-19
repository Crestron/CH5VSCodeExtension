// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';

interface FailureRule {
    id: string;
    level: DiagnosticSeverity;
}

export class Rule implements FailureRule {

    public constructor(public id: string, public level: DiagnosticSeverity) {
        // nothing to do
    }
}

interface Ch5Node {
    allAttributes: string[];
    currentAttributes: string[];
    currentAttribute?: string;
}

export interface Problem {
    node: Ch5Node;
    context: string;
    diagnostic: Diagnostic;
    documentVersion: number;
    documentUri: string;
}
