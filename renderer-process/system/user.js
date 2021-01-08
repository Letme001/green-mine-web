layui.use(['table','form','tree'],function(){
    const table = layui.table;
    const form = layui.form;
    window.systemUser = {};
    let tableIn = table.render({
        elem:"#systemUser",
        cols:[[
            {
                title:'用户名',
                field:"username"
            },
            {
                title:'手机号',
                field:'phone'
            },
            {
                title:"姓名",
                field:"realName"
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
                    str+=`<button onclick="systemUser.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                    str+=`<button onclick="systemUser.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                    str+=`<button onclick="systemUser.updateRole('${d.id}','${d.department.id}');" class="layui-btn layui-btn-xs layui-btn-primary">配置角色</button>`;
                    return str;
                }
            }
        ]],
        url:publicUrl+"/sysuser/list",
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
    form.on('submit(systemUserSearch)', function(data){
        getList(data.field);
        return false;
    })
    let layer
    layui.jquery('#systemUserAddFun').click(function(){
        form.val('systemUserForm',{
            username:null,
            password:null,
            phone:null,
            realName:null,
            departmentName:null,
            departmentId:null,
        });
        layer = layui.layer.open({
            type:1,
            content:layui.jquery('#systemUserAdd'),
            area:['50%','60%']
        });
        return false;
    });
    form.on('submit(systemUserSave)', function(data){
        if (data.field.id){
            axios({
                url:"/sysuser/update",
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
                url:"/sysuser/save",
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
    function getList(data){
        for(let i in data){
            if(data[i]==""){
                delete data[i];
            }
        }
        tableIn.reload({
            where:data
        });
    }
    let search = {
        username:null
    }
    window.systemUser.reStart=function(){
        form.val('searchForm',search)
        tableIn.reload({
            where:null,
        });
        return;
    }

    window.systemUser.del=function(id){
        axios({
            url:"sysuser/delete",
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

    window.systemUser.update=function(id){
        axios({
            url:"sysuser/selectOne",
            data:{
                id:id
            }
        }).then(res =>{
            if (res.code === 200){
                form.val('systemUserForm', res.data);
                layer = layui.layer.open({
                    type:1,
                    area:['50%','60%'],
                    content:layui.jquery('#systemUserAdd')
                })
            }
        })
    }

    window.systemUser.selectDept = async function (){
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
                        form.val('systemUserForm',{
                            departmentId:data.id,
                            departmentName:data.title
                        })
                        layui.layer.close(selectParent);
                    }
                })
            }
        })
    }
    window.systemUser.updateRole= async function(id,departmentId){
        let res = await axios({
            url:"/sysrole/deptRole",
            data:{
                deptId:departmentId
            }
        })
        if (res.code !== 200) {
            return;
        }
        let datas = res.data.map((item)=>{
            return {
                ...item,
                title:item.name
            }
        });
        let selectRole = layui.layer.open({
            type:1,
            title:'角色',
            content:`<div id="roleTree"></div>
                    <div style="text-align:right;padding:30px;"><button onclick="systemUser.roleSave();" class="layui-btn layui-btn-warm">提交</button></div>`,
            area:['300px','400px'],
            success:function(){
                layui.tree.render({
                    elem: '#roleTree',
                    data:datas,
                    id:"roleTree",
                    showCheckbox:true,
                })
                axios({
                    url:"/sysuserrole/selectOne",
                    data:{
                        userId:id
                    }
                }).then(res =>{
                    if (res.code === 200){
                        layui.tree.setChecked('roleTree', res.data.map((item)=>{return item.id}));
                    }
                })

            }
        })
        window.systemUser.roleSave=function(){
            var checkData = layui.tree.getChecked('roleTree');
            axios({
                url:"/sysuserrole/save",
                data:{
                    userId:id,
                    roleIds:checkData.map((item)=>item.id).join(',')
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
