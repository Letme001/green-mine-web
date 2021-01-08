layui.use(['table','form','tree'],function(){
    const table = layui.table;
    const form = layui.form;
    const $ = layui.jquery;

    window.systemRole={}
    let tableIn = table.render({
        elem:"#systemRole",
        cols:[[
            {
                title:'角色名',
                field:"name"
            },
            {
                title:"部门",
                templet:function(d){
                    return d.department.title
                }
            },
            {
                title:"操作",
                templet:function(d){
                    let str = '';
                    str+=`<button onclick="systemRole.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                    str+=`<button onclick="systemRole.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                    str+=`<button onclick="systemRole.updateMenu('${d.id}');" class="layui-btn layui-btn-xs layui-btn-primary">配置权限</button>`;
                    return str;
                }
            }
        ]],
        url:publicUrl+"/sysrole/list",
        method:'post',
        page:true,
        headers:{
            authorization:localStorage.getItem('Token')
        },
        where:{},
        parseData:function(res){
            return {
                "code": res.code, //解析接口状态
                "msg": res.message, //解析提示文本
                "count": res.data.total, //解析数据长度
                "data": res.data.list //解析数据列表
            };
        },
        request:{
            pageName: 'page',
            limitName: 'size'
        },
        response:{
            statusCode: 200
        }
    })
    form.on('submit(systemRoleSearch)', function(data){
        getList(data.field);
        return false;
    })
    let layer
    layui.jquery('#systemRoleAddFun').click(function(){
        form.val('systemRoleForm',{
            name:null,
        });
        layer = layui.layer.open({
            type:1,
            content:layui.jquery('#systemRoleAdd'),
            area:['50%','60%']
        });
        return false;
    });
    form.on('submit(systemRoleSave)', function(data){
        if (data.field.id){
            axios({
                url:"/sysrole/update",
                data:data.field,
            }).then(res => {
                if (res.code===200){
                    Notice.success('修改成功');
                    layui.layer.close(layer);
                    getList();
                }
            })
        }else{
            axios({
                url:"/sysrole/save",
                data:data.field,
            }).then(res => {
                if (res.code===200){
                    Notice.success('保存成功');
                    layui.layer.close(layer);
                    getList();
                }
            })
        }
        return false;
    })
    let search = {
        name:null
    }
    window.systemRole.reStart=function(){
        form.val('searchForm',search)
        tableIn.reload({
            where:null,
        });
        return;
    }
    function getList(data){
        for(let i in data){
            if(data[i]==""){
                delete data[i];
            }
        }
        console.log(data);
        tableIn.reload({
            where:data
        });
    }
    window.systemRole.del=function(id){
        axios({
            url:"sysrole/delete",
            data:{
                id:id
            }
        }).then(res =>{
            if (res.code === 200){
                Notice.success('删除成功');
                getList();
            }
        })
    }
    window.systemRole.update=function(id){
        axios({
            url:"sysrole/selectOne",
            data:{
                id:id
            }
        }).then(res =>{
            if (res.code === 200){
                form.val('systemRoleForm', res.data);
                layer = layui.layer.open({
                    type:1,
                    area:['50%','60%'],
                    content:layui.jquery('#systemRoleAdd')
                })
            }
        })
    }
    window.systemRole.selectDept = async function (){
        let res = await axios({
            url:"/sysdepartment/treeList"
        })
        if (res.code !== 200) {
            return;
        }
        let datas = res.data;
        let selectParent = layui.layer.open({
            type:1,
            title:'部门',
            content:`<div id="tree"></div>`,
            area:['300px','400px'],
            success:function(){
                layui.tree.render({
                    elem: '#tree',
                    data:datas,
                    click:function ({data}) {
                        form.val('systemRoleForm',{
                            departmentId:data.id,
                            departmentName:data.title
                        })
                        layui.layer.close(selectParent);
                    }
                })
            }
        })
    }
    window.systemRole.updateMenu= async function(id){
        let res = await axios({
            url:"/syspermission/treeList",
        })
        if (res.code !== 200) {
            return;
        }
        let datas = res.data
        let selectRole = layui.layer.open({
            type:1,
            title:'菜单',
            content:`<div id="menuTree"></div>
                    <div style="text-align:right;padding:30px;"><button onclick="systemRole.menuSave();" class="layui-btn layui-btn-warm">提交</button></div>`,
            area:['300px','400px'],
            success:function(){
                layui.tree.render({
                    elem: '#menuTree',
                    data:datas,
                    id:"menuTree",
                    showCheckbox:true,
                })
                axios({
                    url:"/sysrolepermission/list",
                    data:{
                        roleId:id
                    }
                }).then(res =>{
                    if (res.code === 200){
                        layui.tree.setChecked('menuTree', res.data.map((item)=>{return item.id}));
                    }
                })

            }
        })
        window.systemRole.menuSave=function(){
            var checkData = layui.tree.getChecked('menuTree');
            let arr = [];
            checkData.map((item)=>{
                arr.push(item);
                if (item.children&&item.children.length){
                    getArr(item.children,arr);
                }
            })
            function getArr(list,arr){
                list.map((item)=>{
                    arr.push(item);
                    if (item.children&&item.children.length){
                        getArr(item.children,arr);
                    }
                })
            }
            axios({
                url:"/sysrolepermission/update",
                data:{
                    roleId:id,
                    permissionIds:arr.map((item)=>item.id).join(',')
                }
            }).then(res => {
                if (res.code === 200){
                    Notice.success('保存成功');
                    layui.layer.close(selectRole);
                }
            })
        }
    }
})
