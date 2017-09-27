(function(){
	var app = {
		Vue  : {},
		music: {},
	}, songs = [], player = {};
	
	// 
	app.Vue.el         = '#js-vue';
	app.Vue.methods    = {};
	app.Vue.data       = {};
	app.Vue.data.items = [];
	app.music.methods  = {};
	app.music.autoplay = true;
	document.querySelector('[isAutoplay="true"]').classList.add('type-active');
	
	
	/**
	 * 新しい Vue インスタンス作成時に実行。
	 * json から曲情報を取得。
	 * 
	 * @link https://jp.vuejs.org/v2/guide/instance.html#ライフサイクルダイアグラム
	 */
	app.Vue.created = function() {
		var path       = 'resources/js/songs.json';
		var request    = new XMLHttpRequest();
		request.onload = function() {
			// data bind
			songs              = JSON.parse(request.responseText);
			app.Vue.data.items = songs.map(function(item) {
				var discogsSlug = item.discogsID.replace('r', 'release/').replace('m', 'master/');
				item.discogsURL = 'https://www.discogs.com/' + discogsSlug;
				item.state      = 'stop';
				return item;
			});
		};
		request.open('GET', path, true);
		request.send();
	};
	
	
	/**
	 * 指定の要素でソート
	 * @param  {array}  array  ソートする配列
	 * @param  {string} sortby ソートしたいキー
	 * @return {array}
	 * 
	 * @link http://qiita.com/PianoScoreJP/items/f0ff7345229871039672
	 * @link http://qiita.com/nantekkotai/items/21fb63a86f2128e299b2
	 */
	app.Vue.methods.sort = function( array, sortby ) {
		// slice() をはさんで非破壊にソート
		app.Vue.data.items = array.slice().sort(function(a, b){
			if ( a[sortby] < b[sortby] ) return -1;
			if ( a[sortby] > b[sortby] ) return 1;
			return 0;
		});
	}
	
	
	/**
	 * ソートボタンのクリックイベント
	 * @param  {string} sortby ソートしたいキー
	 * @param  {object} event
	 * 
	 * @link https://jp.vuejs.org/v2/guide/events.html
	 */
	app.Vue.methods.onClickSort = function ( sortby, event ){
		// 他をリセット
		var buttons = document.querySelectorAll('.type-sort .type-active');
		Object.keys(buttons).forEach(function (key) {
			buttons[key].classList.remove('type-active');
		}, buttons);
		// ターゲットにセット
		event.currentTarget.classList.add('type-active');
		
		switch (sortby) {
			case 'year':
				app.Vue.methods.sort(app.Vue.data.items, 'year');
				break;
			case 'title':
				app.Vue.methods.sort(app.Vue.data.items, 'title');
				break;
			case 'leader':
				app.Vue.methods.sort(app.Vue.data.items, 'leader');
				break;
			default:
				app.Vue.data.items = songs;
				break;
		}
	}
	
	
	/**
	 * autoplay の設定を切り替え
	 * 
	 */
	app.Vue.methods.toggleAutoplay = function(){
		// 他をリセット
		var buttons = document.querySelectorAll('.type-autoplay .type-active');
		Object.keys(buttons).forEach(function (key) {
			buttons[key].classList.remove('type-active');
		}, buttons);
		// ターゲットにセット
		event.currentTarget.classList.add('type-active');
		app.music.autoplay = ('true' == event.currentTarget.getAttribute('isAutoplay'));
	}
	
	
	/**
	 * プレイボタンのクリックイベント
	 * 
	 */
	app.Vue.methods.onClickPlay = function() {
		var nowplaying = app.music.methods.getNowplaying();
		var thisIndex  = event.currentTarget.getAttribute('index');
		
		if ( thisIndex == nowplaying.index ) {
			if ( 'play' == nowplaying.state ) {
				app.music.methods.pause();
			} else if ( 'pause' == nowplaying.state ) {
				app.music.methods.reStart();
			}
		} else {
			app.music.methods.start();
		}
	}
	
	
	/**
	 * 動画スタート
	 * クリックイベントで実行
	 */
	app.music.methods.start = function() {
		app.music.methods.setNowplaying(event.currentTarget.getAttribute('index'), 'play');
		app.music.methods.createYoutube(event.currentTarget.getAttribute('youtubeID'));
	}
	
	
	/**
	 * 動画一時停止
	 * 
	 */
	app.music.methods.pause = function() {
		player.pauseVideo();
		var nowplaying = app.music.methods.getNowplaying();
		app.music.methods.setNowplaying(nowplaying.index, 'pause');
	}
	
	
	/**
	 * 動画一時停止から復帰
	 * 
	 */
	app.music.methods.reStart = function() {
		player.playVideo();
		var nowplaying = app.music.methods.getNowplaying();
		app.music.methods.setNowplaying(nowplaying.index, 'play');
	}
	
	
	/**
	 * 動画停止
	 * 
	 */
	app.music.methods.stop = function() {
		document.getElementById('js-frame').innerHTML = '';
		if ( 'object' === typeof player && 'destroy' in player )
			player.destroy();
		player = {};
		app.music.methods.setNowplaying(null, 'stop');
	}
	
	
	/**
	 * 再生中の曲の情報を取得
	 * @return {object}
	 */
	app.music.methods.getNowplaying = function() {
		// default
		var nowplaying = {
			index: null,
			state: 'stop',
		};
		// stop 以外の状態を検索
		var states = app.Vue.data.items.map(function(elem){
			return ( 'stop' != elem.state );
		});
		if ( -1 !== states.indexOf(true) ) {
			nowplaying.index = states.indexOf(true);
			nowplaying.state = app.Vue.data.items[nowplaying.index]['state'];
		}
		return nowplaying;
	}
	
	
	/**
	 * 再生中の曲の情報を設定
	 * @param {integer} index [再生中の曲の順番]
	 * @param {string}  state [play/pause/stop]
	 */
	app.music.methods.setNowplaying = function( index, state ) {
		var frame = document.getElementById('js-frame');
		// 他をリセット
		frame.setAttribute('state', 'stop');
		app.Vue.data.items.map(function(item) {
			item.state = 'stop';
			return item;
		});
		// ターゲットにセット
		if ( null != index ){
			frame.setAttribute('state', state);
			app.Vue.data.items[index]['state'] = state;
		}
		return;
	}
	
	
	/**
	 * youtube の iframe をつくる
	 * @param {string} videoId [youtube の video ID]
	 * 
	 * @link https://developers.google.com/youtube/iframe_api_reference
	 */
	app.music.methods.createYoutube = function( videoId ) {
		if ( "" == videoId ){
			app.music.methods.stop();
			return;
		}
		
		// frame を初期化
		document.getElementById('js-frame').innerHTML = '';
		if ( 'object' === typeof player && 'destroy' in player )
			player.destroy();
		player = {};
		 
		// create youtube frame
		var params = {
			videoId   : videoId,
			playerVars: {
				autoplay: 1,
			},
			events: {
				onStateChange: app.music.methods.onYoutubeStateChange,
				onError      : app.music.methods.onYoutubeError,
			}
		};
		player = new YT.Player('js-frame', params);
	}
	
	
	/**
	 * youtube の状態変更時の処理
	 * 
	 * @link https://developers.google.com/youtube/iframe_api_reference#Events
	 */
	app.music.methods.onYoutubeStateChange = function( event ){
		if ( 0 == event.data) { // end video
			var nowplaying = app.music.methods.getNowplaying();
			var nextItem   = app.Vue.data.items[nowplaying.index + 1];
			
			if ( app.music.autoplay && undefined != nextItem  && "" != nextItem.youtubeID ) {
				app.music.methods.createYoutube(nextItem.youtubeID);
				app.music.methods.setNowplaying(nowplaying.index + 1, 'play');
			} else {
				app.music.methods.stop();
			}
		}
	}
	
	
	app.music.methods.onYoutubeError = function( event ){
		console.log('onYoutubeError');
		console.log(event);
		app.music.methods.stop();
	}
	
	
	// init Vue
	new Vue(app.Vue);
})();