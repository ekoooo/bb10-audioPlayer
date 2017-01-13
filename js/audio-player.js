var BB10AudioPlayer = {
    player: null, 
    data: null,
    currentPlayIndex: 0,
    playConfig: {
        autoplay: true,
        controls: false,
        volume: 1,
        loop: false
    },
    container: null,
    itv: null,
    touching: false,
    isDebug: true,

    init: function(data) {
        this.data = data;

        this.player = new Audio();
        this.initPlayerConfig();

        this.playCurrent();
        this.attachEvent();
    },

    attachEvent: function() {
        var that = this;

        this.player.onended = function(e) {
            that.next();
        };
    },

    // 更新播放列表, 提供外部调用
    changeData: function(data, currentPlayIndex) {
        this.data = data;
        this.currentPlayIndex = currentPlayIndex;
    },

    attachUIEvent: function(container) {
        var that = this;

        var currentTimePanel = container.find('.bb10player_current_time'), 
            totalTimePanel = container.find('.bb10player_total_time'), 
            titlePanel = container.find('.bb10player_title'), 
            progressTimeBar = container.find('.bb10player_progress_time'), 
            controlsPlayPanel = container.find('.bb10player_controls_play'), 
            controlsPrevPanel = container.find('.bb10player_controls_prev'), 
            controlsNextPanel = container.find('.bb10player_controls_next');

        // 修改播放时间
        progressTimeBar.on('change', function(e) {
            BB10AudioPlayer.debug('播放时间 change ...');

            that.setCurrentTime($(e.currentTarget).val());
        }).on('touchstart', function() {
            that.touching = true;
        }).on('touchend', function() {
            that.touching = false;
        });

        // 播放/暂停
        controlsPlayPanel.on('click', function(e) {
            BB10AudioPlayer.debug('播放/暂停 click ...');

            that.toggle();
            
            $(e.currentTarget).css({
                backgroundImage: 'url(' + (that.player.paused ? 'img/bb10player-play.png' : 'img/bb10player-stop.png') + ')'
            });
        });

        // 上一首
        controlsPrevPanel.on('click', function(e) {
            BB10AudioPlayer.debug('上一首 click ...');

            that.prev();
        });

        // 下一首
        controlsNextPanel.on('click', function(e) {
            BB10AudioPlayer.debug('下一首 click ...');

            that.next();
        });

        // 初始化信息
        this.player.onloadedmetadata = function(e) {
            BB10AudioPlayer.debug('初始化信息 ...');
            
            var duration = that.getDuration();
            var title = that.data[that.currentPlayIndex].title;

            currentTimePanel.text('00:00');
            totalTimePanel.text(that.parseTime(duration));
            titlePanel.text(title);
            progressTimeBar.val(0);
            progressTimeBar.attr('max', duration);
        };
    },

    playCurrent: function() {
        this.setSrc(this.data[this.currentPlayIndex].url);
    },

    itvUpdate: function(currentTimePanel, progressTimeBar) {
        var currentTime = this.getCurrentTime();

        currentTimePanel.text(this.parseTime(currentTime))
        if(!this.touching) {
            progressTimeBar.val(currentTime);
        }
    },

    parseTime: function(time) {
        var m = Math.floor(time / 60);
        var s = Math.floor(time % 60);

        m = m < 10 ? '0' + m : m;
        s = s < 10 ? '0' + s : s;

        return m + ':' + s;
    },

    destoryUI: function() {
        this.container.empty();
    },

    // 可供外部调用
    initUI: function(container) {
        var tpl = ['<div class="bb10player_box">',
            '    <div class="bb10player">',
            '        <div class="bb10player_bottom">',
            '            <div class="bb10player_progress">',
            '                <input type="range" class="bb10player_progress_time" min="0" max="0" step="1" value="0">',
            '            </div>',
            '            <div class="bb10player_time">',
            '                <span class="bb10player_current_time">00:00</span>',
            '                <span>/</span>',
            '                <span class="bb10player_total_time">00:00</span>',
            '            </div>',
            '            <div class="bb10player_title"></div>',
            '            <div class="bb10player_controls">',
            '                <a href="javascript:void(0);" class="bb10player_controls_a bb10player_controls_prev"></a>',
            '                <a href="javascript:void(0);" class="bb10player_controls_a bb10player_controls_play"></a>',
            '                <a href="javascript:void(0);" class="bb10player_controls_a bb10player_controls_next"></a>',
            '            </div>',
            '        </div>',
            '    </div>',
            '</div>'].join("");

        container.append(tpl);

        /*
         * 判断当前播放状态, 更新 播放/暂停 按钮图标
         * 默认是播放状态, 即显示的暂停图片
         * 如果是暂停状态则更新为播放图片
         */
        if(this.isPaused()) {
            container.find('.bb10player_controls_play').css({
                backgroundImage: 'url(img/bb10player-play.png)'
            });
        }

        var that = this;

        var currentTimePanel = container.find('.bb10player_current_time'), 
            progressTimeBar = container.find('.bb10player_progress_time');

        // 初始化数据
        var duration = that.getDuration();

        if(!isNaN(duration)) {
            var totalTimePanel = container.find('.bb10player_total_time'), 
                titlePanel = container.find('.bb10player_title'),
                title = that.data[that.currentPlayIndex].title;

            currentTimePanel.text('00:00');
            totalTimePanel.text(that.parseTime(duration));
            titlePanel.text(title);
            progressTimeBar.val(0).attr('max', duration);
        }

        // 监听 UI 事件
        this.attachUIEvent(container);

        // 实时更新播放信息
        window.clearInterval(that.itv);

        that.itv = window.setInterval(function() {
            that.itvUpdate(currentTimePanel, progressTimeBar);
        }, 1000);

        // 保存 container, 可用于销毁 UI
        this.container = container;
    },

    // 设置播放器参数
    initPlayerConfig: function() {
        for (para in this.playConfig) {
            this.player[para] = this.playConfig[para];
        }
    },

    // 开始播放
    play: function() {
        this.player.play();
    },

    // 暂停播放
    pause: function() {
        this.player.pause();
    },

    isPaused: function() {
        return this.player.paused;
    },

    // 切换播放状态
    toggle: function() {
        this.isPaused() ? this.play(this.player) : this.pause(this.player);
    },

    // 下一首
    next: function() {
        if(this.currentPlayIndex === this.data.length - 1) {
            return;
        }
        this.currentPlayIndex += 1;
        this.playCurrent();
    },

    // 上一首
    prev: function() {
        if(this.currentPlayIndex === 0) {
            return;
        }
        this.currentPlayIndex -= 1;
        this.playCurrent();
    },

    // 返回当前音量大小
    getVolume: function() {
        return this.player.volume;
    },

    // 设置播放器音量 0 ~ 1
    setVolume: function(volumeVal) {
        this.player.volume = volumeVal;
    },

    // 返回当前音频的长度, 单位 s
    getDuration: function() {
        return this.player.duration;
    },

    // 获取当前播放的时间位置, 单位 s
    getCurrentTime: function() {
        return this.player.currentTime;
    },

    // 将时间位置设置为 time 秒
    setCurrentTime: function(time) {
        this.player.currentTime = time;
    },

    // 重新加载新的音频
    setSrc: function(srcVal) {
        this.player.src = srcVal;
    },

    debug: function() {
        if(this.isDebug) {
            console.log.apply(console, arguments);
        }
    }
};