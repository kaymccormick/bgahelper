$(document).ready(performOnDocumentReady);

var port = chrome.runtime.connect({name:'games'});
var gamesTable = null;

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == 'games');
    console.log('received message');
    port.onMessage.addListener(function(msg) {
	if(msg.event === 'pong')
	{
	    $('#logbox').append($('<span>pong<br></span>'));
//	    document.write('pong<br>');
	} else {
	    console.log(msg.event);
	}
	if(msg.event === 'addGame')
	{
	    gamesTable.row.add(msg.game).draw();
	}
	else if (msg.event == 'removeGame')
	{
	    var id = msg.gameId;
	    var row = gamesTable.row('#_' + id);
	    console.log('id = ' + id);
	    console.log('row = ' + row.length);
	    if(row)
	    {
		console.log('calling remove');
		row.remove().draw();
	    }
	}
	else if(msg.event == 'updateGame')
	{
	    gamesTable.row('#' + msg.game[0]).data(msg.game).draw();
	}
	
    });
});

document.getElementById('pingbutton').addEventListener('click', doPing);


function doPing()
{
    port.postMessage({event:'ping'});
}

function initializeDataTable()
{
    gamesTable = $('#gamestable').DataTable({ paging: false, rowId: '0', columns: [ { title: 'ID' }, { title: 'Game' }, { title: 'Status' }, { title: 'Parameters' } , { title: 'Restrictions' }, { title: 'No. of Players' }  ] });
}

function performOnDocumentReady()
{
    initializeDataTable();
}
