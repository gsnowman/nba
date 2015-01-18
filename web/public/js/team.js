
// TODO: not sure what to do with this?
var owners = undefined;

function get_request_url() {
    var chunks = document.URL.split('=');
    var owner_id = chunks[chunks.length - 1]; // from current URL

    var buf = [];
    buf.push("owner_id=" + owner_id);
    buf.push("num_days=" + ($("#text_days").val() == "" ? "1000" : $("#text_days").val()));
    return '/get_team?' + buf.join('&');
}

function on_response(data) {

    if (data.length) {
        var owner_name = get_owner_name(owners, data[0].owner_id);
        console.log("Received response for owner_id=" + data[0].owner_id +
            " owner_name=" + owner_name + " length=" + data.length);
        document.title = owner_name;
    }

    var buf = [];
    buf.push('<table id="datatable" class="tablesorter">');
    buf.push(format_header('Name Games DNP Draft Rank Z Min Pts 3pm Reb Ast Stl Blk FG FG% FT FT% Pts 3pm Reb Ast Stl Blk FG FT'.split(' ')));
    buf.push('<tbody>')

    // 0:pts, 1:tpm, 2:reb, 3:ast, 4:stl, 5:blk, 6:fga, 7:fgm, 8:fta, 9:ftm, 10:min, 11:games, 12:dnp
    var vals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // TODO: not sure we need these
    // 0:z, 1:pts, 2:tpm, 3:reb, 4:ast, 5:stl, 6:blk, 7:fg, 8:ft
    var zs = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var k = 0; k < data.length; k=k+1) {
        var s = data[k];
        buf.push('<tr>' + format_name(s.name, s.player_id, s.rotoworld_id)); // name
        buf.push('<td align="center">' + s.games + '</td>');
        buf.push('<td align="center">' + s.dnp + '</td>');
        buf.push(format_season_player(s, true) + '</tr>');

        var vals2 = [s.pts, s.tpm, s.reb, s.ast, s.stl, s.blk,
            s.fga, s.fga * s.fgp, s.fta, s.fta * s.ftp, s.min, s.games, s.dnp];
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
            'Total', // name
            vals[11], // games
            vals[12], // dnp
            '', // draft
            '', // rank
            '', // total z-score
            vals[10].toFixed(places), // min
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
    submit_request("/get_owners", function(data) { owners = data; });
    submit_request(get_request_url(), on_response);
})

