const Store = require('electron-store');
const store = new Store();
let doc = store.get('doc');
let saveId = null;
let mergeCell=null;
layui.use(['element', 'form','layer','table','tree'],function(){
    let $ = layui.jquery;
    let tree = layui.tree;
    let layer = layui.layer;
    let table = layui.table;
    let lineData;
    let tableHeader;
    let index;
    window.excel = {}
    initTemplate();
    function initTemplate(){
        axios({
            url:"/document/selectOne",
            data:{
                id:doc.docid
            }
        }).then(res => {
            if (res.code === 200){
                tableHeader = '[' + res.data.tableHeader + ']';
                lineData = res.data.lineData;
                mergeCell = res.data.mergeCell;
                updateTable();
            }
        })
    }
    $("#excelAdd").click(function(){
        saveId = null;
        let header = JSON.parse(tableHeader);
        header[0] = header[0].map((item,index,array) => {
            if (item.field&&item.title!='序号'&&item.field!=='createTime'&&item.field!=='fanwei'){
                item.edit = 'text'
            }
            return item
        })
        if(header[1]){
            header[1] = header[1].map((item,index,array) => {
                if (item.field&&item.title!='序号'){
                    item.edit = 'text'
                }
                return item
            })
        }
        index = layer.open({
            type:1,
            content:$("#addLine"),
            area: ['100%', '100%'],
            zIndex:1000,
            success:function(){
                table.render({
                    elem:"#addTable",
                    cols:header,
                    data: Array.isArray(JSON.parse(lineData)) ? JSON.parse(lineData): [JSON.parse(lineData)]
                })
            }
        })
    })
    window.excel.save=function(){
        let tableData = table.cache["addTable"];
        let data ={};
        if (saveId){
            data.id = saveId;
        }
        axios({
            url:"/exceldata/save",
            // headers:{
            //     'Content-Type': 'application/json;charset=UTF-8'
            // },
            data:{
                list: JSON.stringify(tableData),
                documentId:doc.docid,
                ...data
            }
        }).then(res => {
            if (res.code === 200){
                Notice.success('保存成功')
                layer.close(index);
                updateTable();
            }
        })
    }
    window.excel.update= async function(id){
        saveId = id;
        let res = await axios({
            url:"/exceldata/selectOne",
            data:{id}
        })
        if (res.code===200){
            let header = JSON.parse(tableHeader);
            header[0] = header[0].map((item,index,array) => {
                if (item.field&&item.field!='序号'&&item.field!=='createTime'&&item.field!=='fanwei'){
                    item.edit = 'text'
                }
                return item
            })
            if(header[1]){
                header[1] = header[1].map((item,index,array) => {
                    if (item.field&&item.title!='序号'){
                        item.edit = 'text'
                    }
                    return item
                })
            }
            index = layer.open({
                type:1,
                content:$("#addLine"),
                area: ['100%', '100%'],
                zIndex:1000,
                success:function(){
                    table.render({
                        elem:"#addTable",
                        cols:header,
                        data:JSON.parse(res.data.lineData)
                    })
                }
            })
        }
    }
    window.excel.del=function(id){
        axios({
            url:"/exceldata/delete",
            data:{
                id
            }
        }).then(res =>{
            if (res.code === 200){
                Notice.success('删除成功');
                updateTable();
            }
        })
    }
    async function updateTable(){
        let header = JSON.parse(tableHeader);
        let obj = {};
        if (header[1]){
            obj.rowspan = 2
        }
        header[0].push({
            field:"id",
            title:"操作",
            align:"center",
            ...obj,
            templet:function(d){
                let str = '';
                str += `<button onclick="excel.update('${d.id}');" class="layui-btn layui-btn-xs layui-btn-warm">修改</button>`;
                str += `<button onclick="excel.del('${d.id}');" class="layui-btn layui-btn-xs layui-btn-danger">删除</button>`;
                return str
            }
        })
        let res = await axios({
            url:"/exceldata/list",
            data:{
                documentId:doc.docid
            }
        })
        if (res.code!==200){
            return;
        }
        let data = res.data;
        let arr = [];
        data.forEach((item) => {
            let lineData = JSON.parse(item.lineData);
            arr = arr.concat(lineData.map((i)=>{
                return{
                    ...i,
                    id:item.id,
                    createTime:item.createTime
                }
            }))
        })
        table.render({
            elem: '#excel',
            page: true,
            cols:header,
            toolbar:true,
            data:arr,
            limits:[10,30,50,100,500],
            done:function (res, curr, count) {
                merge(res);
            }
        })
    }
    function merge(res) {
        if (!mergeCell){
            return;
        }
        let mergeCells=JSON.parse(mergeCell);
        var data = res.data;
        var mergeIndex = 0;//定位需要添加合并属性的行数
        var mark = 1; //这里涉及到简单的运算，mark是计算每次需要合并的格子数
        var columsName = mergeCells.columsName;//需要合并的列名称
        var columsIndex = mergeCells.columsIndex;//需要合并的列索引值
        for (var k = 0; k < columsName.length; k++) { //这里循环所有要合并的列
            var trArr = $(".layui-table-body>.layui-table").find("tr");//所有行
            for (var i = 1; i < res.data.length; i++) { //这里循环表格当前的数据
                var tdCurArr = trArr.eq(i).find("td").eq(columsIndex[k]);//获取当前行的当前列
                var tdPreArr = trArr.eq(mergeIndex).find("td").eq(columsIndex[k]);//获取相同列的第一列
                if (data[i][columsName[k]] === data[i-1][columsName[k]]) { //后一行的值与前一行的值做比较，相同就需要合并
                    mark += 1;
                    tdPreArr.each(function () {//相同列的第一列增加rowspan属性
                        $(this).attr("rowspan", mark);
                    });
                    tdCurArr.each(function () {//当前行隐藏
                        $(this).css("display", "none");
                    });
                }else {
                    mergeIndex = i;
                    mark = 1;//一旦前后两行的值不一样了，那么需要合并的格子数mark就需要重新计算
                }
            }
            mergeIndex = 0;
            mark = 1;
        }
    }
})
