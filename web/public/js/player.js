
function get_player_id() {
    var chunks = document.URL.split('=');
    return chunks[chunks.length - 1]; // from current URL
}

function get_seasons_request_url() {
    return '/get_player_seasons?player_id=' + get_player_id();
}

function get_game_log_request_url() {
    return '/get_player_game_log?player_id=' + get_player_id();
}

function on_seasons_response(data) {
    if (data.length) {
        document.title = data[0].name;
    }

    var buf = [];
    buf.push('<table id="seasons" class="tablesorter">');
    buf.push(format_header('Name Season Team Games DNP Z Min Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var s = data[i];
        buf.push('<tr>' + format_name(s.name, undefined)); // name
        buf.push('<td align="center">' + s.season + '</td>');
        buf.push('<td align="center">' + s.team + '</td>');
        buf.push('<td align="center">' + s.games + '</td>');
        buf.push('<td align="center">' + (82 - s.games) + '</td>');
        buf.push(format_season_player(s) + '</tr>');
    }

    buf.push('</tbody></table>')
    $("#seasons_div").html(buf.join(''));
    $("#seasons").tablesorter({widgets: ['zebra'], sortInitialOrder: 'desc'});
}

function go() {
    submit_request(get_seasons_request_url(), on_seasons_response);
}

function submitenter(e) {
    var keycode;
    if (window.event)
        keycode = window.event.keyCode;
    else if (e)
        keycode = e.which;
    else
        return true;

    if (keycode == 13) {
        // if this was an enter key press
        go();
        return false;
    } else {
        return true;
    }
}

$(document).ready(function() {
    load_local_storage();
    go();
})
