const axios = require('axios');
const qs = require('querystring')
axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: "http://192.168.31.18:8086/green",
    method:"POST",
    // 超时
    timeout: 20000
})
service.interceptors.request.use(config=>{
    let Token = localStorage.getItem('Token');
    if(Token){
        config.headers.authorization = Token;
        localStorage.setItem('Token',Token)
    }
    for(let i in config.data) {
        if(config.data[i]===undefined||config.data[i]===null){
            delete config.data[i];
        }
    }
    if (config.headers['Content-Type'] == 'application/x-www-form-urlencoded;charset=utf-8') {
        config.data = qs.stringify(config.data);
    }
    if (config.url.substring((config.url.length-4),config.url.length)==='html'){
        config.baseURL=''
    }
    return config
},error => {
    Promise.reject(error)
})
service.interceptors.response.use(res=>{
    if (res.headers.authorization) {
        localStorage.setItem('Token',res.headers.authorization)
    }
    const code = res.data.code || 200;
    const message = res.data.message|| '网络错误，请刷新';
    if (code == 880 || code == 401002) {
        window.location = "./login"
    } else if (code == 500) {
        Notice.error(message,2500);
        return Promise.reject(new Error(message))
    } else if (code != 200) {
        Notice.error(message,2500);
        return Promise.reject(res.data)
    } else {
        return res.data
    }
},error => {
    console.log('err' + error)
    return Promise.reject(error)
})
module.exports = service
