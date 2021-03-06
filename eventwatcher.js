/*
 	UL FIFO display

	This plugin creates an unordered list and allow you to push elements onto it
	The list is limited to a specifed length

	call:

	$.ulfifo({ element : "selector", size: 10 })

	Copyright (c) 2008 Richard Hulse
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

*/

(function($) {

  $.ulfifo = {

		initialise: function( options ) {
			return new fifo( options );
		}
	}

	function fifo( options ) {

		var settings = {
			size 	: 12,
			el		: '#fifo'
		}

		var opts = $.extend({}, settings, options);

		var queue = new Array();

		var ul = jQuery('<ul>').appendTo(opts.el);

		this.add_message = function(msg){
			queue.unshift(msg);
			if ( queue.length >= opts.size ) {
				queue.pop();
			}
			display_queue();
		};

		this.clear = function(id){
			queue = [];
		};

		this.show = function(){
			console.log( "Queue : " + queue.join() );
		};

		function display_queue(){
			ul.html('');
			$.each( queue, function( i, el ){
				jQuery('<li>' + el + '</li>').appendTo(ul);
			});
		};
	};

})(jQuery);


/*
 	Event monitoring of the HTM5 events from  http://www.whatwg.org/specs/web-apps/current-work/

	This plugin attaches to an audio or video element and tracks events and some attributes in realtime

	Copyright (c) 2008 Richard Hulse
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

*/

(function($) {

	// a hash to store the names of events and the count for each
	var events = new Hash(
		'loadstart', 0,
		'progress', 0,
		'suspend', 0,
		'load', 0,
		'abort', 0,
		'error', 0,
		'emptied', 0,
		'play', 0,
		'pause', 0,
		'stalled', 0,
		'loadedmetadata', 0,
		'loadeddata', 0,
		'waiting', 0,
		'playing', 0,
		'canplay', 0,
		'canplaythrough', 0,
		'seeking', 0,
		'seeked', 0,
		'timeupdate', 0,
		'ended', 0,
		'ratechange', 0,
		'durationchange', 0,
		'volumechange', 0
	);

	var attributes = ['readyState', 'networkState'];

  $.fn.trackEvents = function(container_div) {

		var last_event = new Date();
		var now = new Date();

		var fifo_div = '<div id="fifo"></div>';

		var status = '<table>';
		status += '<tr><th class="event">Attribute</th><th class="count">Value</th></tr>';
		for (var i in attributes) {
			status += '<tr><td>' + attributes[i] + '</td><td class="count a-' + attributes[i] + '">&nbsp;</td></tr>';
		}
		status += '</table>';

		// build the table and attach the events
		var table = '<table>';
		table += '<tr><th class="event">Event</th><th class="count">Count</th></tr>';
		for (var label in events.items) {
			var count = events.items[label];
			table += '<tr><td>' + label + '</td><td class="count e-' + label + '">' + count + '</td></tr>';
		}
		table += '</table>';

		// insert the tables
		$(container_div).html( fifo_div + status + table);

		var fifo = $.ulfifo.initialise();

		return this.each(function() {

			$(this).bind( 'loadstart progress	suspend	load	abort	error	emptied	play	pause	stalled	loadedmetadata	loadeddata	waiting	playing	canplay	canplaythrough	seeking	seeked	ended	ratechange	durationchange	volumechange',
				function(ev){
					now = new Date();
					elapsed = now - last_event;
					elapsed = (elapsed > 1000) ? ( Math.floor (elapsed/1000) + ' S' ) : elapsed + ' mS';
					fifo.add_message(ev.type + ' (' + elapsed + ')');
					last_event = new Date();
				});

				// attach all the events
			for (var event_name in events.items) {
				$(document).bind( event_name, function(e, m){
					var count = events.items[e.type];
					count ++;
					events.items[e.type] = count;
					$( '.e-' + e.type ).html( count );
					$( '.e-' + e.type ).css( {'background-color' : 'green' } );
					setTimeout( function(){
						$( '.e-' + e.type ).css( {'background-color' : 'white' } );
						}, 500);
				});
			};
		});
  };

})(jQuery);



// from http://www.mojavelinux.com/articles/javascript_hashes.html

function Hash()
{
	this.length = 0;
	this.items = new Array();
	for (var i = 0; i < arguments.length; i += 2) {
		if (typeof(arguments[i + 1]) != 'undefined') {
			this.items[arguments[i]] = arguments[i + 1];
			this.length++;
		}
	}

	this.removeItem = function(in_key)
	{
		var tmp_value;
		if (typeof(this.items[in_key]) != 'undefined') {
			this.length--;
			var tmp_value = this.items[in_key];
			delete this.items[in_key];
		}

		return tmp_value;
	}

	this.getItem = function(in_key) {
		return this.items[in_key];
	}

	this.setItem = function(in_key, in_value)
	{
		if (typeof(in_value) != 'undefined') {
			if (typeof(this.items[in_key]) == 'undefined') {
				this.length++;
			}

			this.items[in_key] = in_value;
		}

		return in_value;
	}

	this.hasItem = function(in_key)
	{
		return typeof(this.items[in_key]) != 'undefined';
	}
}
