let fs = require("fs");
let path = require('path');


function deleteFolderRecursive(folderPath) {
	if (fs.existsSync(folderPath)) {
		fs.readdirSync(folderPath).forEach((file) => {
			const curPath = path.join(folderPath, file);

			if (fs.lstatSync(curPath).isDirectory()) {
				// Recursive call for directories
				deleteFolderRecursive(curPath);
			} else {
				// Delete file
				fs.unlinkSync(curPath);
			}
		});

		// Delete the empty folder
		fs.rmdirSync(folderPath);
	}
}
exports.deleteFolderRecursive = deleteFolderRecursive;

function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gopherjsre" is now active!');

	let disposable = vscode.commands.registerCommand('gopherjsre.splitfiles', function () {

		console.log('Splitting files');
		splitFiles();

	});
	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('gopherjsre.decompileSingleFile', function () {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			vscode.commands.executeCommand('compile-hero.beautify').then(() => {
				// rename symbols such as:    A = $packages["fmt"];
				renamePackagesSymbols();
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