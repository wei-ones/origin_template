var KEYWORDS =
	//
	'break,case,catch,continue,debugger,default,delete,do,else,end,false' 
	+ ',finally,for,function,if,in,instanceof,new,null,return,switch,this' 
	+ ',throw,true,try,typeof,var,void,while,with'
	// 
	+ ',abstract,boolean,byte,char,class,const,double,enum,export,extends' 
	+ ',final,float,goto,implements,import,int,interface,long,native' 
	+ ',package,private,protected,public,short,static,super,synchronized' 
	+ ',throws,transient,volatile'
	// 
	+ ',arguments,let,yield'
	//
	+',decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,scape,eval'
	+',getClass,isFinite,isNaN,parseFloat,parseInt,String,unescape'
	+',Infinity,java,NaN,Packages,undefined';


var commentRe = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$/g;
var elseRe = /[\.\[]\w+\]?|\bvar\s+\w+/g;
var splitRe = /[^\w]+/g;
var keywordsRe = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
var numberRe = /^\d[^,]*|,\d[^,]*/g;
var boundaryRe = /^,+|,+$/g;

var getVariable = function(templateStr) {
	return templateStr.replace(commentRe, '').replace(elseRe, '').replace(splitRe, ',').replace(keywordsRe, '').replace(numberRe, '').replace(boundaryRe, '').split(/^$|,+/);
};

var templateReg = new RegExp(/<%.*?%>/g);
var getVariables = function(templateStr) {
	var strList = templateStr.match(templateReg);
	var vars = [];
	var hasDict = {},
		reVars = [];
	for (var each in strList) {
		vars = getVariable(strList[each]);
		for (var index in vars) {
			if (!hasDict[vars[index]]) {
				reVars.push(vars[index]);
				hasDict[vars[index]] = true;
			};
		};
	}
	return reVars;
};

var cstartReg = new RegExp(/<%/g);
var cendReg = new RegExp(/%>/g);
var valueReg = new RegExp(/<%=\s*(.+?)\s*%>/g);
var addStr = "htmlStr += '?';";

var compile = function(templateStr) {
	templateStr = templateStr.replace(commentRe, '').replace(/\s+/g, " ").replace(/\n+/g, " ");

	var vars = getVariables(templateStr);

	var funcStr = "'use strict';";
	funcStr += "var htmlStr=''";
	for (each in vars) {
		funcStr += "," + vars[each] + "=" + "args." + vars[each];
	};
	funcStr += ";";

	var valueRe = valueReg.exec(templateStr);
	while (valueRe) {
		templateStr = templateStr.replace(valueRe[0], "<% htmlStr += " + valueRe[1] + "; %>");
		var valueRe = valueReg.exec(templateStr);
	}

	var startRe = cstartReg.exec(templateStr);
	var endRe = cendReg.exec(templateStr);
	var lastPos = 0;
	while (startRe && endRe) {
		tempStr = templateStr.slice(lastPos, startRe.index);
		funcStr += tempStr ? addStr.replace(/\?/, tempStr.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/"/g, '\\\"')) : "";
		funcStr += templateStr.slice(startRe.index + 2, endRe.index);
		lastPos = endRe.index + 2;
		startRe = cstartReg.exec(templateStr);
		endRe = cendReg.exec(templateStr);
	}

	tempStr = templateStr.slice(lastPos);
	funcStr += tempStr ? addStr.replace(/\?/, tempStr.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/"/g, '\\\"')) : "";
	funcStr += "return htmlStr;";
	funcStr = funcStr.replace(/\s+/, " ");

	try {
		new Function("args", funcStr);
	} catch (error) {
		console.log(funcStr);
		console.log(error.name);
		console.log(error.number);
		console.log(error.description);
		console.log(error.message);
		return false;
	}

	return funcStr;
};

var fs = require("fs");
var path = require("path");

var argvs = process.argv.splice(2);

var dirPath = argvs[0] ? argvs[0] : path.dirname(process.argv.splice(1));
var outPath = argvs[1] ? argvs[1] : path.join(dirPath,"template.js");

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
				funcStr += "'" + path.join(each, file) + "':function(args){" + compile(fs.readFileSync(thisPath, {
					encoding: "utf8"
				})) + "}";
			}
		});
	}
	funcStr += "}";

	fs.writeFileSync(outPath, funcStr);
};


fs.watch(dirPath,function(event,fileName){
	if (fileName && path.extname(fileName) == ".html") {
		console.log("#--" + event + "--#");
		console.log("Dumped " + fileName);
		compileDir(dirPath);
	}
});


