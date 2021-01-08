const Store = require('electron-store');
const store = new Store();
let doc = store.get('doc');
let id = null;
layui.use(['FileSaver','wordexport'],function(){
    let $ = layui.jquery,
    FileSaver = layui.FileSaver,
    wordexport = layui.wordexport
    $("#ccc").click(function(){
        $("#DocContent").wordExport("word名称");
    })
})
layui.use(['element', 'form','layer','laydate','tree'],function(){
    let $ = layui.jquery;
    let tree = layui.tree;
    let layer = layui.layer;
    let lineData;
    window.doc = {};
    //初始化
    initTemplate();
    initTree();
    async function initTree(){
        let index = layer.load(0, {
            shade: [0.7,'#000'] //0.1透明度的白色背景
        });
        let res = await axios({
            url:"/worddocdata/list",
            timeout:1000*60*3,
            data:{
               documentId:doc.docid
            }
        });
        layui.layer.close(index);
        if (res.code === 200){
            tree.render({
                elem: '#timeTree'
                ,data: res.data
                ,id: 'timeTree',
                click: function(obj){
                    id = obj.data.id;
                    if(obj.data.children&&obj.data.children.length>0){
                        return;
                    }
                    axios({
                        url:"/worddocdata/selectOne",
                        data:{
                            id:obj.data.id
                        }
                    }).then(res=>{
                        if (res.code === 200){
                            $("#docAdd").css('display', 'inline-block');
                            $("#docDel").css('display', 'inline-block');
                            updateDom(res.data.tableData)
                        }
                    })
                }
            });
        }
    }

    function init(){
        $("table tbody td").click(function(){
            let td = $(this);
            let span = td.find('p>span>span');
            if(span.length>0&&(span.find('input').length<=0&&span.find('textarea').length<=0)){
                let showtype = span.attr('showtype');
                let text
                if(showtype){
                    text  = span.text();
                    span.text('');
                }
                switch(showtype){
                    case 'input':{
                        span.append(`<input style="width:100%;border:none;" value="${text}"/>`);
                        let input = span.find('input');
                        input.focus();
                        input.blur(function(){
                            let value = $(this).val();
                            span.text(value);
                            $(this).remove();
                        })
                        break;
                    }
                    case 'date':{
                        span.append(`<input type="date" value="${text}"/>`);
                        let input = span.find('input');
                        console.log(input)
                        input.focus();
                        input.blur(function(){
                            let value = $(this).val();
                            span.text(value);
                            $(this).remove();
                        })
                        break;
                    }
                    case 'text':{
                        span.parent().css('width','100%');
                        span.css('width','100%');
                        span.append(`<textarea style="width:100%;" rows="3">${text}</textarea>`);
                        let textarea = span.find('textarea');
                        textarea.focus();
                        textarea.blur(function(){
                            let value = $(this).val();
                            $(this).parent().text(value);
                            $(this).remove();
                        });
                        break;
                    }
                }
            }
        })
        $('.imageUpload input').change(function(){
            if($(this).val()==''){
                return;
            }
            let index = layer.load(1, {
                shade: [0.7,'#000'] //0.1透明度的白色背景
            });
            let formDataFile = new FormData();
            let id = $(this).next().attr('uploadid');
            let width = $(this).parent().parent().parent().width()-100;
            if(id){
                formDataFile.append('id',id);
            }
            formDataFile.append('file',this.files[0]);
            formDataFile.append('width',width);
            axios({
                url:"/utils/getBase64",
                headers:{
                    "Content-Type":"multipart/form-data"
                },
                timeout:1000*60*10,
                data:formDataFile
            }).then(res => {
                if (res.code === 200){
                    layui.layer.close(index);
                    $(this).next().attr('uploadid',new Date().getTime());
                    $(this).next().attr('src','data:image/jepg;base64,'+res.data);
                    $(this).next().css('display','inline-block');
                    $(this).next().next().css('display', 'none');
                }
            }).catch(err =>{
                layui.layer.close(index);
            })
        })
    }
    function updateDom(str){
        $("#DocContent").empty();
        $("#DocContent").html(str);
        let img = $('.imageUpload img');
        if (img.length>0){
            for(let i=0;i<img.length;i++){
                let item = img.eq(i);
                if (item.attr('uploadId')){
                    item.css('display','inline-block');
                    $(".imageUpload").eq(i).find('span').css('display','none');
                }else{
                    item.css('display','none');
                    $(".imageUpload").eq(i).find('span').css('display','block');
                }
            }
        }
        init()
    }
    function initTemplate(){
        axios({
            url:"/document/selectOne",
            data:{
                id:doc.docid
            }
        }).then(res => {
            if (res.code === 200){
                updateDom(res.data.docHtml);
                if(res.data.lineData){
                    $('#addLine').css('display', 'inline-block');
                    $('#delLine').css('display', 'inline-block');
                    lineData = res.data.lineData;
                }else{
                    $('#addLine').css('display', 'none');
                    $('#delLine').css('display', 'none');
                }
                $("#docAdd").css('display', 'none');
                $("#docDel").css('display', 'none');
                $(".header .content").text('')
            }
        })
    }
    $("#addLine").click(function (){
        $('#DocContent table').append(lineData);
        updateDom($('#DocContent').html());
    });
    $("#delLine").click(function (){
        let delBody = $('.isDelBody');
        if(delBody.length>0){
            delBody.eq(delBody.length-1).remove();
        }
    })
    $("#docSave").click(function(){
        axios({
            url:"/worddocdata/save",
            data:{
                id:id,
                documentId:doc.docid,
                tableData:$("#DocContent").html()
            }
        }).then(res => {
            if (res.code === 200){
                Notice.success('保存成功');
                id = res.data;
                $("#docAdd").css('display', 'inline-block');
                $("#docDel").css('display', 'inline-block');
                initTree();
            }
        })
    })
    $("#docAdd").click(function(){
        id = null;
        initTemplate();
    })
    $("#docDel").click(function(){
        axios({
            url:"/worddocdata/delete",
            data:{
                id
            }
        }).then(res =>{
            if (res.code === 200){
                Notice.success('删除成功');
                id = null;
                initTree();
                initTemplate();
            }
        })
    })
})
