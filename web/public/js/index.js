
// TODO: we don't need this
var top_level_form; // the settings form

function submit_request(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    // set up the asynchronous callback
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            // parse the response
            var message = JSON.parse(request.responseText);
            callback(message)
        }
    }

    // send the request
    request.send(null);
}

function main_table(data) {

    var buf = [];
    buf.push('<table id="nba" class="tablesorter"><thead><tr><th>Name</th>' +
        '<th>Z</th><th>Pts</th><th>3pm</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th>' +
        '<th>FGA</th><th>FG%</th><th>FTA</th><th>FT%</th>' +
        '<th>Pts</th><th>3pm</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>FG</th><th>FT</th>' +
        '</tr></thead><tbody>');

    for (var i = 0; i < data.length; i=i+1) {
        var p = data[i];
        buf.push('<tr>' + format_name(p.name) + season_player(p) + '</tr>');
    }

    buf.push('</table>')
    return buf.join("");
}

function on_all_players(data) {
    document.getElementById("data_div").innerHTML = main_table(data);
    jQuery("#nba").tablesorter({widgets: ['zebra']});
}

function submitenter(field, e) {
    // cache this to be used by other things
    top_level_form = field.form;

    var keycode;
    if (window.event)
      keycode = window.event.keyCode;
    else if (e)
      keycode = e.which;
    else
      return true;

    if (keycode == 13) {
      // if this was an enter key press
      submit_request("/all_players", on_all_players);
      return false;
    } else {
      return true;
    }
}
