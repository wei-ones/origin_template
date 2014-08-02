var fs = require("fs");
var path = require("path");
var compile = require("./compile");

var argvs = process.argv.splice(2);

var dirPath = argvs.length ? argvs[0] : path.dirname(process.argv.splice(1));

var traverseDir = function(rootPath, dirPath, filesDict) {
	var filesList = [];
	var thisPath = path.join(rootPath, dirPath);
	var files = fs.readdirSync(thisPath);
	files.forEach(function(file) {
		var statObj = fs.statSync(path.join(thisPath, file));
		if (statObj.isDirectory()) traverseDir(rootPath, path.join(dirPath, file), filesDict);
		else filesList.push(file);
	});
	filesDict[dirPath] = filesList;
};

var compileDir = function(dirPath) {
	var funcStr = "var templateDict = {";
	var filesDict = {};
	traverseDir(dirPath, "", filesDict);
	var isFirst = true;
	for (var each in filesDict) {
		filesDict[each].forEach(function(file) {
			var thisPath = path.join(dirPath,each, file);
			if (path.extname(file) == ".html") {
				if (!isFirst) funcStr += ",";
				else isFirst = false;
				funcStr += "'" + path.join(each, file) + "':function(args){" + compile.compile(fs.readFileSync(thisPath, {
					encoding: "utf8"
				})) + "}";
			}
		});
	}
	funcStr += "}";

	fs.writeFileSync("template.js", funcStr);
};

compileDir(dirPath);