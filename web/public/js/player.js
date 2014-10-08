
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

function get_request_url() {
    var chunks = document.URL.split('=');
    var player_id = chunks[chunks.length - 1]; // from current URL

    var buf = [];
    buf.push("player_id=" + player_id);
    buf.push("pts=" + $("#text_pts")[0].value);
    buf.push("tpm=" + $("#text_tpm")[0].value);
    buf.push("reb=" + $("#text_reb")[0].value);
    buf.push("ast=" + $("#text_ast")[0].value);
    buf.push("stl=" + $("#text_stl")[0].value);
    buf.push("blk=" + $("#text_blk")[0].value);
    buf.push("fg=" + $("#text_fg")[0].value);
    buf.push("ft=" + $("#text_ft")[0].value);
    return '/get_player?' + buf.join('&');
}

function create_table(data) {

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Season Games Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var s = data[i];
        buf.push('<tr>' + format_name(s.name, undefined)); // name
        buf.push('<td align="center" bgcolor="#FFF">' + s.season + '</td>');
        buf.push('<td align="center" bgcolor="#FFF">' + s.games + '</td>');
        buf.push(format_season_player(s) + '</tr>');
    }

    buf.push('</tbody></table>')
    return buf.join("");
}

function on_response(data) {
    document.getElementById("data_div").innerHTML = create_table(data);
    $("#datatable").tablesorter({widgets: ['zebra']});
}

function submitenter(field, e) {
    var keycode;
    if (window.event)
        keycode = window.event.keyCode;
    else if (e)
        keycode = e.which;
    else
        return true;

    if (keycode == 13) {
        // if this was an enter key press
        submit_request(get_request_url(), on_response);
        return false;
    } else {
        return true;
    }
}

$(document).ready(function() {
    load_local_storage();
    submit_request(get_request_url(), on_response);
})
