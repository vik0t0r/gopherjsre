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

	// Specify the regular expression pattern
	const regexPattern = /(\w+)\s*=\s*\$packages\["([^"]+)"\];/g;

	let documentText = editor.document.getText();
	// Find matches using the regular expression
	const matches = documentText.matchAll(regexPattern);

	// error counter which fixes positions when characters are added
	let error = 0

	let counter = 0;
	if (matches) {
		// Loop through the matches and rename each symbol
		for (const match of matches) {
			counter += 1;
			//			console.log("Error: " + error);
			//			console.log("Index: " + match.index);

			const positionInfo = editor.document.positionAt(match.index + error * 2); // error is multiplied by 2, because there is a rename above too, so two renames add the double number of lines
			//			console.log("Position to edit: l:" + positionInfo.line + " c: " + positionInfo.character);

			let finalName = match[2];
			finalName = finalName.replaceAll("/", "_");
			finalName = finalName.replaceAll(".", "");
			finalName = finalName + "_" + match[1];

			// number of characters appended to the file
			error += (finalName.length - match[1].length);


			let workspaceEdit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
				vscode.window.activeTextEditor.document.uri,
				positionInfo,
				finalName);

			await vscode.workspace.applyEdit(workspaceEdit);


		};
		vscode.window.showInformationMessage(`Renamed ${counter} package symbols`);

	} else {
		vscode.window.showInformationMessage('No matches found for package symbols');
	}
}


// rename symbols such as:    B = $pkg.person = $newType(0, $kindStruct, "main.person", true, "main", false, function (name_, age_) {
async function renameNewTypeSymbols(editor) {
	// Get the entire document's text

	// Specify the regular expression pattern
	const regexPattern = /(\w+)\s*=\s*\$pkg\.([^=\s]+)\s*=\s*\$newType/;

	let documentText = editor.document.getText();
	// we cannot count previous appearences to fix the offset, re run matcher from each point

	// Find matches using the regular expression
	let match = documentText.match(regexPattern);

	let offset = 0;

	let counter = 0;
	while (match) {
		counter += 1;
		//			console.log("Error: " + error);
		//			console.log("Index: " + match.index);

		const positionInfo = editor.document.positionAt(match.index + offset);
		//			console.log("Position to edit: l:" + positionInfo.line + " c: " + positionInfo.character);

		let finalName = match[2];
		finalName = finalName.replaceAll("/", "_");
		finalName = finalName.replaceAll(".", "");
		finalName = finalName + "_" + match[1];
		finalName = "type_" + finalName;



		let workspaceEdit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
			vscode.window.activeTextEditor.document.uri,
			positionInfo,
			finalName);

		await vscode.workspace.applyEdit(workspaceEdit);

		offset += match.index + match[0].length + finalName.length;

		// find next ocurrence
		documentText = editor.document.getText();
		match = documentText.slice(offset).match(regexPattern);
	};
	vscode.window.showInformationMessage(`Renamed ${counter} newType symbols`);

	if (counter === 0) {
		vscode.window.showInformationMessage('No matches found for newType symbols');
	}
}

// rename symbols such as:    B = $pkg.person = $newType(0, $kindStruct, "main.person", true, "main", false, function (name_, age_) {
// BK = $arrayType($Uint16, 2);
// BL = $sliceType(BK);
// BM = $sliceType($emptyInterface);
// BN = $ptrType(reflect_E.rtype);
// BO = $ptrType(type_buffer_AO);
// BP = $arrayType($Uint8, 68);
// BS = $sliceType($Uint8);
// BT = $ptrType(type_ss_W);
// CO = $ptrType(type_pp_AP);
// CP = $arrayType($Uint8, 6);
// CQ = $funcType([$Int32], [$Bool], false);
// CS = $ptrType(type_fmt_BH);

// be aware that BK has to be renamed before BL so the types names make sense

async function renameTypeSymbols(editor) {
	// this regex matches any of the previous lines, than god chatgpt
	const regexPattern = /(\w+) = \$(ptrType|arrayType|sliceType|funcType)\((.+)\);/;


	let documentText = editor.document.getText();
	// we cannot count previous appearences to fix the offset, re run matcher from each point

	// Find matches using the regular expression
	let match = documentText.match(regexPattern);

	let offset = 0;
	let finalName = "";

	let counter = 0;
	while (match) {
		counter += 1;
		//			console.log("Error: " + error);
		//			console.log("Index: " + match.index);

		const positionInfo = editor.document.positionAt(match.index + offset);
					console.log("Position to edit: l:" + positionInfo.line + " c: " + positionInfo.character);
		switch (match[2]) {
			case "arrayType":
				finalName = "t_Array" + match[3].split(",")[0] + "_" + match[3].split(",")[1] + "_" + match[1];
				break;
			case "sliceType":
				finalName = "t_Slice" + capitalizeFirstLetter(match[3]) + "_" + match[1];
				break;
			case "funcType":
				finalName = "t_Func_" + match[1];
				break;
			case "ptrType":
				finalName = "t_Ptr" + capitalizeFirstLetter(match[3]) + "_" + match[1];
				break

		}

		finalName = finalName.replaceAll(/\s/g, '');
		finalName = finalName.replaceAll(".", "");



		let workspaceEdit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
			vscode.window.activeTextEditor.document.uri,
			positionInfo,
			finalName);

		await vscode.workspace.applyEdit(workspaceEdit);

		// the offset calculation is bugged, as it doesnt take into account how many times does the type appear previously, which can make some types to be processed twice and others to not be processed.
		offset += match.index + match[0].length + finalName.length;

		// find next ocurrence
		documentText = editor.document.getText();
		match = documentText.slice(offset).match(regexPattern);
	};
	vscode.window.showInformationMessage(`Renamed ${counter} builtin type symbols`);

	if (counter === 0) {
		vscode.window.showInformationMessage('No matches found for builtin type symbols');
	}
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
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
	renamePackagesSymbols,
	renameNewTypeSymbols,
	renameTypeSymbols
}