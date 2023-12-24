const vscode = require('vscode');
const util = require("./utils");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {


	console.log('Congratulations, your extension "gopherjsre" is now active!');





	let disposable = vscode.commands.registerCommand('gopherjsre.splitfiles', function () {

		console.log('Splitting files');
		util.splitFiles();
		vscode.window.showInformationMessage("Files splitted");

	});
	context.subscriptions.push(disposable);





	let disposable2 = vscode.commands.registerCommand('gopherjsre.decompileSingleFile', function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			vscode.commands.executeCommand('compile-hero.beautify').then(() => {
				// rename symbols such as:    A = $packages["fmt"];
				util.renamePackagesSymbols(editor).then(()=> {
					console.log("finished renaming packages");

					util.renameNewTypeSymbols(editor).then(()=> {
						console.log("finished renaming newTypeSymbols");

						util.renameTypeSymbols(editor).then(()=> {
							console.log("finished renaming other type symbols");

							util.renamePublicFunction(editor).then(()=> {
								console.log("finished renaming functions");
								util.commentOutBoilerplate(editor).then(()=> {
									console.log("finished commenting out boilerplate");
									vscode.window.showInformationMessage("File cleaned");
								});
							});
						});
					});
				});



			});
		} else {
			vscode.window.showInformationMessage("Open the file to decompile");
		}


	});
	context.subscriptions.push(disposable2);

}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}