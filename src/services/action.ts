// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

'use strict';

import { TextEdit, CodeAction, Command, CodeActionKind } from "vscode-languageserver";
import { Problem } from "../types/lint";

interface ActionInterface {
    title: string;
    edit: TextEdit;
    problem: Problem;
}

export class Action implements ActionInterface {
	public constructor(public title: string, public edit: TextEdit, public problem: Problem) {}
}

export class CodeActionCreator{
    static make(actions: Action[]): CodeAction[] {
        let codeAction: CodeAction[] = [];

        for(let action of actions) {
            let command = Command.create(
                action.title, 
                '_ch5.applyTextEdits', 
                action.problem.documentUri, 
                action.problem.documentVersion, 
                [action.edit]
            );
        
            codeAction.push(CodeAction.create(
                action.title,
                command,
                CodeActionKind.QuickFix
            ));
        }

        return codeAction;
    }
}
