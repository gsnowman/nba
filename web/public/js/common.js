
var places = 2;

function WatchList(storage_string) {
    this.watching = [];
    if (storage_string !== undefined && storage_string.length > 0) {
        var watch_list_strings = storage_string.split(',');
        for (var i = 0; i < watch_list_strings.length; i=i+1) {
            this.watching.push(parseInt(watch_list_strings[i]));
        }
    }
    console.log('Initialized watch list, size=' + this.watching.length +
        ' [' + this.watching.join(',') + ']');

    this.index = function(player_id) {
        return this.watching.indexOf(player_id);
    };

    this.contains = function(player_id) {
        return this.index(player_id) != -1;
    };

    this.storage = function() {
        return this.watching.join(',');
    };

    this.watch = function(player_id) {
        if (!this.contains(player_id)) {
            console.log('Adding ' + player_id + ' to watch list');
            this.watching.push(player_id);
        }
    };

    this.unwatch = function(player_id) {
        var ix = this.index(player_id);
        if (ix != -1) {
            console.log('Removing ' + player_id + ' from watch list');
            this.watching.splice(ix, 1);
        }
    };
}

// submits an asynchronous request to some URL, calls callback on success
function submit_request(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    // set up the asynchronous callback
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            // parse the response
            var message = JSON.parse(request.responseText);
            console.log('Received response url="' + url + '" bytes=' +
                 request.responseText.length + ' rows=' + message.length);
            callback(message)
        }
    }

    // send the request
    request.send(null);
}

// formats a decimal (0.75) as a percent string "75.0%"
function format_percent(val) {
    return (val * 100).toFixed(places) + "%";
}

function format_percent_plus_minus(a, b) {
    if (a >= b) {
        return "+" + format_percent(a - b);
    } else {
        return "-" + format_percent(b - a);
    }
}

function format_bgcolor(bgcolor) {
    return (bgcolor === undefined ? '' : ('bgcolor="' + bgcolor + '"'));
}

// returns a <td> formatted name, eventually will have links (Y!, Roto, Player Page)
function format_name(name, player_id, rotoworld_id) {
    var buf = [];

    if (player_id !== undefined) {
        buf.push('<td id="player_name_' + player_id + '">');
        buf.push('<a href="/player?player_id=' + player_id + '" target="_blank">');
    } else {
        buf.push('<td>');
    }

    buf.push(name);
    if (player_id !== undefined)
        buf.push('</a>');

    // link to rotoworld
    if (rotoworld_id !== undefined && rotoworld_id != 0) {
        buf.push(' <a href="http://www.rotoworld.com/premium/draftguide/basketball/playerpage.aspx?pid=');
        buf.push(rotoworld_id + '" target="_blank">');
        buf.push('<img src="/public/rw_fav.ico" style="width:12px;height:12px"></a>');
    }

    buf.push('</td>');
    return buf.join('');
}

// generates the following table cells:
// - z pts tpm reb ast stl blk fga fgp fta ftp
// - Z scores for: pts tpm reb ast stl blk fg ft
function format_season_player(p) {
    var buf = [];

    buf.push('<td ' + format_bgcolor(z_color(p.z, 2.0)) + '>' + p.z.toFixed(places) + '</td>');
    buf.push('<td>' + p.min.toFixed(places) + '</td>');
    buf.push('<td>' + p.pts.toFixed(places) + '</td>');
    buf.push('<td>' + p.tpm.toFixed(places) + '</td>');
    buf.push('<td><font color="#0000FF">' + p.reb.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#0000FF">' + p.ast.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#0000FF">' + p.stl.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#0000FF">' + p.blk.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#FF0000">' + p.fga.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#FF0000">' + format_percent(p.fgp) + '</font></td>');
    buf.push('<td><font color="#FF0000">' + p.fta.toFixed(places) + '</font></td>');
    buf.push('<td><font color="#FF0000">' + format_percent(p.ftp) + '</font></td>');

    var max = 3.5
    buf.push('<td ' + format_bgcolor(z_color(p.zpts, max)) + '>' + p.zpts.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.ztpm, max)) + '>' + p.ztpm.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zreb, max)) + '>' + p.zreb.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zast, max)) + '>' + p.zast.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zstl, max)) + '>' + p.zstl.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zblk, max)) + '>' + p.zblk.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zfg, max)) + '>' + p.zfg.toFixed(places) + '</td>');
    buf.push('<td ' + format_bgcolor(z_color(p.zft, max)) + '>' + p.zft.toFixed(places) + '</td>');

    return buf.join('');
}

function format_row(vals, cell_type) {
    var begin = '<' + cell_type + '>';
    var end = '</' + cell_type + '>';
    var buf = ['<tr>'];
    for (var i = 0; i < vals.length; i=i+1)
        buf.push(begin + vals[i] + end);
    buf.push('</tr>');
    return buf.join('');
}

function format_header(vals) {
    return ['<thead>', format_row(vals, 'th'), '</thead>'].join('');
}

function reset_settings() {
    var vals = "pts tpm reb ast stl blk fg ft".split(' ');
    for (var i = 0; i < vals.length; i=i+1) {
        $("#text_" + vals[i]).val("1.0");
    }
    if ($("#select_season").length) {
        var options = $("#select_season option");
        $("#select_season").val(options[options.length - 1].innerHTML);
    }
}

function save_local_storage() {
    var vals = "pts tpm reb ast stl blk fg ft".split(' ');
    for (var i = 0; i < vals.length; i=i+1) {
        localStorage[vals[i]] = $("#text_" + vals[i]).val();
    }
    localStorage['remove_owned'] = $("#chk_remove_owned").prop('checked');
    localStorage['watch_list'] = $.watch_list.storage();
}

function load_local_storage() {
    var vals = "pts tpm reb ast stl blk fg ft".split(' ');
    for (var i = 0; i < vals.length; i=i+1) {
        if (localStorage[vals[i]] !== undefined && $("#text_" + vals[i]).length) {
            $("#text_" + vals[i]).val(localStorage[vals[i]]);
        }
    }

    if (localStorage['remove_owned'] !== undefined && $("#chk_remove_owned").length) {
        $("#chk_remove_owned").attr('checked', localStorage['remove_owned'] == "true");
    }

    $.watch_list = new WatchList(localStorage['watch_list']);
}

function get_owner_name(owners, owner_id) {
    for (var i = 0; i < owners.length; i=i+1) {
        if (owners[i].owner_id == owner_id) {
            return owners[i].name;
        }
    }
    return "";
}

