// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { Rule } from "../types/lint";
import { DiagnosticSeverity } from "vscode-languageserver";

export let lintRules = {
    invalidAttribute: new Rule('invalidAttribute', DiagnosticSeverity.Warning),
    invalidAttributeValue: new Rule('invalidAttributeValue', DiagnosticSeverity.Error),
    'css-colonexpected': new Rule('css-colonexpected', DiagnosticSeverity.Warning),
    'css-propertyvalueexpected': new Rule('css-propertyvalueexpected', DiagnosticSeverity.Warning)
};
