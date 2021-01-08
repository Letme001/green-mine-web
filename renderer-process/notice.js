module.exports = {
    info(title,timeout=5000,{ message='', position = 'topRight'}={}){
        iziToast.info({
            title,
            message,
            position,
            timeout,
            transitionIn: 'bounceInLeft',
            transitionOut: 'flipOutX'
        });
    },
    success(title,timeout=5000,{ message='', position = 'topRight'}={}){
        iziToast.success({
            title,
            message,
            position,
            timeout,
            transitionIn: 'bounceInLeft',
            transitionOut: 'flipOutX'
        });
    },
    warning(title,timeout=5000,{ message='', position = 'topRight'}={}){
        iziToast.warning({
            title,
            message,
            position,
            timeout,
            transitionIn: 'bounceInLeft',
            transitionOut: 'flipOutX'
        });
    },
    error(title,timeout=5000,{ message='', position = 'topRight'}={}){
        iziToast.error({
            title,
            message,
            position,
            timeout,
            transitionIn: 'bounceInLeft',
            transitionOut: 'flipOutX',
        });
    }
}
