(function(){

	function isType(type) {
	  	return function(obj) {
		    return {}.toString.call(obj) === "[object " + type + "]"
		}
	}
	var isObject = isType("Object"),
		isString = isType("String"),
		isArray = Array.isArray || isType("Array"),
		isFunction = isType("Function"),
		isUndefined = isType("Undefined");

	function El(tagName,props,children,handles) {
		if (!(this.tagName = tagName)) return;
		var param, children;

		if (!handles) {
			if (isObject(param = arguments[1]) && !isFunction(param.click)) {
				this.props = param;
			} else if (isArray(param)) {
				this.children = param;
			}  else {
				this.handles = param;
			}
			if (isArray(children = arguments[2])) {
				this.children = children;
			} else {
				this.handles = children;
			}
		} else {
			this.props = props;
			this.children = children;
			this.handles = handles;
		}		
	};

	El.prototype.render = function() {
		var el = document.createElement(this.tagName),
			props = this.props || {},
			children = this.children || [],
			handles = this.handles || {};

		for (var prop in props) {
			el.setAttribute(prop,props[prop]);
		}

		for (var handle in handles) {
			el.addEventListener(handle,handles[handle],false);
		}

		children.forEach(function(child){
			if (child) {
				el.appendChild((child instanceof HTMLElement) ? child : document.createTextNode(child));
			}
		});
		return el;		
	}

	function createEl(tagName,props,children,handles) {
		return new El(tagName,props,children,handles).render();
	}

	function Edit(editBox, options) {
		return Edit.init(editBox, options);
	}

	Edit.extend = function(prop) {
		Array.prototype.slice.call(arguments, 1).forEach(function(source){
			for (var key in source) {
				if (source[key] != null) prop[key] = source[key];
			}
		});
		return prop;
	}

	Edit.extend(Edit, {
	    styleConfig: {
	        fontFamilyOptions: [
	            '宋体', '黑体', '楷体', '隶书', '幼圆', '微软雅黑', 'Arial', 
	            'Verdana', 'Georgia', 'Times New Roman', 'Microsoft JhengHei',
	            'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS'
	        ],
	        colorOptions: {'#880000':'暗红色', '#800080':'紫色', '#ff0000':'红色', '#ff00ff':'鲜粉色', '#000080':'深蓝色',
				'#0000ff':'蓝色', '#00ffff':'湖蓝色', '#008080':'蓝绿色', '#008000':'绿色', '#808000':'橄榄色',
				'#00ff00':'浅绿色', '#ffcc00':'橙黄色', '#808080':'灰色', '#c0c0c0':'银色', '#000000':'黑色', '#ffffff':'白色'
	        },
	        fontsizeOptions: ['10px','13px','16px','19px','22px','25px','28px'],
	        headOptions: ['<h1>','<h2>','<h3>','<h4>','<h5>','<h6>']
	    },
		configInit: function(options,callback) {
			var params = [];
			callback(options,params);
			return params;
		},
	})

	Edit.extend(Edit, {
		range: null,
		selection: null,
		modal: null,
		init: function(editBox, options) {
			options && this.extend(this.menus, options);
			this.createHtml(editBox);
			document.execCommand('styleWithCSS', true, undefined);
			
		},
		createHtml: function(editBox) {
			var editMenus = createEl('ul',{class:'edit-menu'}),
				editContent = createEl('div',{class:'edit-content',contenteditable:'true'},[createEl('p',[createEl('br')])],{mouseup:Edit.select}),
				element;
			this.menus.forEach(function(item){
				var btn = (item.type === 'btn'), menuList;
				if (!btn && item.selectMenu) {
					menuList = createEl('ul',{class:'edit-menu-list hide'});
					item.selectMenu.forEach(function(child){
						menuList.appendChild(createEl('li',{class:'edit-child-item'},[createEl('a',{title:child.title,class:'edit-icon '+child.className,href:'#'},[child.text])],{click:function(e){Edit.command(e,child.command,child.commandValue,null)}}));
					});
				}
				element = createEl('li',{class:'edit-item'},[					
					createEl('a',{title:item.title,class:'edit-icon '+item.className,href:'#'},{
						click: btn ? function(e){Edit.command(e,item.command,item.commandValue,null)} : function(){
							if (this.parentNode.contains(Edit.modal)) return;
							Edit.modal && Edit.modal.classList.add('hide');
							(Edit.modal = this.parentNode.querySelector('.edit-menu-list')).classList.remove('hide');
						}
				}),
					!btn ? menuList : null 			
				]);
				editMenus.appendChild(element);
			});
			document.querySelector(editBox).appendChild(editMenus).parentNode.appendChild(editContent);
			document.addEventListener('click',function(e){
				if (Edit.modal && e.target.parentNode != Edit.modal.parentNode) {
					Edit.modal.classList.add('hide');
					Edit.modal = null;
				};
			});

		},
		select: function(e) {
			e.stopPropagation();
			Edit.range = document.getSelection().getRangeAt(0);
		},
		command: function(e,commandName,commandValue,callback) {
			Edit.modal && Edit.modal.classList.add('hide');
			if (!Edit.range) return;
			Edit.selection = document.getSelection();
			Edit.selection.removeAllRanges();
			Edit.selection.addRange(Edit.range);
			document.execCommand(commandName, false, commandValue);
			Edit.range = document.getSelection().getRangeAt(0);
		},	
		menus: [
			{type:'btn',title:'加粗',className:'edit-icon-bold',command:'bold'},
			{type:'btn',title:'下划线',className:'edit-icon-underline',command:'underline'},
			{type:'btn',title:'斜体',className:'edit-icon-italic',command:'italic'},
			{type:'btn',title:'清除格式',className:'edit-icon-eraser',command:'removeFormat'},
			{type:'btn',title:'缩进',className:'edit-icon-indent-right',commend:'indent'},
			{type:'btn',title:'取消缩进',className:'edit-icon-indent-left',command:'outdent'},
			{type:'btn',title:'插入链接',className:'edit-icon-link',command:'createLink'},
			{type:'btn',title:'清除链接',className:'edit-icon-unlink',command:'unLink'},
			{type:'btn',title:'删除线',className:'edit-icon-strikethrough',command:'strikeThrough'},
			{type:'btn',title:'引用',className:'edit-icon-quotes-left',command:'formatBlock',commandValue:'blockquote'},
			{type:'selectMenu',title:'对齐',className:'edit-icon-align-left',selectMenu:
				[{className:'edit-icon-align-left',text:'左对齐',command:'justifyLeft'},
				{className:'edit-icon-align-center',text:'居中对齐',command:'justifyCenter'},
				{className:'edit-icon-align-right',text:'右对齐',command:'justifyRight'},
				{className:'edit-icon-align-left',text:'两端对齐',command:'justifyFull'}]
			},
			{type:'selectMenu',title:'列表',className:'edit-icon-list-bullet',selectMenu:
				[{title:'无序列表',className:'edit-icon-list-bullet',text:'无序列表',command:'insertUnorderedList'},
				{title:'有序列表',className:'edit-icon-list-numbered',text:'有序列表',command:'insertOrderedList'}]
			},
			{type:'selectMenu',title:'字体',className:'edit-icon-font2',selectMenu: 
				Edit.configInit(Edit.styleConfig.fontFamilyOptions,function(options,params){
					options.forEach(function(option,index){
						params.push({className:'font-'+(index+1),text:option,command:'fontName',commandValue:option});
					});
				})
			},
			{type:'selectMenu',title:'字号',className:'edit-icon-text-height',selectMenu:
				Edit.configInit(Edit.styleConfig.fontsizeOptions,function(options,params){
					options.forEach(function(option,index){
						params.push({text:option,command:'fontSize',commandValue:index+1});
					});
				})
			},
			{type:'selectMenu',title:'字体颜色',className:'edit-icon-pencil color-box',selectMenu:
				Edit.configInit(Edit.styleConfig.colorOptions,function(options,params){
					var index = 0;
					for (var key in options) {
						params.push({title:options[key],className:'color-block color-'+(++index),command:'foreColor',commandValue:key});
					}
				})
			},
			{type:'selectMenu',title:'背景颜色',className:'edit-icon-brush color-box',selectMenu:
				Edit.configInit(Edit.styleConfig.colorOptions,function(options,params){
					var index = 0;
					for (var key in options) {
						params.push({title:options[key],className:'color-block color-'+(++index),command:'backColor',commandValue:key});
					}
				})
			},
			{type:'selectMenu',title:'标题',className:'edit-icon-header',selectMenu:
				Edit.configInit(Edit.styleConfig.headOptions,function(options,params){
					options.forEach(function(option,index){
						params.push({className:'h'+(index+1),text:'h'+(index+1),command:'heading',commandValue:option});
					});
				})
			},
			{type:'btn',title:'图片',className:'edit-icon-picture',command:'insertImage',commandValue:'图片URL'},
			{type:'btn',title:'视频',className:'edit-icon-play',command:'insertHTML',commValue:'插入视频要处理的代码块'},
			{type:'btn',title:'表格',className:'edit-icon-table',command:'insertHTML',commValue:'插入表格要处理的代码块'},
			{type:'btn',title:'插入代码',className:'edit-icon-terminal',command:'insertHTML',commValue:'插入代码要处理的代码块'},
			{type:'btn',title:'撤销',className:'edit-icon-ccw',command:'undo'},
			{type:'btn',title:'反撤销',className:'edit-icon-cw',command:'redo'}
		]
	});

	this.Edit = Edit;

}).call(this);