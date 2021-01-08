layui.use(['table','form'],function(){
    const table = layui.table;
    const form = layui.form;
    window.systemCompany={}
    let tableIn = table.render({
        elem:"#systemCompany",
        cols:[[
            {
                title:'公司名称',
                field:"companyName"
            },
            {
                title:'公司负责人',
                field:"companyLeader"
            },
            {
                title:'公司手机号',
                field:'companyPhone'
            },
            {
                title:'公司地址',
                field:'companyAddress'
            },
            {
                title:"操作",
                templet:function(d){
                    let str = '';
                    str+=`<button onclick="systemCompany.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                    str+=`<button onclick="systemCompany.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                    return str;
                }
            }
        ]],
        url:publicUrl+"/syscompany/list",
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
    form.on('submit(systemCompanySearch)', function(data){
        getList(data.field);
        return false;
    })

    let layer
    layui.jquery('#systemCompanyAddFun').click(function(){
        form.val('systemCompanyForm',{
            companyName:null,
            companyPhone:null,
            companyAddress:null,
            id:null,
            companyLeader:null
        });
        layer = layui.layer.open({
            type:1,
            content:layui.jquery('#systemCompanyAdd'),
            area:['50%','60%']
        });
        return false;
    });
    form.on('submit(systemCompanySave)', function(data){
        if (data.field.id){
            axios({
                url:"/syscompany/update",
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
                url:"/syscompany/save",
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
            where:data,
        });
    }
    let search = {
        companyName:null
    }
    window.systemCompany.reStart=function(){
        form.val('searchForm',search)
        tableIn.reload({
            where:null,
        });
        return;
    }
    window.systemCompany.del=function(id){
        axios({
            url:"syscompany/delete",
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
    window.systemCompany.update=function(id){
        axios({
            url:"syscompany/selectOne",
            data:{
                id:id
            }
        }).then(res =>{
            if (res.code === 200){
                form.val('systemCompanyForm', res.data);
                layer = layui.layer.open({
                    type:1,
                    area:['50%','60%'],
                    content:layui.jquery('#systemUserAdd')
                })
            }
        })
    }
})
