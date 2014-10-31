
function get_request_url() {
    var chunks = document.URL.split('=');
    var player_id = chunks[chunks.length - 1]; // from current URL

    var buf = [];
    buf.push("owner_id=" + player_id);
    buf.push("season=" + $("#select_season").val());
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

function status_percent(current, expected) {
    return '<font color="#' + (current >= expected ? '098600' : '860000') +
        '">' + format_percent_plus_minus(current, expected) + '</font>';
}

function on_response(data) {

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Games Min Z gZ Pts 3pm Reb Ast Stl Blk FGA FG% FTA FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    // 0:pts, 1:tpm, 2:reb, 3:ast, 4:stl, 5:blk, 6:fga, 7:fgm, 8:fta, 9:ftm
    var vals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // TODO: not sure we need these
    // 0:z, 1:pts, 2:tpm, 3:reb, 4:ast, 5:stl, 6:blk, 7:fg, 8:ft
    var zs = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var k = 0; k < data.length; k=k+1) {
        var s = data[k];
        buf.push('<tr>' + format_name(s.name, undefined)); // name
        buf.push('<td align="center">' + s.games + '</td>');
        buf.push('<td align="center">' + s.min.toFixed(places) + '</td>');
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

    /*
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
    buf.push('</tfoot></tbody></table>');
    */

    buf.push('<tfoot>');
    buf.push(
        format_row([
            'Total', // name
            '', // games
            '', // min
            '', // total z-score
            '', // gZ-score
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
    buf.push('</tfoot></tbody></table>')
    $("#data_div").html(buf.join(''));
    $("#datatable").tablesorter({widgets: ['zebra'], sortInitialOrder: 'desc'});

    var buf2 = ['<table id="curent_percentages" class="tablesorterpercentages">'];
    buf2.push('<thead><tr><th>' + data.length + ' Players</th>');
    buf2.push('<th>' + format_percent(data.length / 14) + '</th></tr></thead></table>');

    var buf2 = [];
    buf2.push('<table id="percentages" class="tablesorterpercentages">');
    buf2.push(format_header('Category Total Current Percent Status'.split(' ')));
    var cats = ['Points', '3 Pointers', 'Rebounds', 'Assists', 'Steals', 'Blocks'];
    for (var i = 0; i < cats.length; i=i+1) {
        var row_vals = [
            cats[i],
            means[i].toFixed(places),
            vals[i].toFixed(places),
            format_percent(vals[i] / means[i]),
            status_percent(vals[i] / means[i], data.length / 14.0)
        ];
        buf2.push(format_row(row_vals, 'td'));
    }
    buf2.push(format_row([
        'Field Goal %',
        format_percent(percent_means[0]),
        format_percent(vals[7] / vals[6]),
        format_percent_plus_minus(vals[7] / vals[6], percent_means[0]),
        status_percent(vals[7] / vals[6], percent_means[0])
    ], 'td'));
    buf2.push(format_row([
        'Free Throw %',
        format_percent(percent_means[1]),
        format_percent(vals[9] / vals[8]),
        format_percent_plus_minus(vals[9] / vals[8], percent_means[1]),
        status_percent(vals[9] / vals[8], percent_means[1])
    ], 'td'));
    buf2.push('</tbody></table>');

    $("#percentages_div").html(buf2.join(''));
    $("#percentages").tablesorter({widgets: ['zebra']});
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

    // TODO: load from local storage?
    submit_request(get_request_url(), on_response);
}

$(document).ready(function() {
    // TODO: do we want the ability to override scaling factors?
    load_local_storage();
    submit_request("/get_seasons", on_seasons_response);
})
