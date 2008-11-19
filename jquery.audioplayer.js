/*
 	Audio Player Plugin

	This plugin sets up an audio player that can handle MP3 and OGG formats
	A flash object is used for MP3 and the <audio> tag (if supported) is for OGG.
	
	Copyright (c) 2008 Radio New Zealand
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

*/

(function($) {

	// the Flash player that will play the MP3 files
	var SWF = null;

	// the audio element that will play the ogg files
	var OGG = null;

	// the flash values used to set up the flash movie in the page.
	var flash = {
			path : "audioplayer.swf",
			vars : {},
			params : {
				allowScriptAccess: 'always',
				wMode: 'transparent',
				swLiveConnect: true
	 		},
			ver : "9.0.0",
			width : 1,
			height: 1,
			exp: "expressInstall.swf",
			replace : "mp3-player p",
			attribs : {
				id:"flashplayer",
				name:"flashplayer"
			}
	};

	var audio = {
				pan : 0,
				volume : 50,
				volume_max : 100,
				volume_increment : 5,
				// these are used to work around flash not reseting its position on stop
				// so we track the state and return 0 instead of the (apparently) wrong flash value
				// also means the plugin works the same for <audio> and flash implementations
				playing : false,
				paused_at : 0,
				current_url : '',
				current_pos : 0
	};
	

	// this equals seconds
	
	var settings = {};
	
  // Public Variables and Methods
  $.audioPlayer = {

		initialise: function( settings ) {
			flash.path 			= settings.mp3Player || flash.path;
			flash.exp 			= settings.mp3Export || flash.exp;
//			callback.volume = settings.volumeCallback || callback.volume;
//			callback.timer	= settings.timerCallback || callback.timer;
			
			attach_flash_player();
			attach_audio_tag();
			// send initial volume and position
			this.events.onSoundVolume();
			this.events.onSoundPosition();
		},

	  load: function( url ) {
			audio.current_url = url;
			audioCommand( 'load' );
		},

	  stop: function() {
			if ( audioCommand( 'stop' ) ) {
				this.events.onSoundStop();
			} 
		},

		play: function( position ) {
			// do we resume or start at the stated position
			audio.current_pos = (audio.paused_at) ? audio.paused_at : position;
			if ( audioCommand( 'play' ) ){
				this.events.onSoundPlay();
			}
		},

	  pause: function() {
			if ( audioCommand( 'pause' ) ) {
				this.events.onSoundPause();
			}
	  },

		louder: function() {
      if ( audio.volume >= audio.volume_max ){ 
				return; 
			}
      audio.volume += audio.volume_increment;
			if ( audioCommand( 'volume' ) ) {
				this.events.onSoundVolume();
			}
    },

    quieter: function() {
      if ( audio.volume <= 0.0 ) { 
				return;
			}
      audio.volume -= audio.volume_increment;
			if ( audioCommand( 'volume' ) ) {
				this.events.onSoundVolume();
			}
    },

		elapsedTime: function() {
			// flash does not return 0 for position if player is stopped. Annoying
			if ( !audio.playing && !this.isPaused() ) {
				return 0;
			}
			return audioCommand( 'elapsedTime' );
		},

		getVolume: function() {
			return audio.volume;
		},
		
		isPlaying: function() {
			return audio.playing;
		},
		
		isPaused: function() {
			return ( audio.paused_at > 0 ) ? true : false;
		},

		// called directy by the flash movie and triggered by events from <audio>
		events : {
			
			// events from the flash player
			onSoundComplete: function() {
				audioCommand( 'stop' );
				audio.playing = false;
				sendEvent( "soundStop" );
			},

			onFlashLoaded: function() {
				saveFlash();
			},
		
			onSoundStop: function() {
				audio.playing = false;
				sendEvent( "soundStop" );
			},

			onSoundPause: function() {
				audio.playing = false;
				sendEvent( "soundPause" );
			},
			
			onSoundPlay: function() {
				audio.playing = true;
				sendEvent( "soundPlay" );
			},
		
			onSoundVolume: function() {
				sendEvent( "soundVolumeChange", { volume: audio.volume})
			},

			onSoundPosition: function() {
				sendEvent( "soundPositionChange", { volume: audio.volume})
			}
		}

	};

 	//Private Functions
	function attach_flash_player() {		
		var f = flash;
		$("body").append('<div id="mp3-player"><p></p></div>');
		jQuery.swfobject.embedSWF( f.path, f.replace, f.width, f.height, f.ver, f.exp, f.vars, f.params, f.attribs);
	}

	function saveFlash() {
		SWF = jQuery.swfobject.getObjectById(flash.attribs.id);		
	}

	function attach_audio_tag() {
		$("body").append('<audio id="ogg-player" type="audio/ogg; codecs=vorbis"></audio>');
		audio_elements = $('audio');
		// testing for volume is not a good test for Vorbis support because
		// for example, Safari has <audio> tag support for quicktime, so will pass this test
		// so we test that it's mozilla too. Seems like a safe assumption for now.
		if ( 'volume' in audio_elements[0] && $.browser.mozilla ){
			// a single element is used at the moment.
			OGG = audio_elements[0];
		}
	}

	function audioCommand( cmd ) {
		if ( audio.current_url.match( /\.ogg/ ) ) {
			return OGGCommand( cmd );
		}
		else if ( audio.current_url.match( /\.mp3/ ) ) {
			return SWFCommand( cmd );
		}
	}

	function SWFCommand ( cmd ){
		switch( cmd ) {
			case 'load' 	:
											break;

			case 'play' 	: SWF.startSound( audio.current_url, audio.current_pos, audio.volume, audio.pan );
											break;

			case 'stop' 	: SWF.stopSound( audio.current_url );
											audio.paused_at = 0;
											break;

			case 'pause'	:	SWF.stopSound( audio.current_url );
											audio.paused_at = SWF.getPosition( audio.current_url ) || audio.paused_at;
											break;

			case 'volume' : SWF.setVolume( audio.current_url, audio.volume );
											break;

			case 'elapsedTime' : return ( SWF.getPosition( audio.current_url ) / 1000 ) || 0;
											break;
		}
		return true;		
	}

	function OGGCommand ( cmd ){
		if ( ! OGG ) return false;

		switch( cmd ) {
			case 'load' 	: $('audio').attr({
													src: audio.current_url,
											});
											setOGGVolume( audio.volume );
											OGG.muted = false;
											break;

			case 'play' 	: OGG.play();
											break;

			case 'stop' 	: OGG.pause();
											OGG.currentTime = 0;
											audio.paused_at = 0;
											break;

			case 'pause'	:	OGG.pause();
											audio.paused_at = OGG.currentTime;
											break;

			case 'volume' : setOGGVolume( audio.volume );
											break;

			case 'elapsedTime' : return OGG.currentTime;
											break;
		}
		return true;
	}

	function setOGGVolume( vol ) {
		OGG.volume = audio.volume / 100;
	}
	
	function sendEvent ( event, params ) {
		$(document).trigger( event, params )
	}

	$.audioPlayer.settings = {};
	

})(jQuery);

/*
	SWFObject v2.1 <http://code.google.com/p/swfobject/>
	Copyright (c) 2007-2008 Geoff Stearns, Michael Williams, and Bobby van der Sluis
	This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>

	jQuery v1.2.6 <http://jquery.com/>
	Copyright (c) 2008 John Resig
	This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
	This software is released under the GPL License <http://www.opensource.org/licenses/gpl-2.0.php>

	jQuery SWFObject Plugin v1.0.3 <http://jquery.thewikies.com/swfobject/>
	Copyright (c) 2008 Jonathan Neal
	This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
	This software is released under the GPL License <http://www.opensource.org/licenses/gpl-2.0.php>

*//*jslint
	bitwise: true,
	browser: true,
	eqeqeq: true,
	forin: true,
	onevar: false,
	plusplus: false,
	regexp: true,
	undef: true,
	white: true
*//*global
	jQuery
	ActiveXObject
*/

(function ($) {
	$.swfobject = function () {
		var UNDEF = 'undefined',
		OBJECT = 'object',
		SHOCKWAVE_FLASH = 'Shockwave Flash',
		SHOCKWAVE_FLASH_AX = 'ShockwaveFlash.ShockwaveFlash',
		FLASH_MIME_TYPE = 'application/x-shockwave-flash',
		EXPRESS_INSTALL_ID = 'SWFObjectExprInst',

		win = window,
		doc = document,
		nav = navigator,

		regObjArr = [],
		objIdArr = [],
		listenersArr = [],
		storedAltContent = null,
		storedAltContentId = null,
		isExpressInstallActive = false,

		ua,
		fixParams,
		showExpressInstall,
		displayAltContent,
		abstractAltContent,
		createSWF,
		createObjParam,
		removeSWF,
		removeObjectInIE,
		addListener,
		hasPlayerVersion,
		createCSS,
		setVisibility,
		urlEncodeIfNecessary,
		cleanup;

		ua = function () {
			var w3cdom = typeof doc.getElementById !== UNDEF && typeof doc.getElementsByTagName !== UNDEF && typeof doc.createElement !== UNDEF,
			playerVersion = [0, 0, 0],
			d = null;
			if (typeof nav.plugins !== UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] === OBJECT) {
				d = nav.plugins[SHOCKWAVE_FLASH].description;
				if (d && !(typeof nav.mimeTypes !== UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) {
					d = d.replace(/^[\S|\s]*\s+(\S+\s+\S+$)/, '$1');
					playerVersion[0] = parseInt(d.replace(/^([\S|\s]*)\.[\S|\s]*$/, '$1'), 10);
					playerVersion[1] = parseInt(d.replace(/^[\S|\s]*\.([\S|\s]*)\s[\S|\s]*$/, '$1'), 10);
					playerVersion[2] = /r/.test(d) ? parseInt(d.replace(/^[\S|\s]*r([\S|\s]*)$/, '$1'), 10) : 0;
				}
			}
			else if (typeof win.ActiveXObject !== UNDEF) {
				var a = null, fp6Crash = false;
				try {
					a = new ActiveXObject(SHOCKWAVE_FLASH_AX + '.7');
				}
				catch (e) {
					try {
						a = new ActiveXObject(SHOCKWAVE_FLASH_AX + '.6');
						playerVersion = [6, 0, 21];
						a.AllowScriptAccess = 'always';
					}
					catch (ee) {
						if (playerVersion[0] === 6) {
							fp6Crash = true;
						}
					}
					if (!fp6Crash) {
						try {
							a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
						}
						catch (eee) {}
					}
				}
				if (!fp6Crash && a) {
					try {
						d = a.GetVariable('$version');
						if (d) {
							d = d.split(' ')[1].split(',');
							playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
						}
					}
					catch (eeee) {}
				}
			}
			var u = nav.userAgent.toLowerCase(),
				p = nav.platform.toLowerCase();
			return {
				w3cdom: w3cdom,
				pv: playerVersion,
				webkit: jQuery.browser.safari ? jQuery.browser.version : false,
				ie: jQuery.browser.msie,
				win: p ? /win/.test(p) : /win/.test(u),
				mac: p ? /mac/.test(p) : /mac/.test(u)
			};
		}();

		$(function () {
			var rl = regObjArr.length;
			for (var i = 0; i < rl; i++) {
				var id = regObjArr[i].id;
				if (ua.pv[0] > 0) {
					var obj = $('#' + id);
					if (obj.length) {
						regObjArr[i].width = obj.attr('width') ? obj.attr('width') : '0';
						regObjArr[i].height = obj.attr('height') ? obj.attr('height') : '0';
						if (hasPlayerVersion(regObjArr[i].swfVersion)) {
							if (ua.webkit && ua.webkit < 312) {
								fixParams(obj[0]);
							}
							setVisibility(id, true);
						}
						else if (regObjArr[i].expressInstall && !isExpressInstallActive && hasPlayerVersion('6.0.65') && (ua.win || ua.mac)) {
							showExpressInstall(regObjArr[i]);
						}
						else {
							displayAltContent(obj[0]);
						}
					}
				}
				else {
					setVisibility(id, true);
				}
			}
		});

		fixParams = function (obj) {
			obj = $(obj);
			var nestedObj = obj.find('object');
			if (nestedObj.length) {
				var e = $('<embed />'), a = nestedObj[0].attributes;
				if (a) {
					for (var i = 0; i < a.length; i++) {
						e.attr((a[i].nodeName === 'DATA') ? 'src' : a[i].nodeName, a[i].nodeValue);
					}
				}
				nestedObj.children().each(function () {
					if (this.nodeType === 1 && this.nodeName === 'PARAM') {
						e.attr($(this).attr('name'), $(this).attr('value'));
					}
				});
				obj.replaceWith(e);
			}
		};

		showExpressInstall = function (regObj) {
			isExpressInstallActive = true;
			var obj = $('#' + regObj.id);
			if (obj.length) {
				if (regObj.altContentId) {
					var ac = $('#' + regObj.altContentId)[0];
					if (ac) {
						storedAltContent = ac;
						storedAltContentId = regObj.altContentId;
					}
				}
				else {
					storedAltContent = abstractAltContent(obj[0]);
				}
				if (!/%$/.test(regObj.width) && parseInt(regObj.width, 10) < 310) {
					regObj.width = '310';
				}
				if (!/%$/.test(regObj.height) && parseInt(regObj.height, 10) < 137) {
					regObj.height = '137';
				}
				doc.title = doc.title.slice(0, 47) + ' - Flash Player Installation';
				var pt = ua.ie && ua.win ? 'ActiveX' : 'PlugIn',
					dt = doc.title,
					fv = "MMredirectURL=" + win.location + "&MMplayerType=" + pt + "&MMdoctitle=" + dt,
					replaceId = regObj.id;
				if (ua.ie && ua.win && obj[0].readyState !== 4) {
					replaceId += 'SWFObjectNew';
					var newObj = $('<div id="' + replaceId + '" />');
					obj.before(newObj);
					obj.css('display', 'none');
					var fn = function () {
						obj.remove();
					};
					addListener(win, 'onload', fn);
				}
				createSWF({
					data: regObj.expressInstall,
					id: EXPRESS_INSTALL_ID,
					width: regObj.width,
					height: regObj.height
				}, {
					flashvars: fv
				}, replaceId);
			}
		};

		displayAltContent = function (obj) {
			obj = $(obj);
			if (ua.ie && ua.win && obj[0].readyState !== 4) {
				var el = $('<div/>');
				obj.before(el);
				el.replaceWith($(abstractAltContent(obj[0])));
				obj.css('display', 'none');
				var fn = function () {
					obj.remove();
				};
				addListener(win, 'onload', fn);
			}
			else {
				obj.replaceWith($(abstractAltContent(obj[0])));
			}
		};

		abstractAltContent = function (obj) {
			obj = $(obj);
			var ac = $('<div />');
			if (ua.win && ua.ie) {
				ac.html(obj.html());
			}
			else {
				obj.find('object').children().each(function () {
					if (!(this.nodeType === 1 && this.nodeName === 'PARAM') && !(this.nodeType === 8)) {
						$(this.cloneNode(true)).appendTo(ac);
					}
				});
			}
			return ac[0];
		};

		createSWF = function (attObj, parObj, id) {
			var r, el = $('#' + id);
			if (el.length) {
				if (typeof attObj.id === UNDEF) {
					attObj.id = id;
				}
				if (ua.ie && ua.win) {
					var att = '';
					for (var i in attObj) {
						if (attObj[i] !== Object.prototype[i]) {
							if (i.toLowerCase() === 'data') {
								parObj.movie = attObj[i];
							}
							else if (i.toLowerCase() === 'styleclass') {
								att += ' class="' + attObj[i] + '"';
							}
							else if (i.toLowerCase() !== 'classid') {
								att += ' ' + i + '="' + attObj[i] + '"';
							}
						}
					}
					var par = '';
					for (var j in parObj) {
						if (parObj[j] !== Object.prototype[j]) {
							par += '<param name="' + j + '" value="' + parObj[j] + '" />';
						}
					}
					el[0].outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
					objIdArr[objIdArr.length] = attObj.id;
					r = $('#' + attObj.id)[0];
				}
				else if (ua.webkit && ua.webkit < 312) {
					var e = $('<embed type="' + FLASH_MIME_TYPE + '" />');
					for (var k in attObj) {
						if (attObj[k] !== Object.prototype[k]) {
							if (k.toLowerCase() === 'data') {
								e.attr('src', attObj[k]);
							}
							else if (k.toLowerCase() === 'styleclass') {
								e.attr('class', attObj[k]);
							}
							else if (k.toLowerCase() !== 'classid') {
								e.attr(k, attObj[k]);
							}
						}
					}
					for (var l in parObj) {
						if (parObj[l] !== Object.prototype[l]) {
							if (l.toLowerCase() !== 'movie') {
								e.attr(l, parObj[l]);
							}
						}
					}
					el.replaceWith(e);
					r = e[0];
				}
				else {
					var o = $('<object type="' + FLASH_MIME_TYPE + '" />');
					for (var m in attObj) {
						if (attObj[m] !== Object.prototype[m]) {
							if (m.toLowerCase() === 'styleclass') {
								o.attr('class', attObj[m]);
							}
							else if (m.toLowerCase() !== 'classid') {
								o.attr(m, attObj[m]);
							}
						}
					}
					for (var n in parObj) {
						if (parObj[n] !== Object.prototype[n] && n.toLowerCase() !== 'movie') {
							createObjParam(o[0], n, parObj[n]);
						}
					}
					el.replaceWith(o);
					r = o[0];
				}
			}
			return r;
		};

		createObjParam = function (el, pName, pValue) {
			$(el).append($('<param name="' + pName + '" value="' + pValue + '" />'));
		};

		removeSWF = function (id) {
			var obj = $('#' + id);
			if (obj && (obj[0].nodeName === 'OBJECT' || obj[0].nodeName === 'EMBED')) {
				if (ua.ie && ua.win) {
					if (obj[0].readyState === 4) {
						removeObjectInIE(id);
					}
					else {
						win.attachEvent('onload', function () {
							removeObjectInIE(id);
						});
					}
				}
				else {
					obj.remove();
				}
			}
		};

		removeObjectInIE = function (id) {
			var obj = $('#' + id);
			if (obj.length) {
				for (var i in obj[0]) {
					if (typeof obj[0][i] === 'function') {
						obj[0][i] = null;
					}
				}
				obj.remove();
			}
		};

		addListener = function (target, eventType, fn) {
			target.attachEvent(eventType, fn);
			listenersArr[listenersArr.length] = [target, eventType, fn];
		};

		hasPlayerVersion = function (rv) {
			var pv = ua.pv, v = rv.split(".");
			v[0] = parseInt(v[0], 10);
			v[1] = parseInt(v[1], 10) || 0;
			v[2] = parseInt(v[2], 10) || 0;
			return (pv[0] > v[0] || (pv[0] === v[0] && pv[1] > v[1]) || (pv[0] === v[0] && pv[1] === v[1] && pv[2] >= v[2])) ? true : false;
		};

		createCSS = function (sel, decl) {
			if (ua.ie && ua.mac) {
				return;
			}
			var h = $('head'), s = $('<style media="screen" type="text/css" />');
			if (!(ua.ie && ua.win) && typeof doc.createTextNode !== UNDEF) {
				$(doc.createTextNode(sel + ' {' + decl + '}')).appendTo(s);
			}
			s.appendTo(h);
			if (ua.ie && ua.win && typeof doc.styleSheets !== UNDEF && doc.styleSheets.length > 0) {
				var ls = doc.styleSheets[doc.styleSheets.length - 1];
				if (typeof ls.addRule === OBJECT) {
					ls.addRule(sel, decl);
				}
			}
		};

		setVisibility = function (id, isVisible) {
			var v = isVisible ? 'visible' : 'hidden', obj = $('#' + id);
			if (obj.length) {
				$(function () {
					obj.css('visibility', v);
				});
			}
			else {
				createCSS('#' + id, 'visibility: ' + v);
			}
		};

		urlEncodeIfNecessary = function (s) {
			var regex = /[\\\"<>\.;]/;
			var hasBadChars = regex.exec(s) !== null;
			return hasBadChars ? encodeURIComponent(s) : s;
		};

		cleanup = function () {
			if (ua.ie && ua.win) {
				window.attachEvent('onunload', function () {

					var ll = listenersArr.length;
					for (var i = 0; i < ll; i++) {
						listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
					}

					var il = objIdArr.length;
					for (var j = 0; j < il; j++) {
						removeSWF(objIdArr[j]);
					}

					for (var k in ua) {
						ua[k] = null;
					}
					ua = null;
					for (var l in jQuery.swfobject) {
						jQuery.swfobject[l] = null;
					}
					jQuery.swfobject = null;
				});
			}
		}();

		return {
			registerObject: function (objectIdStr, swfVersionStr, xiSwfUrlStr) {
				if (!ua.w3cdom || !objectIdStr || !swfVersionStr) {
					return;
				}
				var regObj = {};
				regObj.id = objectIdStr;
				regObj.swfVersion = swfVersionStr;
				regObj.expressInstall = xiSwfUrlStr ? xiSwfUrlStr : false;
				regObjArr[regObjArr.length] = regObj;
				setVisibility(objectIdStr, false);
			},
			getObjectById: function (objectIdStr) {
				var r = null;
				if (ua.w3cdom) {
					var o = $('#' + objectIdStr);
					if (o.length) {
						var n = o.find(OBJECT)[0];
						if (!n || (n && typeof o.SetVariable !== UNDEF)) {
							r = o[0];
						}
						else if (typeof n.SetVariable !== UNDEF) {
							r = n;
						}
					}
				}
				return r;
			},
			createCSS: function (sel, decl) {
				if (ua.w3cdom) {
					createCSS(sel, decl);
				}
			},
			createSWF: function (attObj, parObj, replaceElemIdStr) {
				if (ua.w3cdom) {
					return createSWF(attObj, parObj, replaceElemIdStr);
				}
				else {
					return undefined;
				}
			},
			embedSWF: function (swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj) {
				if (!ua.w3cdom || !swfUrlStr || !replaceElemIdStr || !widthStr || !heightStr || !swfVersionStr) {
					return;
				}
				widthStr += '';
				heightStr += '';
				if (hasPlayerVersion(swfVersionStr)) {
					setVisibility(replaceElemIdStr, false);
					var att = {};
					if (attObj && typeof attObj === OBJECT) {
						for (var i in attObj) {
							if (attObj[i] !== Object.prototype[i]) {
								att[i] = attObj[i];
							}
						}
					}
					att.data = swfUrlStr;
					att.width = widthStr;
					att.height = heightStr;
					var par = {};
					if (parObj && typeof parObj === OBJECT) {
						for (var j in parObj) {
							if (parObj[j] !== Object.prototype[j]) {
								par[j] = parObj[j];
							}
						}
					}
					if (flashvarsObj && typeof flashvarsObj === OBJECT) {
						for (var k in flashvarsObj) {
							if (flashvarsObj[k] !== Object.prototype[k]) {
								if (typeof par.flashvars !== UNDEF) {
									par.flashvars += '&' + k + '=' + flashvarsObj[k];
								}
								else {
									par.flashvars = k + '=' + flashvarsObj[k];
								}
							}
						}
					}
					$(function () {
						createSWF(att, par, replaceElemIdStr);
						if (att.id === replaceElemIdStr) {
							setVisibility(replaceElemIdStr, true);
						}
					});
				}
				else if (xiSwfUrlStr && !isExpressInstallActive && hasPlayerVersion('6.0.65') && (ua.win || ua.mac)) {
					isExpressInstallActive = true;
					setVisibility(replaceElemIdStr, false);
					$(function () {
						var regObj = {};
						regObj.id = regObj.altContentId = replaceElemIdStr;
						regObj.width = widthStr;
						regObj.height = heightStr;
						regObj.expressInstall = xiSwfUrlStr;
						showExpressInstall(regObj);
					});
				}
			},
			expressInstallCallback: function () {
				if (isExpressInstallActive && storedAltContent) {
					var obj = $('#' + EXPRESS_INSTALL_ID);
					if (obj.length) {
						obj.replaceWith($(storedAltContent));
						if (storedAltContentId) {
							setVisibility(storedAltContentId, true);
							if (ua.ie && ua.win) {
								$(storedAltContent).css('display', 'block');
							}
						}
						storedAltContent = null;
						storedAltContentId = null;
						isExpressInstallActive = false;
					}
				}
			},
			getFlashPlayerVersion: function () {
				return {
					major: ua.pv[0],
					minor: ua.pv[1],
					release: ua.pv[2]
				};
			},
			getQueryParamValue: function (param) {
				var q = doc.location.search || doc.location.hash;
				if (param === null) {
					return urlEncodeIfNecessary(q);
				}
				if (q) {
					var pairs = q.substring(1).split('&');
					for (var i = 0; i < pairs.length; i++) {
						if (pairs[i].substring(0, pairs[i].indexOf('=')) === param) {
							return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf('=') + 1)));
						}
					}
				}
				return '';
			},
			hasFlashPlayerVersion: hasPlayerVersion,
			removeSWF: function (objElemIdStr) {
				if (ua.w3cdom) {
					removeSWF(objElemIdStr);
				}
			}
		};
	}();
})(jQuery);

/*
 * jquery-periodic.js
 *
 * Adds a "periodic" function to jQuery which takes a callback and options for the frequency (in seconds) and a
 * boolean for allowing parallel execution of the callback function (shielded from exceptions by a try..finally block.
 * The first parameter passed to the callback is a controller object.
 *
 * Return falsy value from the callback function to end the periodic execution.
 *
 * For a callback which initiates an asynchronous process:
 * There is a boolean in the controller object which will prevent the callback from executing while it is "true".
 *   Be sure to reset this boolean to false when your asynchronous process is complete, or the periodic execution
 *   won't continue.
 *
 * To stop the periodic execution, you can also call the "stop" method
of the controller object, instead of returning
 * false from the callback function.
 *
 */
 jQuery.periodic = function (callback, options) {
      callback = callback || (function() { return false; });

      options = jQuery.extend({ },
                              { frequency : 10,
                                allowParallelExecution : false},
                              options);

      var currentlyExecuting = false;
      var timer;

      var controller = {
         stop : function () {
           if (timer) {
             window.clearInterval(timer);
             timer = null;
           }
         },
         currentlyExecuting : false,
         currentlyExecutingAsync : false
      };

      timer = window.setInterval(function() {
         if (options.allowParallelExecution || !(controller.currentlyExecuting || controller.currentlyExecutingAsync)){
            try {
                 controller.currentlyExecuting = true;
                 if (!(callback(controller))) {
                     controller.stop();
                 }
             } finally {
              controller.currentlyExecuting = false;
            }
         }
      }, options.frequency * 1000);
};
