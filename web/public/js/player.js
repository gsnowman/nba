
function get_request_url() {
    var chunks = document.URL.split('=');
    var player_id = chunks[chunks.length - 1]; // from current URL

    var buf = [];
    buf.push("player_id=" + player_id);
    buf.push("pts=" + $("#text_pts").val());
    buf.push("tpm=" + $("#text_tpm").val());
    buf.push("reb=" + $("#text_reb").val());
    buf.push("ast=" + $("#text_ast").val());
    buf.push("stl=" + $("#text_stl").val());
    buf.push("blk=" + $("#text_blk").val());
    buf.push("fg=" + $("#text_fg").val());
    buf.push("ft=" + $("#text_ft").val());
    return '/get_player?' + buf.join('&');
}

function create_table(data) {

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Season Games Min Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var s = data[i];
        buf.push('<tr>' + format_name(s.name, undefined)); // name
        buf.push('<td align="center" bgcolor="#FFF">' + s.season + '</td>');
        buf.push('<td align="center" bgcolor="#FFF">' + s.games + '</td>');
        buf.push('<td align="center" bgcolor="#FFF">' + s.min.toFixed(places) + '</td>');
        buf.push(format_season_player(s) + '</tr>');
    }

    buf.push('</tbody></table>')
    return buf.join("");
}

function on_response(data) {
    if (data.length) {
        document.title = data[0].name;
    }

    $("#data_div").html(create_table(data));
    $("#datatable").tablesorter({widgets: ['zebra']});
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

$(document).ready(function() {
    load_local_storage();
    submit_request(get_request_url(), on_response);
})
