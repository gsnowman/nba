
var places = 2;

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

// returns a <td> formatted name, eventually will have links (Y!, Roto, Player Page)
function format_name(name, player_id) {
    var buf = [];

    buf.push('<td align="left" bgcolor="#FFF">');
    if (player_id != undefined)
        buf.push('<a href="/player?player_id=' + player_id + '" target="_blank">');
    buf.push(name);
    if (player_id != undefined)
        buf.push('</a>');
    buf.push('</td>');
    return buf.join('');
}

// generates the following table cells:
// - z pts tpm reb ast stl blk fga fgp fta ftp
// - Z scores for: pts tpm reb ast stl blk fg ft
function format_season_player(p) {

    var buf = [];

    // TODO server needs to return z
    buf.push('<td align="center" bgcolor="' + z_color(p.z, 2.0) + '">' + p.z.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF">' + p.pts.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF">' + p.tpm.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.reb.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.ast.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.stl.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.blk.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + p.fga.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + format_percent(p.fgp) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + p.fta.toFixed(places) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + format_percent(p.ftp) + '</font></td>');

    var max = 3.5
    buf.push('<td align="center" bgcolor="' + z_color(p.zpts, max) + '">' + p.zpts.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.ztpm, max) + '">' + p.ztpm.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zreb, max) + '">' + p.zreb.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zast, max) + '">' + p.zast.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zstl, max) + '">' + p.zstl.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zblk, max) + '">' + p.zblk.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zfg, max) + '">' + p.zfg.toFixed(places) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zft, max) + '">' + p.zft.toFixed(places) + '</td>');

    return buf.join('');
}

function format_header(vals) {
  var buf = ['<thead><tr>'];
  for (var i = 0; i < vals.length; i=i+1) {
      buf.push('<th>' + vals[i] + '</th>');
  }
  buf.push('</tr></thead>');
  return buf.join('');
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
}

function load_local_storage() {
    var vals = "pts tpm reb ast stl blk fg ft".split(' ');
    for (var i = 0; i < vals.length; i=i+1) {
        if (localStorage[vals[i]] !== undefined && $("#text_" + vals[i]).length) {
            $("#text_" + vals[i]).val(localStorage[vals[i]]);
        }
    }

    if (localStorage['remove_owned'] !== undefined && $("#chk_remove_owned").length) {
        $("#chk_remove_owned").attr('checked', localStorage['remove_owned']);
    }
}
