(function(){
	var app = {
		Vue  : {},
		music: {},
	};
	
	// 
	app.Vue.el         = '#js-vue';
	app.Vue.methods    = {};
	app.Vue.watch      = {};
	app.Vue.data       = {};
	app.Vue.data.items = [];
	app.music.methods  = {};
	app.music._songs   = [];
	app.music.player   = {};
	app.music.titles   = [
		'', 
		'十二音平均律→バークリー・メソッド→MIDIを経由する近・現代商業音楽史',
		'ジャズにおいてモダンとは何か？',
		'モダンとプレ・モダン',
		'1950年代のアメリカと、ジャズ・モダニズムの結晶化',
		'1959 〜 1962年におけるジャズの変化 (1) ',
		'1959 〜 1962年におけるジャズの変化 (2) ',
		'フリー・ジャズとは何からのフリーだったのか？',
		'1965 〜 1975年のマイルズ・デイヴィス (1)  コーダル・モーダルとフアンク',
		'1965 〜 1975年のマイルス・デイヴィス (2)  電化と磁化',
		'MIDIとモダニズムの終焉',
		'前期テスト'
	];
	
	// defaults
	app.music.autoplay   = true;
	app.music.sortby     = 'songID';
	app.music.filterby   = 'all';
	app.music.nowplaying = {
		songID: null,
		state : 'stop',
	};
	document.querySelector('[isAutoplay="true"]').classList.add('type-active');
	document.querySelector('[sortby="' + app.music.sortby + '"]').classList.add('type-active');
	document.querySelector('[filterby="' + app.music.filterby + '"]').classList.add('type-active');
	
	
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
			app.music._songs   = JSON.parse(request.responseText);
			app.Vue.data.items = app.music._songs.map(function(item, index) {
				var discogsSlug = item.discogsID.replace('r', 'release/').replace('m', 'master/');
				item.discogsURL = 'https://www.discogs.com/' + discogsSlug;
				item.state      = 'stop';
				item.songID     = index;
				item.chapterTitle = app.music.titles[item.chapter];
				return item;
			});
		};
		request.open('GET', path, true);
		request.send();
		
		document.getElementsByClassName('m-songs__list m-content')[0].classList.add('type-active');
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
	 * 
	 * @link https://jp.vuejs.org/v2/guide/events.html
	 */
	app.Vue.methods.onClickSort = function ( event ){
		// update
		app.music.sortby = event.currentTarget.getAttribute('sortby');
		
		// 他をリセット
		var buttons = document.querySelectorAll('.type-sort .type-active');
		Object.keys(buttons).forEach(function (key) {
			buttons[key].classList.remove('type-active');
		}, buttons);
		// ターゲットにセット
		event.currentTarget.classList.add('type-active');
		
		app.Vue.methods.sort(app.Vue.data.items, app.music.sortby);
	}
	
	
	/**
	 * フィルターボタンのクリックイベント
	 * 
	 * @link https://jp.vuejs.org/v2/guide/events.html
	 */
	app.Vue.methods.onClickFilter = function( event ){
		// update
		app.music.filterby = event.currentTarget.getAttribute('filterby');
		
		// 他をリセット
		var buttons = document.querySelectorAll('.type-filter .type-active');
		Object.keys(buttons).forEach(function (key) {
			buttons[key].classList.remove('type-active');
		}, buttons);
		// ターゲットにセット
		event.currentTarget.classList.add('type-active');
		
		if ( 'all' == app.music.filterby ) {
			app.Vue.data.items = app.music._songs;
		} else {
			app.Vue.data.items = app.music._songs.filter(function(item){
				return ( app.music.filterby == item.chapter );
			});
		}
		
		// app.music.nowplaying の状態を反映
		app.Vue.data.items.map(function(item) {
			if ( item.songID == app.music.nowplaying.songID ){
				item.state = app.music.nowplaying.state
			} else {
				item.state = 'stop';
			}
			return item;
		})
		// フィルターした後にソートも適用
		app.Vue.methods.sort(app.Vue.data.items, app.music.sortby);
		
		// reset search
		document.getElementById('js-searchby').value = '';
	}
	
	
	/**
	 * autoplay の設定を切り替え
	 * 
	 */
	app.Vue.methods.toggleAutoplay = function( event ){
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
	 * キーワード検索。
	 * input の change に反応。
	 * leader, title, album が検索対象。
	 * フィルターとの併用はなし。検索実行時にフィルターを 'all' に設定。
	 * 
	 * @param {obj} event []
	 * 
	 * @link https://qiita.com/ykob/items/6e4d0b07bed57881a2bd
	 * @link https://siongui.github.io/2017/02/03/vuejs-input-change-event/
	 * @link https://jp.vuejs.org/v2/examples/firebase.html
	 * @link https://qiita.com/growsic/items/fb57552053cf90f0fc31
	 */
	app.Vue.methods.onChangeSearch = function( event ) {
		// only input event
		if ( 'input' != event.type )
			return;
		
		// search
		var escape  = event.target.value.replace(/[&'`"<>]/g, '');
		var regexp  = new RegExp(escape, 'i');
		var matches = app.music._songs.filter(function( item ) {
			if ( item.leader.match(regexp) || item.title.match(regexp) || item.album.match(regexp))
				return item;
		});
		// sort after search
		app.Vue.methods.sort(matches, app.music.sortby);
		
		// reset filter
		if ( 'all' != app.music.filterby ) {
			document.querySelector('.type-active[filterby]').classList.remove('type-active');
			document.querySelector('[filterby]').classList.add('type-active');
			app.music.filterby = 'all';
		}
	}
	
	
	/**
	 * このサイトについて の表示切り替え
	 * 
	 */
	app.Vue.methods.toggleAboutContent = function( trigger ) {
		var target = document.getElementById('js-about');
		
		switch ( trigger ){
			case 'open':
				target.classList.add('type-open');
				break;
			default:
				target.classList.remove('type-open');
				break;
		}
	}
	
	
	/**
	 * ハンバーガーメニューの切り替え
	 * 
	 */
	app.Vue.methods.toggleHamburger = function() {
		var target = document.getElementsByClassName('p-home l-home')[0];
		
		if ( target.classList.contains('type-nav-open') ) {
			target.classList.remove('type-nav-open');
		} else {
			target.classList.add('type-nav-open');
		}
	}
	
	
	/**
	 * プレイボタンのクリックイベント
	 * 
	 */
	app.Vue.methods.onClickPlay = function( event ) {
		var thisSongID  = event.currentTarget.getAttribute('songID');
		
		if ( thisSongID == app.music.nowplaying.songID ) {
			switch ( app.music.nowplaying.state ){
				case 'play':
					app.music.methods.pause();
					break;
				case 'pause':
					app.music.methods.reStart();
					break;
				default:
					break;
			}
		} else {
			app.music.methods.start( event );
		}
	}
	
	
	/**
	 * 動画スタート
	 * クリックイベントで実行
	 */
	app.music.methods.start = function( event ) {
		app.music.methods.setNowplaying(event.currentTarget.getAttribute('songID'), 'play');
		app.music.methods.createYoutube(event.currentTarget.getAttribute('youtubeID'));
	}
	
	
	/**
	 * 動画一時停止
	 * 
	 */
	app.music.methods.pause = function() {
		app.music.player.pauseVideo();
		app.music.methods.setNowplaying(app.music.nowplaying.songID, 'pause');
	}
	
	
	/**
	 * 動画一時停止から復帰
	 * 
	 */
	app.music.methods.reStart = function() {
		app.music.player.playVideo();
		app.music.methods.setNowplaying(app.music.nowplaying.songID, 'play');
	}
	
	
	/**
	 * 動画停止
	 * 
	 */
	app.music.methods.stop = function() {
		document.getElementById('js-frame').innerHTML = '';
		if ( 'object' === typeof app.music.player && 'destroy' in app.music.player )
			app.music.player.destroy();
		app.music.player = {};
		app.music.methods.setNowplaying(null, 'stop');
	}
	
	
	/**
	 * 再生中の曲の情報を取得
	 * @return {object}
	 */
	app.music.methods.getNowplaying = function() {
		return app.music.nowplaying;
	}
	
	
	/**
	 * 再生中の曲の情報を設定
	 * @param {integer} songID [再生中の曲のID]
	 * @param {string}  state  [play/pause/stop]
	 */
	app.music.methods.setNowplaying = function( songID, state ) {
		// music 側の大本を更新
		app.music.nowplaying.songID = songID;
		app.music.nowplaying.state  = state;
		
		// vue も更新して表示に反映
		app.Vue.data.items.map(function(item) {
			if ( item.songID == app.music.nowplaying.songID ) {
				// ターゲットにセット
				item.state = state;
			} else {
				// 他をリセット
				item.state = 'stop';
			}
			return item;
		});
		// youtube frame の状態も更新
		document.getElementById('js-frame').setAttribute('state', state);
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
		if ( 'object' === typeof app.music.player && 'destroy' in app.music.player )
			app.music.player.destroy();
		app.music.player = {};
		 
		// create youtube frame
		var params = {
			videoId   : videoId,
			playerVars: {
				autoplay   : 1,
				playsinline: 1,
			},
			events: {
				onReady      : app.music.methods.onYoutubeReady,
				onStateChange: app.music.methods.onYoutubeStateChange,
				onError      : app.music.methods.onYoutubeError,
			}
		};
		app.music.player = new YT.Player('js-frame', params);
	}
	
	
	/**
	 * youtube の準備が完了したら動画スタート
	 * @param {object} event []
	 * 
	 * @link https://developers.google.com/youtube/iframe_api_reference#Events
	 */
	app.music.methods.onYoutubeReady = function( event ) {
		console.log( 'onYoutubeReady(): ' + event.target.getVideoData().video_id );
		event.target.playVideo();
	}
	
	
	/**
	 * youtube の状態変更時の処理
	 * 
	 * @link https://developers.google.com/youtube/iframe_api_reference#Events
	 */
	app.music.methods.onYoutubeStateChange = function( event ){
		if ( 0 == event.data ) { // end video
			var nextItem;
			var appears = app.Vue.data.items.map(function(item) {
				return ( item.songID == app.music.nowplaying.songID );
			});
			if ( -1 != appears.indexOf(true) )
				nextItem = app.Vue.data.items[appears.indexOf(true) + 1];
			
			if ( app.music.autoplay && undefined != nextItem  && "" != nextItem.youtubeID ) {
				app.music.methods.createYoutube(nextItem.youtubeID);
				app.music.methods.setNowplaying(nextItem.songID, 'play');
			} else {
				app.music.methods.stop();
			}
		}
	}
	
	
	app.music.methods.onYoutubeError = function( event ){
		app.music.methods.stop();
		console.log('onYoutubeError');
		console.log(event);
		alert('Youtube の設定により再生に失敗しました。 Error code: ' + event.data);
	}
	
	
	// init Vue
	new Vue(app.Vue);
})();