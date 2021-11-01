// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { subscribeToDocumentChanges, EMOJI_MENTION } from './diagnostics';

const COMMAND = 'cpp-quick-fix.command';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('markdown', new Emojizer(), {
			providedCodeActionKinds: Emojizer.providedCodeActionKinds
		}));

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('cpp', new CppQuickFix(), {
			providedCodeActionKinds: CppQuickFix.providedCodeActionKinds
		}));



	// const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
	// context.subscriptions.push(emojiDiagnostics);

	// subscribeToDocumentChanges(context, emojiDiagnostics);

	// // context.subscriptions.push(
	// // 	vscode.languages.registerCodeActionsProvider('markdown', new Emojinfo(), {
	// // 		providedCodeActionKinds: Emojinfo.providedCodeActionKinds
	// // 	})
	// // );

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND, ()=> {
			// TODO 实现把头文件中的funtion移动到cpp文件中的功能
			// vscode.env.openExternal(vscode.Uri.parse('https://unicode.org/emoji/charts-12.0/full-emoji-list.html'));
			// vscode.env.appName;
			vscode.window.showInformationMessage('TODO fix ' + COMMAND + '!');
		})
	);


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cpp-quick-fix" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cpp-quick-fix.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from cpp-quick-fix!');
	});

	context.subscriptions.push(disposable);


}

export class CppQuickFix implements vscode.CodeActionProvider {

	// public static readonly providedCodeActionKinds = [
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		// throw new Error('Method not implemented.');

		if (!this.isCppFunctionInH(document, range)) {
			return;
		}

		// FIXME get base name
		const fix = new vscode.CodeAction(`Move Definition to` + document.fileName +`.cpp`, vscode.CodeActionKind.QuickFix);
		fix.command = { command: COMMAND, title: 'Move definition to cpp'};

		const moveDefinitionToCppfile = fix;


		return [
			moveDefinitionToCppfile
		];
	}


	// TODO: 判断是不是头文件中的function。
	private isCppFunctionInH(document: vscode.TextDocument, range: vscode.Range) {
		// const start = range.start;
		// const line = document.lineAt(start.line);
		// return line.text[start.character] === ':' && line.text[start.character + 1] === ')';
		return true;
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, emoji: string): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${emoji}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, 2)), emoji);
		return fix;
	}

	private createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.Empty);
		action.command = { command: COMMAND, title: 'Learn more about emojis', tooltip: 'This will open the unicode emoji page.' };
		return action;
	}

}

export class Emojizer implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		if (!this.isAtStartOfSmiley(document, range)) {
			return;
		}

		const replaceWithSmileyCatFix = this.createFix(document, range, '😺');

		const replaceWithSmileyFix = this.createFix(document, range, '😀');
		// Marking a single fix as `preferred` means that users can apply it with a
		// single keyboard shortcut using the `Auto Fix` command.
		replaceWithSmileyFix.isPreferred = true;

		const replaceWithSmileyHankyFix = this.createFix(document, range, '💩');

		const commandAction = this.createCommand();

		return [
			replaceWithSmileyCatFix,
			replaceWithSmileyFix,
			replaceWithSmileyHankyFix,
			commandAction
		];
	}

	private isAtStartOfSmiley(document: vscode.TextDocument, range: vscode.Range) {
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] === ':' && line.text[start.character + 1] === ')';
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, emoji: string): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${emoji}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, 2)), emoji);
		return fix;
	}

	private createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.Empty);
		action.command = { command: COMMAND, title: 'Learn more about emojis', tooltip: 'This will open the unicode emoji page.' };
		return action;
	}
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class Emojinfo implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === EMOJI_MENTION)
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.QuickFix);
		action.command = { command: COMMAND, title: 'Learn more about emojis', tooltip: 'This will open the unicode emoji page.' };
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
