var request = require('request');
var fs = require('fs');
const shell = require('electron').shell;
layui.use(['upload','treeTable','element','layer','FileSaver'],function(){
    window.files = {};
    let $ = layui.jquery;
    let treeTable = layui.treeTable;
    let upload = layui.upload;
    let layer = layui.layer;
    let FileSaver = layui.FileSaver;
    var fileTb = treeTable.render({
        elem: '#fileTree',
        tree: {
            arrowType:'arrow2',
            haveChildName:"directory",
            iconIndex:1,
            getIcon: function(d) {  // 自定义图标
                // d是当前行的数据
                if (d.directory) {  // 判断是否有子集
                    return '<i class="ew-tree-icon ew-tree-icon-folder"></i>';
                } else {
                    return '<i class="ew-tree-icon ew-tree-icon-file"></i>';
                }
            }
        },
        cols: [[
            {type:"radio"},
            {field: 'fileName', title: '名称'},
            {field: 'menuUrl', title: '日期'},
            {field: 'authority', title: '操作',templet:function(d){
                let str = '';
                if(!d.directory){
                    str += `<button onclick="window.open('${d.preview}')" class="layui-btn layui-btn-sm layui-btn-warning">预览</button>`;
                    str += `<button onclick="files.download('${d.fileUrl}','${d.fileName}')" class="layui-btn layui-btn-sm">下载</button>`;
                }
                str += `<button onclick="files.delFolder('${d.id}')" class="layui-btn layui-btn-sm layui-btn-danger">删除</button>`;
                return str;
            }}
        ]],
        reqData:function(data,callback){
            let obj = {};
            if(data){
                obj.pid = data.id;
            }
            axios({
                url:"/fileoss/list",
                data:obj
            }).then(res => {
                if (res.code === 200){
                    callback(res.data)
                }
            })
        }
    });
    window.files.download = function(url,fileName){
        window.open(url);
    }

    // function downloadFile(uri,filename,callback){
    //     var stream = fs.createWriteStream(filename);
    //     request(uri).pipe(stream).on('close', callback);
    // }

    // function downloadFile(configuration){
    //     return new Promise(function(resolve, reject){
    //         // Save variable to know progress
    //         var received_bytes = 0;
    //         var total_bytes = 0;
    //
    //         var req = request({
    //             method: 'GET', uri: configuration.remoteFile
    //         });
    //         var out = fs.createWriteStream(configuration.localFile);
    //         req.pipe(out);
    //         req.on('response', function ( data ) {
    //             // Change the total bytes value to get progress later.
    //             total_bytes = parseInt(data.headers['content-length' ]);
    //         });
    //
    //         // Get progress if callback exists
    //         if(configuration.hasOwnProperty("onProgress")){
    //             req.on('data', function(chunk) {
    //                 // Update the received bytes
    //                 received_bytes += chunk.length;
    //
    //                 configuration.onProgress(received_bytes, total_bytes);
    //             });
    //         }else{
    //             req.on('data', function(chunk) {
    //                 // Update the received bytes
    //                 received_bytes += chunk.length;
    //             });
    //         }
    //
    //         req.on('end', function() {
    //             resolve();
    //         });
    //     });
    // }
    window.files.delFolder=function(id){
        // insTb.checkStatus()
        axios({
            url:"/fileoss/delete",
            data:{
                id
            }
        }).then(res =>{
            if (res.code === 200){
                Notice.success('删除成功');
            }
        })
    }
    window.files.addFolder=function(id){
        layer.prompt({title:"名称"},function(value, index, elem){
            axios({
                url:"/fileoss/directory",
                data:{
                    pid:id,
                    name:value,
                }
            }).then(res => {
                if (res.code === 200){
                    Notice.success('添加成功');
                    layer.close(index);
                }
            })
        });
    }
    // treeTable.on('row(fileTree)', function(obj){
    //     console.log(obj.tr) //得到当前行元素对象
    //     console.log(obj.data) //得到当前行数据
    //     if (!obj.data.directory){
    //
    //     }
    // });
    uploadFun();
    function uploadFun(){
        var uploadInst = upload.render({
            elem: '.upload' //绑定元素
            ,url: publicUrl+'/fileoss/upload' //上传接口
            ,accept:'file'
            ,headers:{
                authorization:localStorage.getItem('Token')
            },
            data:{
                pid:function(){
                    console.log(fileTb.checkStatus())
                    return fileTb.checkStatus()[0].id
                }
            }
            ,before:function(res){
                console.log(res);
            }
            ,done: function(res){
                if (res.code===200){
                    Notice.success('上传成功');
                }else{
                    Notice.error(res.message);
                }
                //上传完毕回调
            }
            ,error: function(){
                //请求异常回调
            }
        });
    }

})

