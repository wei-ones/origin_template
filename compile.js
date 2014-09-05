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
	+',undefined';

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
		funcStr += tempStr ? addStr.replace(/\?/, tempStr.replace(/'/g, '\\\'').replace(/"/g, '\\\"')) : "";
		funcStr += templateStr.slice(startRe.index + 2, endRe.index);
		lastPos = endRe.index + 2;
		startRe = cstartReg.exec(templateStr);
		endRe = cendReg.exec(templateStr);
	}

	tempStr = templateStr.slice(lastPos);
	funcStr += tempStr ? addStr.replace(/\?/, tempStr.replace(/'/g, '\\\'').replace(/"/g, '\\\"')) : "";
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

fs = require("fs");
var compileFile = function(filePath) {
	return compile(fs.readFileSync(filePath, {
		encoding: "utf8"
	}));
};

exports.compile = compile;
exports.compileFile = compileFile;