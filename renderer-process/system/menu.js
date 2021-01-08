layui.use(['treeTable','form','tree'],async function(){
    const form = layui.form;
    const treeTable = layui.treeTable;
    const $ = layui.jquery;
    window.systemMenu = {};
    layui.jquery('#systemMenuAddFun').click(function () {
        form.val('systemMenuForm', {
            id:null,
            title: null,
            perms:null,
            url:null,
            orderNum:null,
            pid:0,
            docType:2,
            parentName:'顶级菜单',
        });
        layer = layui.layer.open({
            type: 1,
            content: layui.jquery('#systemMenuAdd'),
            area: ['50%', '60%']
        });
        return false;
    });
    let res = await axios({
        url:"/syscompany/list",
        data:{
            page:1,
            size:0
        }
    })
    if (res.code==200){
        let str = '';
        for(let i=0;i<res.data.list.length;i++){
            str+=`<option value="${res.data.list[i].id}">${res.data.list[i].companyName}</option>`
        }
        $("#companyId").html(str);
        form.render('select');
    }
    tableIn=treeTable.render({
        elem:"#treeTable",
        url:publicUrl + "/syspermission/list",
        method:'post',
        where:form.val("sysMenuSearchFrom"),
        text: {
            none: '<div style="padding: 18px 0;">哎呀，一条数据都没有~</div>'
        },
        headers:{
            authorization:localStorage.getItem('Token')
        },
        tree: {
            iconIndex: 0,
            isPidData: true,
            idName: 'id',
            pidName: 'pid',
            arrowType: 'arrow2',
        },
        parseData(res){
            return {
                code:0,
                data:res.data,
                msg:res.message
            }
        },
        cols: [[
            {field:'title', title: '菜单名称'},
            {field:'perms', title: '标识符'},
            {field:'url', title: '路由'},
            {field:'type', title: '类型'},
            {
                title: "操作",
                templet: function (d) {
                    let str = '';
                    str += `<button onclick="systemMenu.addSon('${d.id}');" class="layui-btn layui-btn-xs layui-btn-normal">添加下级菜单</button>`;
                    str += `<button onclick="systemMenu.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                    str += `<button onclick="systemMenu.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                    if(d.docType==1){
                        str += `<button onclick="systemMenu.saveDoc('${d.id}','${d.documentId}');" class="layui-btn layui-btn-xs layui-btn-primary">配置文档</button>`;
                    }else if(d.docType==2){
                        str += `<button onclick="systemMenu.saveExcel('${d.id}','${d.documentId}');" class="layui-btn layui-btn-xs layui-btn-primary">配置表头</button>`;
                    }
                    return str;
                }
            }
        ]],
        page:false
    })
    form.on('submit(systemMenuSave)', function (data) {
        if (data.field.id) {
            axios({
                url: "/syspermission/update",
                data: {
                    ...data.field,
                    ...form.val("sysMenuSearchFrom")
                },
            }).then(res => {
                if (res.code === 200) {
                    Notice.success('修改成功');
                    layui.layer.close(layer);
                    getList();
                }
            })
        } else {
            axios({
                url: "/syspermission/save",
                data: {
                    ...data.field,
                    ...form.val("sysMenuSearchFrom")
                },
            }).then(res => {
                if (res.code === 200) {
                    Notice.success('保存成功');
                    layui.layer.close(layer);
                    getList();
                }
            })
        }
        return false;
    })
    window.systemMenu.reStart = function () {
        form.val('systemMenuSearchForm', search)
        tableIn.reload({
            where: null,
        });
        return;
    }
    window.systemMenu.addSon = function(id){
        axios({
            url: "/syspermission/selectOne",
            data: {
                id: id
            }
        }).then(res => {
            if (res.code === 200) {
                form.val('systemMenuForm',{
                    id:null,
                    pid:res.data.id,
                    parentName:res.data.title,
                    id:null,
                    title: null,
                    perms:null,
                    url:null,
                    docType:2,
                    orderNum:null,
                });
                layer = layui.layer.open({
                    type: 1,
                    area: ['50%', '60%'],
                    content: layui.jquery('#systemMenuAdd')
                })
            }
        })
    }
    function getList(data) {
        for (let i in data) {
            if (data[i] == "") {
                delete data[i];
            }
        }
        tableIn.reload({
            where: data
        });
    }

    window.systemMenu.del = function (id) {
        axios({
            url: "/syspermission/delete",
            data: {
                id: id
            }
        }).then(res => {
            if (res.code === 200) {
                Notice.success('删除成功');
                getList();
            }
        })
    }
    window.systemMenu.update = function (id) {
        axios({
            url: "/syspermission/selectOne",
            data: {
                id: id
            }
        }).then(res => {
            if (res.code === 200) {
                if (!res.data.parentName){
                    res.data.parentName = '顶级菜单'
                }
                form.val('systemMenuForm', res.data);
                layer = layui.layer.open({
                    type: 1,
                    area: ['50%', '60%'],
                    content: layui.jquery('#systemMenuAdd')
                })
            }
        })
    }
    window.systemMenu.selectParent = async function (){
        let res = await axios({
            url:"/syspermission/treeList"
        })
        if (res.code !== 200) {
            return;
        }
        let datas = [];
        datas.push({
            title:"顶级菜单",
            id:0,
            children:res.data
        })
        let selectParent = layui.layer.open({
            type:1,
            title:'父级菜单',
            content:`<div id="tree"></div>`,
            area:['300px','400px'],
            success:function(){
                layui.tree.render({
                    elem: '#tree',
                    data:datas,
                    click:function ({data}) {
                        form.val('systemMenuForm',{
                            pid:data.id,
                            parentName:data.title
                        })
                        layui.layer.close(selectParent);
                    }
                })
            }
        })
    }
    window.systemMenu.saveDoc=function (id,documentId) {
        let data = {
            permissionId:id,
        }
        if(documentId&&documentId!=='null'){
            data.id = documentId
        }
        layer = layui.layer.open({
            type: 1,
            area: ['50%', '60%'],
            content: layui.jquery('#saveDoc')
        })
        form.val('saveDocForm', data);
    }

    let docHtml;

    form.on('submit(saveDocFormSave)',function(data){
        data.field.docHtml = handleHtml(data.field.docHtml)
        axios({
            url: "/document/update",
            data: {
                ...data.field,
                // docHtml
            },
        }).then(res => {
            if (res.code === 200) {
                Notice.success('修改成功');
                layui.layer.close(layer);
                getList();
            }
        })
        return false;
    })

    window.systemMenu.saveExcel=function (id,documentId) {
        let data = {
            permissionId:id,
        }
        if(documentId&&documentId!=='null'){
            data.id = documentId
        }
        layer = layui.layer.open({
            type: 1,
            area: ['50%', '60%'],
            content: layui.jquery('#saveExcel')
        })
        form.val('saveExcelForm', data);
    }

    form.on('submit(saveExcelFormSave)',function(data){
        axios({
            url: "/document/update",
            data: {
                ...data.field,
            },
        }).then(res => {
            if (res.code === 200) {
                Notice.success('配置成功');
                layui.layer.close(layer);
                getList();
            }
        })
        return false;
    })


    // window.systemMenu.change=function(evt){
    //     Docx.docx2HTML(evt.target.files[0]).then(docx => {
    //         docHtml = handleHtml(docx.getHTML())
    //     });
    // }
    function handleHtml(str){
        let doc = document.createElement('div');
        $(doc).css('display', 'none');
        $(doc).append(str);
        let span = $(doc).find('td>p>span');
        for (let i=0;i<span.length;i++){
            let thisSpan = span.eq(i);
            let flag =  thisSpan.text();
            let reg = /\$+.*\$/;
            console.log(flag)
            console.log(reg.test(flag));
            if (reg.test(flag)){
                switch(flag){
                    case '$input$':{
                        //    文字
                        thisSpan.text('');
                        thisSpan.append(`<span showtype='input'></span>`)
                        break;
                    }
                    case '$img$':{
                        //    图片
                        thisSpan.text('');
                        let text = thisSpan.next().text();
                        thisSpan.next().remove();
                        thisSpan.addClass('imageUpload');
                        thisSpan.append(`<input type="file">
                    <img src="">
                    <span>${text}</span>`)
                        break;
                    }
                    case '$date$':{
                        //    时间
                        thisSpan.text('');
                        thisSpan.append(`<span showtype='date'></span>`)
                        break;
                    }
                    case '$text$':{
                        //    文本框
                        thisSpan.text('');
                        thisSpan.append(`<span showtype='text'></span>`)
                        break;
                    }
                    default:{
                        thisSpan.text('');
                        thisSpan.attr('vvvv',flag.substring(1,flag.length-1))
                    }
                }
            }
        }
        return $(doc).html();
    }
})
