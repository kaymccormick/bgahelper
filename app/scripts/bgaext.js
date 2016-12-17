/**
 * Created by jade on 18/06/2016.
 */

var games = Array();
var port = chrome.runtime.connect({name: 'bgahelper'});
port.postMessage({event: 'initialize', message: 'BGA Helper content script executing...'});
var myio;


//chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, {}, function(window) {
    port.postMessage({event: 'checkWindow', windowId: 0});
//});

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "bgahelper");
    port.onMessage.addListener(function(msg) {
	if(msg.event === 'checkWindowResponse') {
	    console.log(msg.event);
	}
    });
});

var gameTable;
var windowObjectReference = null; // global variable

function setGameTable(gt)
{
    gameTable = gt;
}

function getGameTable() { return gameTable; }


//openGameListWindow();

function gameTracker(mutations) {
    mutations.forEach(function (m) {
	console.log('interation mutation');
	if(m.removedNodes != null && m.removedNodes.length != 0)
	{
	    m.removedNodes.forEach(function(n) {
		if(n.nodeType == n.ELEMENT_NODE)
		{
		    if(!n.id) {
			console.log('removed node without id: ' + n.innerHTML);
			console.log(n);
		    }
		    else
		    {
			if(n.id.startsWith('gametable_')) {
			    console.log('removed node id ' + n.id);
			    var id = n.id.substring(10);
			    port.postMessage({event: 'removeGame', gameId: id });
			}
		    }
		}
	    });
	}
	m.addedNodes.forEach(function(n) {
	    if(n.id.startsWith('gametable_')) {
		//	    if(n.classList.contains('gametable_game_10')) {
		console.log('here');
		game = processGame(n);

		var gameTableContent = $(n).find('.gametable_content');
		var obs = new MutationObserver(function(ms) {
		    console.log('***MUTATION***');
		    ms.forEach(function(m) {
			console.log(m);
			m.addedNodes.forEach(function(n) {
			    var newGame = processGame(n.parentNode);
			    port.postMessage({event: 'updateGame', game: newGame});
			    console.log("newgame = ");
			    console.log(newGame);
			});
			m.removedNodes.forEach(function(n) {
//			    console.log('removed: ' + n.innerHTML);
			});

		    });
		    console.log('***END MUTATION***');

		});
		obs.observe(n, { childList: true });
		
		console.log(game);
		port.postMessage({ event: 'addGame', game: game });
//		getGameTable().row.add(game).draw();
//		if(places.find('.freeplace').length)
//		{
//		    window.location.href = q.find('.gametablelink').attr('href');
//		}
	    }
	});
    });
}

function processGame(n)
{
    var q = $(n);
    var gameId = q[0].id.substring(10);
    var id = '_' + q[0].id.substring(10);
    var gameName = q.find('.gamename').text();
    var qq = q.find('.table_top_status_detailed');
    var status = q.find('.table_status_detailled').text();
    var firstDiv = qq.find('div').eq(0);
    var restrictions = '';
    if(firstDiv[0].childNodes.length > 0)
    {
	restrictions = firstDiv[0].childNodes[0].data || '';
    }
    
    var qqq = qq.find('.smalltext');
    var players = q.find('.players');
    var places = q.find('.players').find('.tableplace');
    //		windowObjectReference.document.write(q.html());
    var exp = qqq.text();
    var game = [id, gameName, status, exp, restrictions, places.length];
    return game;
}

$(document).ready(function() {
    var url = null;
    var hex = null;
    
    var pat = /mainsite\.create\( *"([^"]*)", *"([^"]*)".*\)/m;
    var pat2 = /mainsite\.current_player_name *= *"([^"]*)"/m;
    var pat3 = /current_player_id *= *([^;]*);/m;
    var playername = null;
    var playerid;
    $('script').each(function(s, y) {
	var txt = $(y).text();
	var res = pat.exec(txt);
	if(res)
	{
	    url = res[1];
	    hex = res[2];

	    res = pat2.exec(txt);
	    if(res) {
		playername = res[1];
	    }

	    res = pat3.exec(txt);
	    if(res) {
		playerid = res[1];
	    }
	}
    });
    console.log('name = ' + playername);
    console.log('id = ' + playerid);

    var auth = {
        user: playerid,
        name: playername,
        credentials: hex };
    port.postMessage({event: 'auth', url: url, auth: auth});

    
    var target = document.getElementById('main-content'); //gamelobby_inner
    var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function (mutation) {
	    if(mutation.type === 'childList') {
		if(mutation.addedNodes !== null) {
		    mutation.addedNodes.forEach(function(node) {
			if(node.id == 'gamelobby-module')
			{
			    var target2 = document.getElementById('gametables_other');
			    var observer2 = new MutationObserver(gameTracker);
			    //			  console.log('observing');
			    
			    console.log('target2 = ' + target2.innerHTML);
			    observer2.observe(target2, { childList: true });
			    var target3 = document.getElementById('gametables_wannaplay');
			    observer2.observe(target3, { childList: true });
			    


			    
			    $(target2).children('div').each(function(x) {
				console.log(x.id);
			    });
			}
			
		    });
		}
	    }
	});
    });
    
    var config = { attributes: true, childList: true, characterData: true };

    // pass in the target node, as well as the observer options
    observer.observe(target, config);
    
    // later, you can stop observing
    //observer.disconnect();
    
    /*  var games = $('.gametable_game_10');
	console.log('number of games: ' + games.length);
	for(var game of games)
	{
	console.log(game);
	}*/
});

