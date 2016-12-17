var gameWindow;
var bgaLobbyWindow;
var gameTabId;
var gamePort = null;
var myio;

function connectListener(port) {
    console.log('Connectlisener[' + port + ']');
    if(port.name === 'bgahelper')
    {
	port.onMessage.addListener(bgaHelperListener);
    }
    else if(port.name === 'games')
    {
	port.onMessage.addListener(gamesListener);
    }
}

function gamesListener(msg)
{
    console.log('eventpage received message on "games" port: event=' + msg.event);
    if(msg.event == 'ping')
    {
	console.log('ping');
	if(!gamePort)
	{
	    connectToGamesPort();
	}
	gamePort.postMessage({event:'pong'});
    }
}

function openGameWindow()
{
    chrome.windows.create({type: 'popup', url: chrome.runtime.getURL('html/games.html')}, function(window) {
	gameWindow = window;
	chrome.tabs.query({windowId: gameWindow.id, index: 0 }, function(tabs) {
	    gameTabId = tabs[0].id;
	    /*	    chrome.tabs.executeScript(tabs[0].id, {file:'scripts/games.js'});*/
/*
	    console.log('connecting to gameport');
	    gamePort = chrome.tabs.connect(gameTabId, { name: 'games' });
	    if(gamePort)
	    {
		console.log('gameport = ' + typeof gameport);
	    } else {
		console.log('unable to connect to games port');
	    }
*/	    
	    
//	    gamePort.postMessage(null, {event: 'poop'});

	});
    });
}

function connectToGamesPort()
{
    console.log('connecting to gameport');
    gamePort = chrome.tabs.connect(gameTabId, { name: 'games' });
    if(gamePort !== undefined)
    {
	console.log('gameport = ' + typeof gamePort);
    } else {
	console.log('unable to connect to games port');
    }
	    
//	    gamePort.postMessage(null, {event: 'poop'});
}


function bgaHelperListener(msg) {
    console.log('bgahelperlistener ' + msg.event);
    if(msg.event == 'initialize')
    {
	if(gameWindow) {
	    chrome.windows.get(gameWindow.id, {}, function(window) {
		if(chrome.runtime.lastError) {
		    console.log(chrome.runtime.lastError.message + ' (window=' + window + ')');
		    gameWindow = null;
		    openGameWindow();
		}
		else
		{
		    console.log('got window ' + window);
		}
		
	    });
	}
	if(!gameWindow)
	{
	    openGameWindow();
	}
    }
    if(msg.event === 'auth')
    {
	localStorage.debug = '*';
	myio = io(msg.url, { query: 'user=' + msg.auth.user + '&name=' + msg.auth.name + '&credentials=' + msg.auth.credentials });
	
	myio.on('connect', function() {
	    console.log('connected');
	    myio.emit('join', '/chat/general');
	});
    
	myio.on('bgamsg', function(data) {
	    console.log('data = ');
	    console.log(data);
	});
    }


    /* This is not in use */
    if(msg.event === 'checkWindow') {
	chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, {},
			   function(window) {
			       console.log('I am ' + window.id);
			   });

    }

    /* These events we forward to our games window */
    if(msg.event === 'addGame' || msg.event == 'removeGame' || msg.event == 'updateGame')
    {
	if(!gamePort)
	{
	    connectToGamesPort();
	}

	gamePort.postMessage(msg);
    }
    
}

function doBrowserAction()
{
    chrome.windows.create({/*state: 'minimized', */url: 'http://en.boardgamearena.com/#!gamelobby'}, function(window) { bgaLobbyWindow = window; console.log('bgaLobbyWindow = ' + bgaLobbyWindow.id);
														    chrome.tabs.query({windowId: bgaLobbyWindow.id, index: 0 }, function(tabs) {
															chrome.tabs.executeScript(tabs[0].id, {file: 'bower_components/jquery/dist/jquery.js'});
					chrome.tabs.executeScript(tabs[0].id, {file: 'bower_components/socket.io-client/socket.io.js'});
															chrome.tabs.executeScript(tabs[0].id, {file: 'scripts/bgaext.js'});
														    });
														  });
}

function windowRemoved(id)
{
    console.log('window removed');
    console.log(bgaLobbyWindow);
    console.log(bgaLobbyWindow.id);
    if(bgaLobbyWindow && bgaLobbyWindow.id === id)
    {
	console.log('here');
	if(gameWindow) {
	    chrome.windows.remove(gameWindow.id);
	    gameWindow = null;
	}
    } else if (gameWindow && gameWindow.id == id)
    {
	if(bgaLobbyWindow)
	{
	    chrome.windows.remove(bgaLobbyWindow.id);
	    bgaLobbyWindow = null;
	}
    }
}

chrome.runtime.onConnect.addListener(connectListener);
chrome.browserAction.onClicked.addListener(doBrowserAction);
chrome.windows.onRemoved.addListener(windowRemoved);
//chrome.windows.onCreated.addListener(windowCreated);
