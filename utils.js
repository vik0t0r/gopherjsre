let fs = require("fs");
let path = require('path');
const vscode = require('vscode');




function splitFiles() {
	const active = vscode.window.activeTextEditor;
	if (!active || !active.document) return;

	let text = active.document.getText().split("\n");
	let workingDirectory = path.dirname(active.document.uri.fsPath);
	let outputDir = workingDirectory + "/output/";

	text = text.slice(6, -10);
	// delete output path
	deleteFolderRecursive(outputDir);
	fs.mkdirSync(outputDir);

	// write each line to a file
	for (var line in text) {

		let lineString = text[line];
		let initNameIndex = lineString.indexOf('"') + 1;
		let lastNameIndex = lineString.indexOf('"', initNameIndex);

		// genereate path
		let filePath = lineString.slice(initNameIndex, lastNameIndex);
		filePath = filePath.replaceAll("/", "_");
		filePath = filePath + ".js";
		filePath = outputDir + filePath;

		// write contents
		fs.writeFile(filePath, lineString, (err) => {
			if (err) {
				console.error(`Error writing to file: ${err}`);
			} else {
				// beautify code
			}
		});


	}
}


// rename symbols such as:    A = $packages["fmt"];
async function renamePackagesSymbols(editor) {
	// Get the entire document's text
	const documentText = editor.document.getText();

	// Specify the regular expression pattern
	const regexPattern = /(\w+)\s*=\s*\$packages\["([^"]+)"\];/g; // Replace with your regex pattern


	// Find matches using the regular expression
	const matches = documentText.matchAll(regexPattern);


	let counter = 0;
	if (matches) {
		// Loop through the matches and rename each symbol
		for (const match of matches) {
			counter += 1;

			const positionInfo = editor.document.positionAt(match.index);

			let finalName = match[2];

			let workspaceEdit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
				vscode.window.activeTextEditor.document.uri,
				positionInfo,
				finalName);

			vscode.workspace.applyEdit(workspaceEdit);

			
		};
		vscode.window.showInformationMessage(`Renamed ${counter} package symbols`);

	} else {
		vscode.window.showInformationMessage('No matches found for package symbols');
	}
}



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

module.exports = {
	splitFiles,
	renamePackagesSymbols
}