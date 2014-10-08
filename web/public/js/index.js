
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
  buf.push("pts=" + $("#text_pts").val());
  buf.push("tpm=" + $("#text_tpm").val());
  buf.push("reb=" + $("#text_reb").val());
  buf.push("ast=" + $("#text_ast").val());
  buf.push("stl=" + $("#text_stl").val());
  buf.push("blk=" + $("#text_blk").val());
  buf.push("fg=" + $("#text_fg").val());
  buf.push("ft=" + $("#text_ft").val());
  buf.push("season=" + $("#select_season").val());
  return '/all_players?' + buf.join('&');
}

function create_table(data) {

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var p = data[i];
        buf.push('<tr>' + format_name(p.name, p.player_id));
        buf.push(format_season_player(p) + '</tr>');
    }

    buf.push('</tbody></table>')
    return buf.join("");
}

function on_response(data) {
    $("#data_div").html(create_table(data));
    $("#datatable").tablesorter({widgets: ['zebra']});
    save_local_storage();
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
        submit_request(get_request_url(), on_response);
        return false;
    } else {
        return true;
    }
}

function on_seasons_response(seasons) {
    for (var i = 0; i < seasons.length; i=i+1) {
        $("#select_season").append('<option value="' + seasons[i] + '">' + seasons[i] + '</option>');
    }
    $("#select_season").val(seasons[seasons.length - 1]);
}

$(document).ready(function() {
    load_local_storage();
    submit_request("/get_seasons", on_seasons_response);
})
