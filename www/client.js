var BOSH_SERVICE = '/http-bind/';
var connection = null;

function log(msg) 
{
    $('#log').append('<div></div>').append(document.createTextNode(msg));
}

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
	log('Strophe failed to connect.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
	log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
	log('Strophe is disconnected.');
	$('#connect').get(0).value = 'connect';
	onOffline();
    } else if (status == Strophe.Status.CONNECTED) {
	log('Strophe is connected.');

	//connection.addHandler(onMessage, null, 'message', null, null,  null); 
	connection.send($pres().tree());
	log('Should have sent pres')
	onOnline();
    }
}

function onOnline() {
    $('#login').slideUp(500);
}

function onOffline() {
    $('#login').slideDown(500);
}

function foreachChild(el, name, fun) {
    var children = el.getElementsByTagName(name);
    for(var i = 0; i < children.length; i++) {
	fun(children[i]);
    }
}

function onMessage(msg) {
    log("!!! message");
    $(msg).find("event items").map(function() {
	var items = $(this);
	var feed_url = items.attr("node");
	log("!!! feed_url=" + feed_url);
	items.find("item entry").map(function() {
	    log("!!! entry");
	    var entry = $(this);
	    try {
		onEntry(feed_url, entry);
	    } catch (e) {
		log("!!! onEntry error: " + e);
	    }
	});
    });
    /*foreachChild(msg, "event", function(event) {
	foreachChild(event, "items", function(items) {
	    var feed = items.getAttribute("node");
	    foreachChild(items, "item", function(item) {
		foreachChild(item, "entry", function(entry) {
		    log("entry: " + entry);
		    onEntry(feed, entry);
		});
	    });
	});
    });*/

    return true;
}

var serial = 0;
function onEntry(feed_url, e) {
    var title = e.find("title").text();
    log("Title: " + title);

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

    //connection.rawInput = function (data) { log('RECV: ' + data); };
    //connection.rawOutput = function (data) { log('SEND: ' + data); };

    //Strophe.log = function (level, msg) { log('LOG: ' + msg); };


    $('#connect').bind('click', function () {
	var button = $('#connect').get(0);
	if (button.value == 'connect') {
	    button.value = 'disconnect';

	    connection.connect($('#jid').get(0).value,
			       $('#pass').get(0).value,
			       onConnect);
	} else {
	    button.value = 'connect';
	    connection.disconnect();
	}
    });
    $('#disconnect').bind('click', function () {
	connection.disconnect();
    });
});
