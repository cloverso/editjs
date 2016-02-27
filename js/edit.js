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
			if (props[prop]) {
				el.setAttribute(prop,props[prop]);
			}			
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
	        fontsizeOptions: [10,13,16,19,22,25,28],
	        headOptions: ['<h1>','<h2>','<h3>','<h4>','<h5>','<h6>']
	    },
		configInit: function(options,callback) {
			var params = [];
			callback(options,params);
			return params;
		},
	})

	Edit.extend(Edit, {
		box: null,
		range: null,
		selection: null,
		menuList: null,
		init: function(editBox, options) {
			options && this.extend(this.menus, options);
			this.createHtml(editBox);
			// document.execCommand('styleWithCSS', true, undefined);			
		},
		createHtml: function(editBox) {
			var box = createEl('div',{class:'edit-container',id:'edit-container'}),
				editMenus = createEl('ul',{class:'edit-menu'}),
				editContent = createEl('div',{class:'edit-content',contenteditable:'true'},[createEl('p',[createEl('br')])],{mouseup:Edit.select}),
				element;
			Edit.editContent = editContent;
			this.menus.forEach(function(item){
				var btn = (item.type === 'btn'), menuList;
				if (!btn && item.selectMenu) {
					menuList = createEl('ul',{class:'edit-menu-list hide'});
					item.selectMenu.forEach(function(child){
						menuList.appendChild(
							createEl('li',{class:'edit-child-item'},[
								createEl('a',{title:child.title,class:'edit-icon '+child.className,href:'#'},[child.text])
							],{click:function(e){Edit.command(e,child.command,child.commandValue,child.callback && child.callback.bind(this))}}));
					});
				}
				element = createEl('li',{class:'edit-item'},[					
					createEl('a',{title:item.title,class:'edit-icon '+item.className,href:'#'},{
						click: btn ? function(e){Edit.command(e,item.command,item.commandValue,item.callback && item.callback.bind(this))} : function(){
							if (this.parentNode.contains(Edit.menuList)) return;
							Edit.menuList && Edit.menuList.classList.add('hide');
							(Edit.menuList = this.parentNode.querySelector('.edit-menu-list')).classList.remove('hide');
						}
				}),
					!btn ? menuList : null 			
				]);
				editMenus.appendChild(element);
			});
			box.appendChild(editMenus).parentNode.appendChild(editContent);
			document.querySelector(editBox).appendChild(box);
			Edit.box = document.querySelector('#edit-container');
			document.addEventListener('click',function(e){
				if (Edit.menuList && e.target.parentNode != Edit.menuList.parentNode) {
					Edit.menuList.classList.add('hide');
					Edit.menuList = null;
				};
			});

		},
		select: function(e) {
			e.stopPropagation();
			Edit.range = document.getSelection().getRangeAt(0);
		},
		command: function(e,commandName,commandValue,callback) {
			Edit.selection = document.getSelection();
			Edit.selection.removeAllRanges();
			Edit.range && Edit.selection.addRange(Edit.range);
			commandName && document.execCommand(commandName, false, commandValue);
			Edit.range && (Edit.range = document.getSelection().getRangeAt(0));
			callback && callback(event,Edit.editContent);
		},	
		modalShow: function(title,children,className) {
			Edit.modalBox && Edit.modalClose();
			className = className ? 'modal-box '+className : 'modal-box';
			Edit.modalBox = createEl('div',{class:className},[createEl('div',{class:'modal-header'},[
				createEl('strong',[title]),
				createEl('span',{class:'modal-close edit-icon edit-icon-cancel'},{click:Edit.modalClose})
			]),children]);
			Edit.box.appendChild(Edit.modalBox);
		},
		modalClose: function() {
			Edit.box.removeChild(Edit.modalBox);
			Edit.modalBox = null;
		},
		menus: [
			{type:'btn',title:'查看源码',className:'edit-icon-code',callback:function(e,el){
				Edit.modalShow('查看源码',createEl('textarea',[el.innerHTML]),'modal-box-2');
			}},
			{type:'btn',title:'加粗',className:'edit-icon-bold',command:'bold'},
			{type:'btn',title:'下划线',className:'edit-icon-underline',command:'underline'},
			{type:'btn',title:'斜体',className:'edit-icon-italic',command:'italic'},
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
			{type:'btn',title:'删除线',className:'edit-icon-strikethrough',command:'strikeThrough'},
			{type:'btn',title:'清除格式',className:'edit-icon-eraser',command:'removeFormat'},
			{type:'btn',title:'引用',className:'edit-icon-quotes-left',command:'formatBlock',commandValue:'blockquote'},			
			// {type:'btn',title:'缩进',className:'edit-icon-indent-right',commend:'indent'},
			// {type:'btn',title:'取消缩进',className:'edit-icon-indent-left',command:'outdent'},
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
						params.push({className:'px'+(index+1),text:option+'px',command:'fontSize',commandValue:index+1});
					});
				})
			},
			
			{type:'selectMenu',title:'标题',className:'edit-icon-header',selectMenu:
				Edit.configInit(Edit.styleConfig.headOptions,function(options,params){
					options.forEach(function(option,index){
						params.push({className:'h'+(index+1),text:'h'+(index+1),command:'heading',commandValue:option});
					});
				})
			},
			{type:'selectMenu',title:'列表',className:'edit-icon-list-bullet',selectMenu:
				[{title:'无序列表',className:'edit-icon-list-bullet',command:'insertUnorderedList'},
				{title:'有序列表',className:'edit-icon-list-numbered',command:'insertOrderedList'}]
			},
			{type:'selectMenu',title:'对齐',className:'edit-icon-align-left',selectMenu:
				[{title:'左对齐',className:'edit-icon-align-left',command:'justifyLeft'},
				{title:'居中对齐',className:'edit-icon-align-center',command:'justifyCenter'},
				{title:'右对齐',className:'edit-icon-align-right',command:'justifyRight'},
				{title:'两端对齐',className:'edit-icon-align-left',command:'justifyFull'}]
			},
			{type:'btn',title:'插入链接',className:'edit-icon-link',command:'createLink',callback:function(){
				Edit.modalShow('插入链接',createEl('div',{class:'modal-content'},[
					createEl('p',['链接:',createEl('input',{type:'text',placeholder:'http://'})]),
					createEl('p',['标题:',createEl('input',{type:'text'})]),
					createEl('p',['新窗口:',createEl('input',{type:'checkbox',checked:'checked'})]),
					createEl('p',[createEl('input',{type:'button',value:'插入'})])
				]));
			}},
			{type:'btn',title:'清除链接',className:'edit-icon-unlink',command:'unLink'},
			{type:'btn',title:'表格',className:'edit-icon-table',command:'insertHTML',callback:function(){
				Edit.modalShow('插入表格',createEl('div',{class:'modal-content'},[
					createEl('p',['行数:',createEl('input',{type:'text'})]),
					createEl('p',['列数:',createEl('input',{type:'text'})]),
					createEl('p',['显示首行:',createEl('input',{type:'checkbox',checked:'checked'})]),
					createEl('p',[createEl('input',{type:'button',value:'插入'})])
				]));
			}},
			
			{type:'btn',title:'图片',className:'edit-icon-picture',command:'insertImage',callback:function(){
				Edit.modalShow('插入图片',createEl('div',{class:'modal-content'},[
					createEl('p',['网址:',createEl('input',{type:'text',placeholder:'http://'})]),
					createEl('p',['标题:',createEl('input',{type:'text'})]),
					createEl('p',[createEl('input',{type:'button',value:'插入'})])
				]));
			}},
			{type:'btn',title:'视频',className:'edit-icon-play',command:'insertHTML',callback:function(){
				Edit.modalShow('插入视频',createEl('div',{class:'modal-content'},[
					createEl('p',['地址:',createEl('input',{type:'text',placeholder:'*.swf,*.mp4,*.ogg,*.webm'})]),
					createEl('p',['宽度:',createEl('input',{type:'text'})]),
					createEl('p',['高度:',createEl('input',{type:'text'})]),
					createEl('p',[createEl('input',{type:'button',value:'插入'})])
				]));
			}},
			{type:'btn',title:'插入代码',className:'edit-icon-terminal',command:'insertHTML',callback:function(){
				Edit.modalShow('插入代码',createEl('div',{class:'modal-content'},[
					createEl('textarea'),
					createEl('p',[createEl('input',{type:'button',value:'插入'})])
				]),'modal-box-2');
			}},
			{type:'btn',title:'撤销',className:'edit-icon-ccw',command:'undo'},
			{type:'btn',title:'反撤销',className:'edit-icon-cw',command:'redo'},
			{type:'btn',title:'全屏',className:'edit-icon-enlarge2',callback:function(e,el){
				document.querySelector('#edit-container').classList.toggle('full');
				this.classList.toggle('edit-icon-shrink2');
			}}
		]
	});

	this.Edit = Edit;

}).call(this);