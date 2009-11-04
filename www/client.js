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

function discardOldContent() {
    $("#content div:gt(100)").fadeOut(3000, function () {
	$(this).empty();
    });
}

function onMessage(msg) {
    discardOldContent();

    $(msg).find("event items").map(function() {
	var items = $(this);
	var feed_url = items.attr("node");
	// TODO: *prepend* in reverse order
	items.find("item entry").map(function() {
	    var entry = $(this);
	    try {
		onEntry(feed_url, entry);
	    } catch (e) {
		log("Script error: " + e);
	    }
	});
	//log("Items from: " + feed_url);
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
    meta.append(
	$('<a/>')
	    .attr('title', "Unsubscribe from " + feed_url)
	    .text('×')
	    .bind('click', function () {
		rmFeed(feed_url);
	    })
    );
}

function addFeed(url) {
    $('#addform').hide();

    // Almost entirely stolen from the superfeedr.com dashboard
    var id = connection.getUniqueId("");
    var iq = $iq({"to": "firehoser.superfeedr.com",
		  "type": "set",
		  "id": id})
	.c("pubsub", {"xmlns": "http://jabber.org/protocol/pubsub",
		      "xmlns:superfeedr":"http://superfeedr.com/xmpp-pubsub-ext"})
	.c("subscribe", {"node": Strophe.xmlescape(url),
			 "jid": connection.jid});
    connection.addHandler(function (r) {
	var type = r.getAttribute("type");
	if (type == "result")
	    log("Subscribed to " + url);
	else if (type == "error")
	    log("Error adding " + url);
	else
	    return true;
    }, null, "iq", null, id,  "firehoser.superfeedr.com");
    connection.send(iq.tree());
}

function rmFeed(url) {
    var id = connection.getUniqueId("");
    var iq = $iq({"to": "firehoser.superfeedr.com",
		  "type": "set",
		  "id": id})
	.c("pubsub", {"xmlns": "http://jabber.org/protocol/pubsub",
		      "xmlns:superfeedr":"http://superfeedr.com/xmpp-pubsub-ext"})
	.c("unsubscribe", {"node": Strophe.xmlescape(url)});
    connection.addHandler(function (r) {
	var type = r.getAttribute("type");
	if (type == "result")
	    log("Unsubscribed from " + url);
	else if (type == "error")
	    log("Error removing " + url);
	else
	    return true;
    }, null, "iq", null, id,  "firehoser.superfeedr.com");
    connection.send(iq.tree());
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

    $('#addform').hide();
    $('#add').bind('click', function () {
	$('#addform').show();
    });
    $('#addcancel').bind('click', function () {
	$('#addform').hide();
    });
    $('#feed_add').bind('click', function () {
	addFeed($('#feed_url').get(0).value);
    });
    $('#twitter_add').bind('click', function () {
	addFeed('http://twitter.com/statuses/user_timeline/' +
		$('#twitter_user').get(0).value + '.rss');
    });
    $('#identica_add').bind('click', function () {
	addFeed('http://identi.ca/api/statuses/user_timeline/' +
		$('#identica_user').get(0).value + '.atom');
    });
    $('#search_add').bind('click', function () {
	addFeed('http://search.twitter.com/search.atom?q=' +
		$('#search_text').get(0).value);
	addFeed('https://identi.ca/api/statusnet/tags/timeline/' +
		$('#search_text').get(0).value + '.atom');
    });

    onOffline();
});
