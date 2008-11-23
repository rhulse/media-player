/*
 	Cookie Playlist Plugin

	This plugin manages a playlist of integers stored in a cookie

	Copyright (c) 2008 Radio New Zealand
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

	requires the jQuery Cookie plugin

*/


(function($) {

  // Private Variables
	var DEBUG = 1;

	var playlist = new Array();

	var cookie_name = 'audio_playlist';

	var paused_at = 0;

  // Public Variables and Methods
  $.cookiePlaylist = {

		initialise: function( playlist_name ) {
			cookie_name	= playlist_name || cookie_name;
			this.load();
		},

		add: function(id){
			if( ! in_array( id, playlist ) ) {
				playlist.push(id);
				this.save();
			}
		},

		remove: function(id){
			var i = 0;
			while ( i < playlist.length ) {
				if ( playlist[i] == id ) {
					playlist.splice( i, 1);
				}
				else {
					i++;
				}
			}
			this.save();
		},

		pop: function(){
			return playlist.pop;
		},

		save: function(){
			$.cookie( cookie_name, playlist.join(), {duration: 14} );
			// console.log("playlist: saved playlist - " + playlist);
		},

		clear: function(id){
			$.cookie( cookie_name, null );
		},

		load: function(){
			var temp_playlist = new Array();
			var pstr = $.cookie( cookie_name );
			if( pstr ){
				temp_playlist = pstr.split(',');
			}
			playlist = temp_playlist;
			// console.log("playlist: loaded - " + playlist.join() );
		}

	};

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

})(jQuery);
