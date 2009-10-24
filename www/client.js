var BOSH_SERVICE = '/http-bind/';
var connection = null;

function log(msg) 
{
    $('#content').prepend(
	$('<p/>')
	    .addClass('log')
	    .text(msg)
    );
}

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	log('Connecting...');
    } else if (status == Strophe.Status.CONNFAIL) {
	log('Failed to connect.');
	onOffline();
    } else if (status == Strophe.Status.DISCONNECTING) {
	log('Disconnecting...');
    } else if (status == Strophe.Status.DISCONNECTED) {
	log('Disconnected.');
	onOffline();
    } else if (status == Strophe.Status.CONNECTED) {
	log('Connected.');
	connection.send($pres().tree());
	onOnline();
    }
}

function onOnline() {
    $('#login').slideUp(500);
    $('#control').slideDown(1000);
}

function onOffline() {
    $('#connect').get(0).value = 'connect';
    $('#login').slideDown(500);
    $('#control').hide();
}

function onMessage(msg) {
    $(msg).find("event items").map(function() {
	var items = $(this);
	var feed_url = items.attr("node");
	items.find("item entry").map(function() {
	    var entry = $(this);
	    try {
		onEntry(feed_url, entry);
	    } catch (e) {
		log("!!! onEntry error: " + e);
	    }
	});
    });

    return true;
}

var serial = 0;
function onEntry(feed_url, e) {
    var title = e.find("title").text();

    serial++;
    var entry_id = "entry" + serial;
    $('#content').prepend(
	$('<div/>')
	    .hide()
	    .addClass('entry')
	    .attr('id', entry_id)
	    .append(
		$('<p/>')
		    .addClass('title')
		    .text(title)
	    )
	    .append(
		$('<p/>')
		    .addClass('meta')
	    )
	    .slideDown(700)
    );

    var meta = $('#'+entry_id+' p.meta');
    e.find("link").map(function() {
	var link = $(this).attr("href");
	var rel = $(this).attr("rel");
	if (rel == 'alternate') {
	    meta.append(
		$('<a/>')
		    .attr('href', link)
		    .text(link)
	    );
	} else {
	    $('#'+entry_id+' p.title').prepend(
		$('<img/>')
		    .attr('src', link)
	    );
	}
    });
}

$(document).ready(function () {
    connection = new Strophe.Connection(BOSH_SERVICE);
    connection.addHandler(onMessage, null, 'message', null, null,  null); 

    $('#connect').bind('click', function () {
	var button = $('#connect').get(0);
	if (button.value == 'connect') {
	    button.value = 'disconnect';

	    connection.connect($('#jid').get(0).value,
			       $('#pass').get(0).value,
			       onConnect);
	} else {
	    connection.disconnect();
	    onOffline();
	}
    });
    $('#disconnect').bind('click', function () {
	connection.disconnect();
    });
    onOffline();
});
