// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path = require('path');
import * as vscode from 'vscode';
import { Position, Range } from 'vscode';

const COMMAND = 'cpp-quick-fix.command';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('cpp', new CppQuickFix(), {
			providedCodeActionKinds: CppQuickFix.providedCodeActionKinds
		}));
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND, async (document: vscode.TextDocument, range: vscode.Range) => {

			if (!vscode.window.activeTextEditor) {
				return false;
			}
			let nowEditor: vscode.TextEditor = vscode.window.activeTextEditor;


			if (!document.fileName.endsWith('h')) {
				return false; // 只作用于header文件
			}
			// const start = range.start;
			// const line = document.lineAt(start.line);
			// if (line.text.endsWith(';')) {
			// 	return false; // 以;结尾的函数，说明不是在header中实现的，所以不移动
			// }
			// if (line.text.endsWith('{')) {
			// 	return true;
			// }
			// if (line.lineNumber + 1 > document.lineCount) {
			// 	return false;
			// }
			// var nextLine = document.lineAt(line.lineNumber + 1);
			// var nextText = nextLine.text.replace(/(^\s*)|(\s*$)/g, "");// 去首尾空格
			// while (nextText === '') {
			// 	nextLine = document.lineAt(nextLine.lineNumber + 1);
			// 	nextText = nextLine.text.replace(/(^\s*)|(\s*$)/g, "");// 去首尾空格
			// 	if (nextLine.lineNumber + 1 > document.lineCount) {
			// 		return false;
			// 	}
			// }
			// if (nextText.startsWith("{")) {
			// 	return true;
			// }
			// return false;


			// get function text;

			// let functionText: string = '';

			const startLine = document.lineAt(range.start.line);
			let functionRange: vscode.Range = startLine.range;
			{
				let bracesNumber = 0;
				var tmpLine = startLine;
				var tmpStarted = false;
				while (bracesNumber > 0 || !tmpStarted) {
					let a = tmpLine.text.split("{").length;
					let b = tmpLine.text.split("}").length;
					if (a > 1 || b > 1) {
						tmpStarted = true;
					}
					bracesNumber += a - b;
					// functionText += tmpLine.text;
					functionRange = new vscode.Range(functionRange.start.line, functionRange.start.character, tmpLine.range.end.line, tmpLine.range.end.character);
					tmpLine = document.lineAt(tmpLine.range.start.line + 1);
				}
			}
			let functionText = document.getText(functionRange);
			// vscode.window.showInformationMessage("functionText" + t);

			// let r = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(nowEditor.document.lineCount + 1, 0));

			// get header text;
			let headerText = getHeaderString(functionText);
			if (headerText === '') {
				vscode.window.showErrorMessage("get header function has error");
				return false;
			}




			// get class name
			let className = getClassName(document, range);
			if (className === '') {
				vscode.window.showErrorMessage("get className has error");
				return false;
			}
			// get cpp text;
			let cppText = getSourceString(functionText, className);
			if (cppText === '') {
				vscode.window.showErrorMessage("get source string has error");
				return false;
			}
			vscode.window.showInformationMessage("functionText" + cppText);

			let cppFileName = path.dirname(document.fileName) + '/' + path.basename(document.fileName, ".h") + '.cpp';

			// replace header text;

			nowEditor?.edit(editBuilder => {
				editBuilder.replace(functionRange, headerText);
			});

			// go to cpp 

			const doc: vscode.TextDocument = await vscode.workspace.openTextDocument(cppFileName);
			if (!vscode.window.activeTextEditor) {
				return false;
			}
			let foundEditor: boolean = false;

			vscode.window.visibleTextEditors.forEach(async (editor, index, array) => {
				if (editor.document === doc && !foundEditor) {
					foundEditor = true;
					nowEditor = await vscode.window.showTextDocument(doc, editor.viewColumn);
				}
			});
			if (!foundEditor) {
				nowEditor = await vscode.window.showTextDocument(doc);
			}
			// add cpp text;
			nowEditor?.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(nowEditor.document.lineCount, 0), cppText);
			});

			return true;

		})
	);
}

export class CppQuickFix implements vscode.CodeActionProvider {

	// public static readonly providedCodeActionKinds = [
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		if (!this.isCppFunctionInH(document, range)) {
			return;
		}
		const moveDefinitionAction = this.moveDefinition(document, range);
		return [
			moveDefinitionAction
		];
	}


	// 判断是不是头文件中的function。
	private isCppFunctionInH(document: vscode.TextDocument, range: vscode.Range) {
		if (!document.fileName.endsWith('h')) {
			return false; // 只作用于header文件
		}
		const start = range.start;
		const line = document.lineAt(start.line);
		if (line.text.endsWith(';')) {
			return false; // 以;结尾的函数，说明不是在header中实现的，所以不移动
		}
		if (line.text.endsWith('{')) {
			return true;
		}
		if (line.lineNumber + 1 > document.lineCount) {
			return false;
		}
		var nextLine = document.lineAt(line.lineNumber + 1);
		var nextText = nextLine.text.replace(/(^\s*)|(\s*$)/g, "");// 去首尾空格
		while (nextText === '') {
			nextLine = document.lineAt(nextLine.lineNumber + 1);
			nextText = nextLine.text.replace(/(^\s*)|(\s*$)/g, "");// 去首尾空格
			if (nextLine.lineNumber + 1 > document.lineCount) {
				return false;
			}
		}
		if (nextText.startsWith("{")) {
			return true;
		}
		return false;
	}

	private moveDefinition(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Move Definition To ` + path.basename(document.fileName, '.h') + `.cpp`, vscode.CodeActionKind.QuickFix);
		fix.command = { command: COMMAND, title: 'Move Definition', tooltip: 'Move Definition', arguments: [document, range] };
		return fix;
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getHeaderString(text: string): string {
	return text.split('{')[0].trim() + ';';
}
function getSourceString(text: string, className: string): string {
	if (className === '') {
		return '';
	}
	// let allArray = text.split('')
	let allArray = text.split(/[\r\n]+/);
	let startLine = allArray[0];
	let startArray = startLine.split('(');
	let functionArray = startArray[0].split(' ');
	// let functionName = functionArray[functionArray.length - 1];
	// functionName = className + "::" + functionName;


	let tmptext = '';
	for (let index = 0; index < functionArray.length; index++) {
		const str = functionArray[index];
		if (index === functionArray.length - 1) {
			tmptext += className + "::" + str;
			continue;
		}
		tmptext += str + ' ';
	}
	console.log(tmptext);

	for (let i = 0; i < startArray.length; i++) {
		const str = startArray[i];
		if (i === 0) {
			continue;
		}
		tmptext += '(' + str;
	}
	for (let ii = 0; ii < allArray.length; ii++) {
		const srt = allArray[ii];
		if (ii === 0) {
			continue;
		}
		tmptext += '\r\n' + srt;
	}
	return tmptext;
	return '';
}
function getClassName(docuemnt: vscode.TextDocument, range: vscode.Range): string {
	let currentRange = range;
	let tmptext = docuemnt.getText(currentRange);
	while (!tmptext.includes('class ')) {
		if (currentRange.start.line - 1 < 0) {
			return '';
		}

		// let text = docuemnt.getText(currentRange);
		currentRange = docuemnt.lineAt(currentRange.start.line - 1).range;
		tmptext = docuemnt.getText(currentRange);
		console.log(tmptext);
	}

	if (tmptext.includes('class ')) {
		let cn = tmptext.split(':')[0].trim().split(' ');
		console.log(cn.length);
		let className = cn[cn.length - 1];
		console.log(className);
		return className;

	}
	return '';
}

