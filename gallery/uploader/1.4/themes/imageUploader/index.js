/**
 * @fileoverview 图片上传主题（带图片预览），第一版由紫英同学完成，苏河同学做了大量优化，明河整理优化
 * @author 苏河、紫英、明河
 **/
KISSY.add(function (S, Node, Theme) {
    var EMPTY = '', $ = Node.all;

    /**
     * @name ImageUploader
     * @class 图片上传主题（带图片预览），第一版由紫英同学完成，苏河同学做了大量优化，明河整理优化
     * @constructor
     * @extends Theme
     * @requires Theme
     * @requires  ProgressBar
     * @author 苏河、紫英、明河
     */
    function ImageUploader(config) {
        var self = this;
        //调用父类构造函数
        ImageUploader.superclass.constructor.call(self, config);
    }

    S.extend(ImageUploader, Theme, /** @lends ImageUploader.prototype*/{
        /**
         * 在完成文件dom插入后执行的方法
         * @param {Object} ev 类似{index:0,file:{},target:$target}
         */
        _addHandler:function(ev){
            var self = this;
            var file = ev.file;
            var id = file.id;
            var $target = file.target;
            var $delBtn = $('.J_Del_'+id) ;
            //显示/隐藏删除按钮
            $target.on('mouseover mouseout',function(ev){
                if(ev.type == 'mouseover'){
                    $delBtn.show();
                    self._setDisplayMsg(true,file);
                }else{
                    $delBtn.hide();
                    self._setDisplayMsg(false,file);
                }
            });
            $delBtn.data('data-file',file);
            //点击删除按钮
            $delBtn.on('click',self._delHandler,self);

            //显示图片预览
            var $img = $('.J_Pic_' + id);
            $img.show();
            self.preview($img);
        },
        /**
         * 文件处于开始上传状态时触发
         */
        _startHandler:function (ev) {

        },
        /**
         * 文件处于正在上传状态时触发
         */
        _progressHandler:function (ev) {

        },
        /**
         * 文件处于上传成功状态时触发
         */
        _successHandler:function (ev) {
            var self = this,
                file = ev.file,
                id = file.id,
                //服务器端返回的数据
                result = file.result;
            self._setCount();
            //获取服务器返回的图片路径写入到src上
            if(result) self._changeImageSrc(ev.id,result);
            $('.J_Mask_'+id).hide();
        },
         /**
         * 文件处于上传错误状态时触发
         */
        _errorHandler:function (ev) {
            var self = this,msg = ev.msg,
                id = ev.id;
            //打印错误消息
            $('.J_ErrorMsg_' + id).html(msg);
             self._setDisplayMsg(true,ev.file);
             //向控制台打印错误消息
             S.log(msg);
        },
        /**
         * 图片预览
         *
         */
        preview:function($img){
            var self = this;
            var uploader = self.get('uploader');
            var oPreview = uploader.getPlugin('preview');
            var target = uploader.get('fileInput');
            oPreview.preview(target,$img);
            return self;
        },
        /**
         * 显示“你还可以上传几张图片”
         */
        _setCount:function(){
            var self = this,
                //用于显示上传数的容器
                elCount = $(self.get('elCount')),
                len = self.getFilesLen(),
                auth = self.get('auth') ;
            if(!auth) return false;
            var rules = auth.get('rules'),
                //max的值类似[5, '最多上传{max}个文件！']
                max = rules.max;
            if(!max) return false;
            if(elCount.length) elCount.text(max[0]-len);
        },
        /**
         * 显示/隐藏遮罩层（遮罩层在出现状态消息的时候出现）
          * @param isShow
         * @param data
         * @return {Boolean}
         * @private
         */
        _setDisplayMsg:function(isShow,data){
            if(!data) return false;
            var $mask = $('.J_Mask_' + data.id);
            //出错的情况不允许隐藏遮罩层
            if($mask.parent('li') && $mask.parent('li').hasClass('error')) return false;
            $mask[isShow && 'show' || 'hide']();
        },
        /**
         * 删除图片后触发
         */
        _delHandler:function(ev){
             var self = this;
            var uploader = self.get('uploader');
            var queue = uploader.get('queue');
            var file = $(ev.target).data('data-file');
            var index = queue.getFileIndex(file.id);
            var status = file.status;
            //如果文件还在上传，取消上传
             if(status == 'start' || status == 'progress'){
                 uploader.cancel(index);
             }
            queue.remove(index);
            //统计允许上传文件个数
            self._setCount();
        },
        /**
         * 获取成功上传的图片张数，不传参的情况获取成功上传的张数
         * @param {String} status 状态
         * @return {Number} 图片数量
         */
        getFilesLen:function(status){
            if(!status) status = 'success';
            var self = this,
            queue = self.get('queue'),
            //成功上传的文件数
            successFiles = queue.getFiles(status);
            return successFiles.length;
        },
        /**
         * 将服务器返回的图片路径写到预览图片区域，部分浏览器不支持图片预览
         * @param {String} id  文件id
         * @param {Object} result  服务器端返回的结果集
          */
        _changeImageSrc:function(id,result){
            var data = result.data,url,
                $img = $('.J_Pic_' + id);
            if(!S.isObject(data)) return false;
            url = data.url;
            if($img.attr('src') == EMPTY || S.UA.safari){
                $img.show();
                $img.attr('src',url);
            }
        }
    }, {ATTRS:/** @lends ImageUploader.prototype*/{
        /**
         *  主题名（文件名），此名称跟样式息息相关
         * @type String
         * @default "imageUploader"
         */
        name:{value:'imageUploader'},
        /**
         * css模块路径
         * @type String
         * @default "gallery/uploader/1.4/themes/imageUploader/style.css"
         */
        cssUrl:{value:'gallery/uploader/1.4/themes/imageUploader/style.css'},
        /**
         * 队列使用的模板
         * @type String
         * @default ""
         */
        fileTpl:{value:
            '<li id="queue-file-{id}" class="g-u" data-name="{name}">' +
                '<div class="pic">' +
                    '<a href="javascript:void(0);"><img class="J_Pic_{id}" src="" /></a>' +
                '</div>' +
                '<div class=" J_Mask_{id} pic-mask"></div>' +
                '<div class="status-wrapper">' +
                    '<div class="status waiting-status"><p>等待上传，请稍候</p></div>' +
                    '<div class="status start-status progress-status success-status">' +
                        '<div class="J_ProgressBar_{id}"><s class="loading-icon"></s>上传中...</div>' +
                    '</div>' +
                    '<div class="status error-status">' +
                        '<p class="J_ErrorMsg_{id}">上传失败，请重试！</p></div>' +
                '</div>' +
                '<a class="J_Del_{id} del-pic" href="#">删除</a>' +
            '</li>'
        },
        /**
         * 引入的插件
         * @type String
         * @default 'proBars,filedrop,preview'
         */
        use:{
            value:'proBars,filedrop,preview'
        },
        /**
         * 统计上传张数的容器
         * @type KISSY.NodeList
         * @default '#J_UploadCount'
         */
        elCount:{value:'#J_UploadCount'}
    }});
    return ImageUploader;
}, {requires:['node', '../../theme']});