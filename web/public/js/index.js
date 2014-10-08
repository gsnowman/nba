
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
  var buf = [];
  buf.push("pts=" + $("#text_pts")[0].value);
  buf.push("tpm=" + $("#text_tpm")[0].value);
  buf.push("reb=" + $("#text_reb")[0].value);
  buf.push("ast=" + $("#text_ast")[0].value);
  buf.push("stl=" + $("#text_stl")[0].value);
  buf.push("blk=" + $("#text_blk")[0].value);
  buf.push("fg=" + $("#text_fg")[0].value);
  buf.push("ft=" + $("#text_ft")[0].value);
  return '/all_players?' + buf.join('&');
}

function main_table(data) {

    var buf = [];
    buf.push('<table id="all_players" class="tablesorter">');
    buf.push(format_header('Name Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var p = data[i];
        buf.push('<tr>' + format_name(p.name) + format_season_player(p) + '</tr>');
    }

    buf.push('</tbody></table>')
    return buf.join("");
}

function on_all_players(data) {
    document.getElementById("data_div").innerHTML = main_table(data);
    $("#all_players").tablesorter({widgets: ['zebra']});
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
        submit_request(get_request_url(), on_all_players);
        return false;
    } else {
        return true;
    }
}
