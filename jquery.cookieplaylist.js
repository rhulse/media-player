/*
 	Cookie Playlist Plugin

	This plugin manages a playlist of integers stored in a cookie

	The initialise function return a cookie class (so we can have more thean)

	Copyright (c) 2008 Radio New Zealand
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

	requires the jQuery Cookie plugin

*/


(function($) {

  // Public Variables and Methods
  $.cookiePlaylist = {

		initialise: function( name, max_age ) {
			name		= name || 'audio_playlist';
			max_age	= max_age || 14;
			return new cookie( name, max_age );
		}
	}

	function cookie( name, max_age ) {

		this.cookie_name 	= name;
		this.max_age			= max_age;
		this.playlist 		= new Array();

		this.add = function(id){
			this.load();
			if( ! in_array( id, this.playlist ) ) {
				this.playlist.push(id);
				this.save();
			}
		};

		this.remove = function(id){
			this.load();
			var i = 0;
			while ( i < this.playlist.length ) {
				if ( this.playlist[i] == id ) {
					this.playlist.splice( i, 1);
				}
				else {
					i++;
				}
			}
			this.save();
		};

		this.push = function(id){
			this.add(id);
		};

		this.pop = function(){
			this.load();
			id = this.playlist.pop();
			this.save();
			return id;
		};

		this.shift = function(){
			this.load();
			id = this.playlist.shift();
			this.save();
			return id;
		};

		this.count = function(){
			this.load();
			return this.playlist.length;
		};

		this.save = function(){
			$.cookie( this.cookie_name, this.playlist.join(), {path: '/', expires: this.max_age} );
			// console.log("playlist: saved playlist - " + playlist);
		};

		this.clear = function(id){
			$.cookie( this.cookie_name, null );
		};

		this.load = function(){
			var temp_playlist = new Array();
			var pstr = $.cookie( this.cookie_name );
			if( pstr ){
				temp_playlist = pstr.split(',');
			}
			this.playlist = temp_playlist;
			// console.log("playlist: loaded - " + playlist.join() );
		};

		this.show = function(){
			this.load();
			console.log( "Playlist '" + this.cookie_name +  "': " + this.playlist.join() );
		}

		function in_array(needle, haystack, strict) {
			// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    var found = false, key, strict = !!strict;
	    for (key in haystack) {
	      if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
					found = true;
		      break;
		    }
		  }
		 return found;
		}

	};

})(jQuery);
