
// formats a decimal (0.75) as a percent string "75.0%"
function format_percent(val) {
    return (val * 100).toFixed(1) + "%";
}

// returns a <td> formatted name, eventually will have links (Y!, Roto, Player Page)
function format_name(name) {
    return '<td align="left" bgcolor="#FFF">' + name + '</td>'
}

// generates the following table cells:
// - z pts tpm reb ast stl blk fga fgp fta ftp
// - Z scores for: pts tpm reb ast stl blk fg ft
function format_season_player(p) {

    var buf = [];

    // TODO server needs to return z
    buf.push('<td align="center" bgcolor="' + z_color(p.z, 2.0) + '">' + p.z.toFixed(2) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF">' + p.pts.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF">' + p.tpm.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.reb.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.ast.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.stl.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#0000FF">' + p.blk.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + p.fga.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + format_percent(p.fgp) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + p.fta.toFixed(1) + '</font></td>');
    buf.push('<td align="center" bgcolor="#FFF"><font color="#FF0000">' + format_percent(p.ftp) + '</font></td>');

    var max = 3.5
    buf.push('<td align="center" bgcolor="' + z_color(p.zpts, max) + '">' + p.zpts.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.ztpm, max) + '">' + p.ztpm.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zreb, max) + '">' + p.zreb.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zast, max) + '">' + p.zast.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zstl, max) + '">' + p.zstl.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zblk, max) + '">' + p.zblk.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zfg, max) + '">' + p.zfg.toFixed(1) + '</td>');
    buf.push('<td align="center" bgcolor="' + z_color(p.zft, max) + '">' + p.zft.toFixed(1) + '</td>');

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
