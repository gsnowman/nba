
function get_request_url() {
    var chunks = document.URL.split('=');
    var player_id = chunks[chunks.length - 1]; // from current URL

    var buf = [];
    buf.push("owner_id=" + player_id);
    // TODO: do we want the ability to override scaling factors?
    /*
    buf.push("pts=" + $("#text_pts").val());
    buf.push("tpm=" + $("#text_tpm").val());
    buf.push("reb=" + $("#text_reb").val());
    buf.push("ast=" + $("#text_ast").val());
    buf.push("stl=" + $("#text_stl").val());
    buf.push("blk=" + $("#text_blk").val());
    buf.push("fg=" + $("#text_fg").val());
    buf.push("ft=" + $("#text_ft").val());
    */
    return '/get_team?' + buf.join('&');
}

function create_table(data) {

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Z Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    // 0:pts, 1:tpm, 2:reb, 3:ast, 4:stl, 5:blk, 6:fga, 7:fgm, 8:fta, 9:ftm
    var vals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // TODO: not sure we need these
    // 0:z, 1:pts, 2:tpm, 3:reb, 4:ast, 5:stl, 6:blk, 7:fg, 8:ft
    var zs = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var k = 0; k < data.length; k=k+1) {
        var s = data[k];
        buf.push('<tr>' + format_name(s.name, undefined)); // name
        buf.push(format_season_player(s) + '</tr>');

        var vals2 = [s.pts, s.tpm, s.reb, s.ast, s.stl, s.blk, s.fga, s.fga * s.fgp, s.fta, s.fta * s.ftp];
        for (var i = 0; i < vals.length; i=i+1)
            vals[i] = vals[i] + vals2[i];
        var zs2 = [s.z, s.zpts, s.ztpm, s.zreb, s.zast, s.zstl, s.zblk, s.zfg, s.zft];
        for (var i = 0; i < zs.length; i=i+1)
            zs[i] = zs[i] + zs2[i];
    }

    //var sz = data.length;
    var means = [14.35475088, 1.046000798, 5.470573613, 3.246593841, 1.018010561, 0.602942934];
    for (var i = 0; i < means.length; i=i+1) {
        means[i] *= 14.0;
    }
    var percent_means = [0.465815549, 0.772864612];

    buf.push('<tfoot>');
    buf.push(
        format_row([
            'Percent', // name
            '', // total z-score
            format_percent(vals[0].toFixed(places) / means[0]), // pts
            format_percent(vals[1].toFixed(places) / means[1]), // tpm
            format_percent(vals[2].toFixed(places) / means[2]), // reb
            format_percent(vals[3].toFixed(places) / means[3]), // ast
            format_percent(vals[4].toFixed(places) / means[4]), // stl
            format_percent(vals[5].toFixed(places) / means[5]), // blk
            '', // fga
            format_percent_plus_minus(vals[7] / vals[6], percent_means[0]),
            '', // fta
            format_percent_plus_minus(vals[9] / vals[8], percent_means[1]),
            '', '', '', '', '', '', '', '' // z-scores
        ], 'th')
    );
    buf.push('</tfoot>');

    buf.push('<tfoot>');
    buf.push(
        format_row([
            'Total', // name
            '', // total z-score
            vals[0].toFixed(places), // pts
            vals[1].toFixed(places), // tpm
            vals[2].toFixed(places), // reb
            vals[3].toFixed(places), // ast
            vals[4].toFixed(places), // stl
            vals[5].toFixed(places), // blk
            vals[6].toFixed(places), // fga
            format_percent(vals[7] / vals[6]), // fg%
            vals[8].toFixed(places), // fta
            format_percent(vals[9] / vals[8]), // ft%
            '', '', '', '', '', '', '', '' // z-scores
        ], 'th')
    );
    buf.push('</tfoot>');
    buf.push('</tbody></table>')
    return buf.join("");
}

function on_response(data) {
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
    // TODO: do we want the ability to override scaling factors?
    load_local_storage();
    submit_request(get_request_url(), on_response);
})
