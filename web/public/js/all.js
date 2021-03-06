
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
    buf.push("teams=" + $("#text_teams").val());
    buf.push("remove_owned=" + ($("#chk_remove_owned").prop('checked') ? 1 : 0));
    buf.push("num_days=" + ($("#text_days").val() == "" ? "1000" : $("#text_days").val()));
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
    var owner_name = get_owner_name(owners, owner_id);
    if (owner_name.length) {
        return '<a href=/team?owner_id=' + owner_id + ' target="_blank">' + owner_name + '</a>';
    } else {
        return "";
    }
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
    buf.push('<div><button id="btn_set_owner" onClick="set_owner(' + player_id + ');">Submit</button></div>');

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
    buf.push(format_header('Name Team Pos Age Owner Own/Watch Games DNP Draft Rank Z Min Pts 3pm Reb Ast Stl Blk FG FG% FT FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    for (var i = 0; i < data.length; i=i+1) {
        var p = data[i];
        var watching = $.watch_list.contains(p.player_id);
        if (watching) {
            buf.push('<tr class="watch">' + format_name(p.name, p.player_id, p.rotoworld_id));
        } else {
            buf.push('<tr>' + format_name(p.name, p.player_id, p.rotoworld_id));
        }
        buf.push('<td>' + p.team + '</td>');
        buf.push('<td>' + p.pos + '</td>');
        buf.push('<td>' + p.age + '</td>');
        buf.push('<td>' + linked_owner_name(p.owner_id) + '</td>');

        // 'Set Owner' button, calls owner_dialog method above
        buf.push('<td><button class="draft" onClick="owner_dialog(');
        buf.push(p.player_id + ',\'' + p.name + '\',' + p.owner_id + ');">Owners</button>');

        // Add a WatchList checkbox
        buf.push('<input id="chk_watch_' + p.player_id + '" type="checkbox" name="Watch" onChange="set_watch(' + p.player_id + ')"');
        buf.push((watching ? ' checked' : '') + '></td>');

        buf.push('<td>' + p.games + '</td>');
        buf.push('<td>' + p.dnp + '</td>');

        buf.push(format_season_player(p, true));

        buf.push('</tr>');
    }

    buf.push('</tbody></table>');
    return buf.join("");
}

function redraw(data) {
    $("#data_div").html(create_table(data));

    $("#datatable").tablesorter({
        widgets: ['zebra'],
        sortInitialOrder: 'desc',
        stringTo: 'min'
    });

    save_local_storage();
}

function on_response(data) {
    $.last_response = data;
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

$(document).ready(function() {
    load_local_storage();
    submit_request("/get_owners", function(data) { owners = data; });
    submit_request("/get_seasons", on_seasons_response);
})

