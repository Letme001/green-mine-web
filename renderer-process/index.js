const ipc = require('electron').ipcRenderer
const shell = require('electron').shell
const path = require('path')
const url = require('url')
const Store = require('electron-store');
const store = new Store();
layui.config({
    base: 'design/'
})
layui.use(['element', 'form','layer'], function() {
    var $ = layui.jquery,
        form = layui.form,
        element = layui.element; //Tab的切换功能，切换事件监听等，需要依赖element模块
    layui.layer.config({
        zIndex:100
    })
    //加载首页

    axios({
        url: 'sections/base64.html',
        method: 'get'
    }).then(content => {
        $('#app-content').empty();
        $('#app-content').html(content);
    })

    // 设置导航tab 不允许关闭
    var first_closeIcon = document.querySelectorAll("#navigator_tab i.layui-tab-close");
    first_closeIcon[0].style.display = "none";
    //触发事件
    var tab = {
        tabAdd: async function(tab_info) {
            var othis = $(this),
                type = othis.data('type'),
                href = othis.data('href');
            id = othis.data('id');
            let content = await axios({
                url: href,
                method: 'get'
            })
            $('#app-content').empty();
            $('#app-content').html(content);
            element.tabAdd('tab_filter', {
                title: othis.attr('title'),
                content: undefined,
                id: id
            });

            element.tabChange('tab_filter', id);
            // CustomRightClick(id); // 绑定tab右键菜单
            //绑定点击事件
            layuiTabBindClick();
            resizeWebSize();
        },
        // tabDelete: function(ids) {
        //     //删除指定Tab项
        //     element.tabDelete('tab_filter', id);
        //     //  othis.addClass('layui-btn-disabled');
        // },
        tabChange: async function(tab_id) {
            //切换到指定Tab项
            var othis = $(tab_id),
                href = othis.data('href');
            let content = await axios({
                url: href,
                method: 'get'
            });
            $('#app-content').empty();
            $('#app-content').html(content);
            element.tabChange('tab_filter', tab_id);
        },
        // tabDeleteAll: function(ids) { //删除所有
        //     console.log(ids);
        //     $.each(ids, function(i, item) {
        //         element.tabDelete("tab_filter", item);
        //     })
        // }
    };
    element.on('tabDelete(tab_filter)', async function(data){
        let layId = data.elem.find('.layui-this').attr('lay-id');
        if(layId){
            setTreeClass(layId);
        }else{
            $('.layui-nav.layui-nav-tree .layui-this').removeClass('layui-this');
        }
    });
    function layuiTabBindClick(){
        $(".layui-tab .layui-tab-title li").unbind("click");
        $(".layui-tab .layui-tab-title li").click(function (){
            const $this = $(this);
            let layId = $this.attr('lay-id');
            if(layId){
                setTreeClass(layId)
            }else{
                $('.layui-nav.layui-nav-tree .layui-this').removeClass('layui-this');
            }
        });
    }
    async function setTreeClass(layId){
        let layIdElm = $(`.layui-nav a[data-id='${layId}']`);
        let href = layIdElm.data('href');
        $('.layui-nav.layui-nav-tree .layui-this').removeClass('layui-this');
        layIdElm.parent().addClass('layui-this');
        layIdElm.parents('li.layui-nav-item').addClass('layui-nav-itemed');
        console.log(href)
        let content = await axios({
            url: href,
            method: 'get'
        })
        $('#app-content').empty();
        $('#app-content').html(content);
    }

    //获取菜单
    getMenu();
    function getMenu(){
        axios({
            url:"/index/home",
        }).then(res => {
            let menu = res.data.menus;
            store.set('userInfo',res.data.user);
            store.set('button',res.data.buttons);
            let str = '';
            menu.forEach((item,index)=>{
                if(item.children&&item.children.length>0){
                    str += `<li class="layui-nav-item">
            <a href="javascript:;">${item.title}</a>
                ${getMenuChildren(item.children)}
            </li>`;
                }else{
                    str += `<li class="layui-nav-item">
            <a href="javascript:;" docType="${item.docType}" docid='${item.documentId}'  title="${item.title}" data-type="tabAdd" data-href="${item.url}" data-id="${item.id}">${item.title}</a>
            </li>`;
                }
            })
            $('.layui-nav-tree.arrow2.layui-nav').empty();
            $('.layui-nav-tree.arrow2.layui-nav').html(str);
            var layFilter = $("#nav").attr('lay-filter');
            element.render('nav', layFilter);
            //菜单点击事件************************************
            $('.layui-nav-item a, .tool-item .tool-item-inner a').on('click', function() {
                var othis = $(this),
                    type = othis.data('type'),
                    href = othis.data('href');
                store.set('doc',{
                    type:othis.attr('doctype'),
                    docid:othis.attr('docid')
                })
                id = othis.data('id');
                var li = $("li[lay-id=" + id + "]").length;
                if (li > 0) {
                    //tab已经存在直接切换tab
                    tab['tabChange'].call(this, this);
                    element.tabChange('tab_filter', id);
                } else {
                    //创建tab
                    tab[type] ? tab[type].call(this, this) : '';
                }
            });
        })
    }
    function getMenuChildren(list){
        let str = '';
        list.forEach((item,index)=>{
            if(item.children&&item.children.length>0){
                str+=`<li class="layui-nav-item">
            <a href="javascript:;">${item.title}</a>
                ${getMenuChildren(item.children)}
            </li>`
            }else{
                str += `<li class="layui-nav-item">
            <a href="javascript:;" docType="${item.docType}" docid="${item.documentId}" title="${item.title}" data-type="tabAdd" data-href="${item.url}" data-id="${item.id}">${item.title}</a>
            </li>`;
            }
        });
        return `<ul class="layui-nav-child">${str}</ul>`
    }

    //Hash地址的定位
    var layid = location.hash.replace(/^#tab_filter=/, '');
    element.tabChange('tab_filter', layid);

    element.on('tab(tab_filter)', function(elem) {
        location.hash = 'tab_filter=' + $(this).attr('lay-id');
    });

    function resizeWebSize() {
        $(window).on('resize', function() {
            var currBoxHeight = $('.layui-body .layui-tab-content').height(); //获取当前容器的高度
            var currBoxWidth = $('.layui-body .layui-tab-content').width(); //获取当前容器的高度
            $('iframe').height(currBoxHeight);
            $('iframe').width(currBoxWidth + 10);
            // $('object').height(currBoxHeight);
            // $('object').width(currBoxWidth);
        }).resize();
    }


    resizeWebSize();


    // 绑定导航下方的点击事件
    const exLinkArr = $('#introduce li');
    $.each(exLinkArr, function(index, val) {
        var exLinksBtn = $(val).children("a").get(0);
        (function(index) {
            $(val).click(function() {
                var ss = $(exLinksBtn).data('href')
                // 调用外部浏览器打开地址
                shell.openExternal($(exLinksBtn).data('href'));
            });
        })(index);
    });

    form.render(null, 'component-form-element');

    const asyncMsgBtn = $('#select_language a')
    form.on('switch(quick_change_switch)', function(data){
      store.set("quickchangeStore", data.elem.checked);
      console.log('quickchange:' + data.elem.checked); //开关是否开启，true或者false
    });

    const tipsObj = {
      "cn": "快速切换设置打开，不会更新程序菜单哦！",
    }
    $('#quick_change').prop("checked", store.get('quickchangeStore'));
    form.render("checkbox");
    $('#quickSetting').on('click', function(event) {
        var othis = $(this),
            language = othis.data('language');
        layer.tips(tipsObj[language], '#quickSetting', {
          tips: [1, '#3595CC'],
          time: 4000
        });
    });
    $('#logOut').click(function(){
        localStorage.removeItem('Token');
        window.location.href='./login.html'
    })

    // 拖动变化宽度
    resizeFun();
    function resizeFun(){
        let resize = document.getElementById("resize");
        let layuiLogo = $('.layui-logo');
        let layuiSideScroll = $('.layui-side-scroll');
        let layuiSide = $('.layui-side');
        let layuiTree= $('.layui-nav.layui-nav-tree.arrow2');
        let layuiBody = $('.layui-layout>.layui-body');
        let layuiFooter = $('.layui-layout>.layui-footer');
        resize.onmousedown=function(e){
            var startX = parseFloat(layuiLogo.css('width'));
            if(startX<235||startX>500){
                return false;
            }
            let layuiBodyWidth = parseFloat(layuiBody.css('width'));
            let layuiBodyLeft = parseFloat(layuiBody.css('left'));
            let layuiFooterLeft = parseFloat(layuiFooter.css('left'));
            let layuiFooterWidth = parseFloat(layuiFooter.css('width'));
            document.onmousemove = function(e){
                var endX = e.clientX;
                if(endX<235||endX>500){
                    return false;
                }
                layuiLogo.width = endX+'px';
                layuiLogo.css('width',endX+'px');
                layuiSide.css('width',endX+'px');
                layuiTree.css('width',endX+'px');
                layuiSideScroll.css('width',endX+20+'px');
                let moveX = endX-startX;
                layuiBody.css({
                    width:layuiBodyWidth-moveX + 'px',
                    left:layuiBodyLeft+moveX+'px'
                });
                layuiFooter.css({
                    width:layuiFooterWidth-moveX + 'px',
                    left:layuiFooterLeft+moveX+'px'
                })
            }
            document.onmouseup = function(evt){
                evt.stopPropagation();
                document.onmousemove = null;
                document.onmouseup = null;
                resize.releaseCapture && resize.releaseCapture();
            }
            resize.setCapture && resize.setCapture();
            return false;
        }
    }

    initMenu();

    /**
     * 初始化右键菜单
     */
    function initMenu(){
        const remote = require('electron').remote;
        const Menu = remote.Menu;
        const MenuItem = remote.MenuItem;
        const menu = new Menu();
        menu.append(new MenuItem({label:'刷新', click() {
            location.reload();
        }}));
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            menu.popup(remote.getCurrentWindow());
        }, false)
    }
});
