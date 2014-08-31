#	originTemplate

*	性能极佳的轻量前端模板引擎

##	目录
*	[使用范例](#使用范例)
*	[API说明](#API说明)
*	[文件说明](#文件说明)

##	使用范例

*	使用`<%...%>`标记逻辑控制
*	使用`<%=...%>`标记输出语句

###	templateStr
```
<h1><%=title%></h1>
<ul>
    <%for (var i in list){%>
        <li>索引 <%=list[i] + 1%></li>
    <%}%>
</ul>

```

###	渲染
	*originTemplate.compile("template.name",templateStr),
	*originTemplate.render("template.name",{title:"originTemplate",list:[2,3,4,5]}),
	返回:
	`
	<h1>originTemplate</h1><ul><li>索引 3</li><li>索引 4</li><li>索引 5</li><li>索引 6</li></ul> 

	`

##	API说明

###	originTemplate.compile(templateName,templateStr)
	*渲染标识名，待渲染模板字符串
	动态生成渲染函数。
###	originTemplate.render(templateName,args)
	*渲染标识名，渲染参数
	执行渲染。
###	originTemplate.renderFromjs(templateName,args)
	*渲染标识名，渲染参数
	从预编译的template.js中提取渲染函数，执行渲染。

##	文件说明

###	originTemplate.js
	需被客户端引用
###	dump.js	
	*node dump.js <dirPath> <outPath>
	对指定文件夹中所有模板进行编译，存储于outPath(fileName)中
