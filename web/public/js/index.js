
// TODO: not sure what to do with this?
var owners = undefined;

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
    buf.push("remove_owned=" + ($("#chk_remove_owned").prop('checked') ? 1 : 0));
    return '/all_players?' + buf.join('&');
}

function set_owner(player_id) {
    var owner_id = $('input[name=radio_owner]:checked', '#form_owner').val();

    if (owner_id != undefined) {
        console.log('Setting owned status: player_id=' + player_id + ' owner_id=' + owner_id);
        submit_request('/set_owner?player_id=' + player_id + '&owner_id=' + owner_id,
            function(response) {
                $("#dialog").dialog("close"); // close dialog box
                submit_request(get_request_url(), on_response); // resubmit
            }
        );
    }
}

function linked_owner_name(owner_id) {
    for (var i = 0; i < owners.length; i=i+1) {
        if (owners[i].owner_id == owner_id) {
            return '<a href=/team?owner_id=' + owner_id + ' target="_blank">' + owners[i].name + '</a>';
        }
    }
    return "";
}

function owner_dialog(player_id, player_name, owner_id) {
    var buf = ['<form id="form_owner">'];

    for (var i = 0; i < owners.length; i=i+1) {
        var o = owners[i];
        buf.push('<input id="radio_owner_' + o.owner_id + '" type="radio" name="radio_owner" value="');
        buf.push(o.owner_id + '" ' + (o.owner_id == owner_id ? " checked" : "") + '>');
        buf.push('<label for="radio_owner_' + o.owner_id + '">' + o.name + '</label>');
        buf.push(' (<a href="/team?owner_id=' + o.owner_id + '" target="_blank">open</a>)<br>')
    }

    // add a 'None' owner (specified with owner_id == 0), and a button for submission
    buf.push('<input id="radio_owner_0" type="radio" name="radio_owner" value="0"');
    buf.push((owner_id == 0 ? ' checked' : '') + '>');
    buf.push('<label for="radio_owner_0"><strong>None</strong></label><br></form>');
    buf.push('<div align="center"><button id="btn_set_owner" onClick="set_owner(' + player_id + ');">Submit</button></div>');

    $("#dialog").html(buf.join(''));
    $("#dialog").dialog('option', 'title', player_name);
    $("#dialog").dialog("open");
}

function set_watch(player_id) {
    var is_checked = $('#chk_watch_' + player_id).prop('checked');
    if (is_checked) {
        $.watch_list.watch(player_id);
    } else {
        $.watch_list.unwatch(player_id);
    }
    redraw($.last_response);
}

function create_table(data) {
    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Team Pos Age Owner Own/Watch Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var p = data[i];
        var watching = $.watch_list.contains(p.player_id);
        if (watching) {
            buf.push('<tr class="watch">' + format_name(p.name, p.player_id, p.rotoworld_id));
        } else {
            buf.push('<tr>' + format_name(p.name, p.player_id, p.rotoworld_id));
        }
        // add owner
        buf.push('<td align="center">' + p.team + '</td>');
        buf.push('<td align="center">' + p.pos + '</td>');
        buf.push('<td align="center">' + p.age + '</td>');
        buf.push('<td align="center">' + linked_owner_name(p.owner_id) + '</td>');

        // 'Set Owner' button, calls owner_dialog method above
        buf.push('<td align="center"><button id="btn_owner" class="draft" onClick="owner_dialog(');
        buf.push(p.player_id + ',\'' + p.name + '\',' + p.owner_id + ');">Owners</button>');

        // Add a WatchList checkbox
        buf.push('<input id="chk_watch_' + p.player_id + '" type="checkbox" name="Watch" onChange="set_watch(' + p.player_id + ')"');
        buf.push((watching ? ' checked' : '') + '></td>');

        buf.push(format_season_player(p) + '</tr>');
    }

    buf.push('</tbody></table>')
    return buf.join("");
}

function redraw(data) {
    $("#data_div").html(create_table(data));

    $("#datatable").tablesorter({
        widgets: ['zebra'],
        sortInitialOrder: 'desc'
    });

    save_local_storage();
}

function on_response(data) {
    $.last_response = data;
    submit_request("/get_num_owned", on_num_owned_response);
    redraw(data);
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

function on_num_owned_response(response) {
    var num_owned = response[0].num;
    console.log('Received response, num_owned=' + num_owned);

    var round = Math.floor((num_owned / 12) + 1);
    var pick = (num_owned + 1) % 12;

    var buf = ['<table class="picks"><tr><td>Round ' + round + ', Pick ' + pick + '</td></tr></table>'];
    buf.push('<table class="picks"><tr><td>' + 'Overall Pick ' + (num_owned + 1) + '</td></tr></table>');
    $("#picks").html(buf.join(''));
}

$(document).ready(function() {
    load_local_storage();
    submit_request("/get_owners", function(data) { owners = data; });
    submit_request("/get_seasons", on_seasons_response);
})
