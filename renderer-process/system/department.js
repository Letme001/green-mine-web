layui.use(['treeTable', 'form','tree'], function () {
    const table = layui.table;
    const form = layui.form;
    const treeTable = layui.treeTable;
    let tableIn;
    window.sysDepartment = {};
    tableIn=treeTable.render({
        elem:"#sysDepartment",
        url:publicUrl + "/sysdepartment/list",
        method:'post',
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
            {field:'title', title: '部门名称'},
            {field:'managerName', title: '负责人名称'},
            {field:'phone', title: '负责人电话'},
            {
                title: "操作",
                templet: function (d) {
                    let str = '';
                    str += `<button onclick="sysDepartment.addSon('${d.id}');" class="layui-btn layui-btn-xs layui-btn-normal">添加下级部门</button>`;
                    str += `<button onclick="sysDepartment.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                    str += `<button onclick="sysDepartment.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                    return str;
                }
            }
        ]],
        page:false
    })
    form.on('submit(sysDepartmentSearch)', function (data) {
        getList(data.field);
        return false;
    })
    let layer
    let search = {};
    layui.jquery('#sysDepartmentAddFun').click(function () {
        form.val('sysDepartmentForm', {
            id:null,
            title: null,
            managerName:null,
            phone:null,
            pid:0,
            parentName:'顶级部门',
        });
        layer = layui.layer.open({
            type: 1,
            content: layui.jquery('#sysDepartmentAdd'),
            area: ['50%', '60%']
        });
        return false;
    });
    form.on('submit(sysDepartmentSave)', function (data) {
        if (data.field.id) {
            axios({
                url: "/sysdepartment/update",
                data: data.field,
            }).then(res => {
                if (res.code === 200) {
                    Notice.success('修改成功');
                    layui.layer.close(layer);
                    getList();
                }
            })
        } else {
            axios({
                url: "/sysdepartment/save",
                data: data.field,
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

    window.sysDepartment.reStart = function () {
        form.val('sysDepartmentSearchForm', search)
        tableIn.reload({
            where: null,
        });
        return;
    }
    window.sysDepartment.addSon = function(id){
        axios({
            url: "/sysdepartment/selectOne",
            data: {
                id: id
            }
        }).then(res => {
            if (res.code === 200) {
                form.val('sysDepartmentForm',{
                    id:null,
                    pid:res.data.id,
                    parentName:res.data.title,
                    managerName:null,
                    phone:null,
                    title:null
                });
                layer = layui.layer.open({
                    type: 1,
                    area: ['50%', '60%'],
                    content: layui.jquery('#sysDepartmentAdd')
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

    window.sysDepartment.del = function (id) {
        axios({
            url: "/sysdepartment/delete",
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
    window.sysDepartment.update = function (id) {
        axios({
            url: "/sysdepartment/selectOne",
            data: {
                id: id
            }
        }).then(res => {
            if (res.code === 200) {
                if (!res.data.parentName){
                    res.data.parentName = '顶级部门'
                }
                form.val('sysDepartmentForm', res.data);
                layer = layui.layer.open({
                    type: 1,
                    area: ['50%', '60%'],
                    content: layui.jquery('#sysDepartmentAdd')
                })
            }
        })
    }
    window.sysDepartment.selectParent = async function (){
        let res = await axios({
            url:"/sysdepartment/treeList"
        })
        if (res.code !== 200) {
            return;
        }
        let datas = [];
        datas.push({
            title:"顶级部门",
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
                        form.val('sysDepartmentForm',{
                            pid:data.id,
                            parentName:data.title
                        })
                        layui.layer.close(selectParent);
                    }
                })
            }
        })
    }
})
