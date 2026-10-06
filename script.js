// El Mentiroso: dados de faroles contra tres bots. Los unos son comodines.
var NOMBRES = [['Tú', '🙂'], ['Paco', '🧔'], ['Lola', '👩‍🦰'], ['El Tuerto', '🏴‍☠️']];
var J, turno, apuesta, log, fase, revelar, ganadas = 0;
try { ganadas = +localStorage.getItem('mentiroso-ganadas') || 0; } catch (e) {}
var miCant = 1, miCara = 2;
function $(id) { return document.getElementById(id); }
function tirar(n) { var d = []; for (var i = 0; i < n; i++) d.push(1 + Math.floor(Math.random() * 6)); return d.sort(); }
function vivos() { return J.filter(function (j) { return j.n > 0; }); }
function totalDados() { return J.reduce(function (s, j) { return s + j.n; }, 0); }
function cuenta(cara) { return J.reduce(function (s, j) { return s + j.d.filter(function (x) { return x === cara || x === 1; }).length; }, 0); }
function sig(i) { do { i = (i + 1) % J.length; } while (J[i].n === 0); return i; }
function valida(c, f) { return !apuesta || c > apuesta.c || (c === apuesta.c && f > apuesta.f); }
function decir(t) { log.unshift(t); if (log.length > 30) log.pop(); }

function nueva() {
  J = NOMBRES.map(function (n) { return { nombre: n[0], cara: n[1], n: 5, d: [] }; });
  turno = Math.floor(Math.random() * 4);
  log = [];
  ronda();
}

function ronda() {
  J.forEach(function (j) { j.d = tirar(j.n); });
  apuesta = null; revelar = false; fase = 'juego';
  miCant = 1; miCara = 2;
  pintar();
  avanzar();
}

function avanzar() {
  if (fase !== 'juego') return;
  if (turno !== 0) setTimeout(turnoBot, 900 + Math.random() * 600);
  pintar();
}

function apostar(i, c, f) {
  apuesta = { c: c, f: f, quien: i };
  decir(J[i].nombre + ' apuesta ' + c + ' de ' + f + (c === 1 ? '' : 's'));
  turno = sig(i);
  avanzar();
}

function dudar(i) {
  var a = apuesta, real = cuenta(a.f), acierto = real >= a.c;
  var pierde = acierto ? i : a.quien;
  decir('¡' + J[i].nombre + ' duda! Hay ' + real + ' de ' + a.f + '. Pierde un dado ' + J[pierde].nombre + '.');
  J[pierde].n--;
  revelar = { f: a.f };
  fase = 'revelar';
  turno = J[pierde].n > 0 ? pierde : sig(pierde);
  if (J[0].n === 0 || vivos().length === 1) fase = 'fin';
  if (fase === 'fin' && J[0].n > 0) { ganadas++; try { localStorage.setItem('mentiroso-ganadas', ganadas); } catch (e) {} }
  pintar();
}

// Bot: estima los dados que hay con los suyos y una probabilidad de 1/3 por dado ajeno.
function turnoBot() {
  var i = turno, yo = J[i], ajenos = totalDados() - yo.n;
  var mios = function (f) { return yo.d.filter(function (x) { return x === f || x === 1; }).length; };
  var esperado = function (f) { return mios(f) + ajenos / 3; };
  var farol = (i * 7 % 3) * 0.25; // cada bot arriesga distinto
  if (apuesta && apuesta.c > esperado(apuesta.f) + 0.6 + farol + Math.random() * 0.8) return dudar(i);
  var mejor = null;
  for (var f = 2; f <= 6; f++) {
    var c = apuesta ? (f > apuesta.f ? apuesta.c : apuesta.c + 1) : Math.max(1, Math.round(esperado(f) - 1));
    var margen = esperado(f) - c + Math.random() * 0.7;
    if (!mejor || margen > mejor.m) mejor = { c: c, f: f, m: margen };
  }
  if (apuesta && mejor.m < -1.2 - farol) return dudar(i);
  apostar(i, mejor.c, mejor.f);
}

function htmlDado(v, peq, marcar) {
  return '<span class="dado' + (peq ? ' p' : '') + (v === 1 ? ' as' : '') + (marcar ? ' cuenta' : '') + '">' + v + '</span>';
}

function pintar() {
  var app = $('app');
  if (!J) {
    app.innerHTML = '<div class="centro"><p>Faroles, dados y cara de póker contra tres rivales.</p><button class="boton" id="bJugar">Jugar</button>' +
      (ganadas ? '<p>Partidas ganadas: ' + ganadas + '</p>' : '') + '</div>';
    $('bJugar').onclick = nueva;
    return;
  }
  var marca = function (v) { return revelar && (v === revelar.f || v === 1); };
  var html = '<div class="rivales">' + J.slice(1).map(function (j, k) {
    var i = k + 1;
    return '<div class="rival' + (turno === i && fase === 'juego' ? ' turno' : '') + (j.n === 0 ? ' fuera' : '') + '"><div class="cara">' + j.cara + '</div><b>' + j.nombre + '</b>' +
      '<div class="dice">' + (revelar ? '<span class="mini">' + j.d.map(function (v) { return htmlDado(v, true, marca(v)); }).join('') + '</span>' : '🎲 × ' + j.n) + '</div></div>';
  }).join('') + '</div>';
  html += '<div class="apuesta">' + (apuesta ? 'Apuesta de ' + J[apuesta.quien].nombre + '<br><b>' + apuesta.c + ' × ' + apuesta.f + '</b>' : 'Sin apuestas todavía') +
    '<div style="font-size:.85rem;color:var(--muted)">' + totalDados() + ' dados en la mesa</div></div>';
  html += '<div class="dados">' + J[0].d.map(function (v) { return htmlDado(v, false, marca(v)); }).join('') + '</div>';

  if (fase === 'juego' && turno === 0) {
    if (!valida(miCant, miCara)) { if (apuesta) { miCant = apuesta.f < 6 ? apuesta.c : apuesta.c + 1; miCara = apuesta.f < 6 ? apuesta.f + 1 : 2; } }
    html += '<div class="controles"><div class="fila"><button class="boton peq" id="menos">−</button><span class="num">' + miCant + '</span><button class="boton peq" id="mas">+</button>' +
      '<span class="caras fila">' + [2, 3, 4, 5, 6].map(function (f) { return '<button data-f="' + f + '"' + (f === miCara ? ' class="sel"' : '') + (valida(miCant, f) ? '' : ' disabled') + '>' + f + '</button>'; }).join('') + '</span></div>' +
      '<div class="fila"><button class="boton" id="bApostar"' + (valida(miCant, miCara) ? '' : ' disabled') + '>Apostar</button>' +
      '<button class="boton dudo" id="bDudo"' + (apuesta ? '' : ' disabled') + '>¡Dudo!</button></div></div>';
  } else if (fase === 'revelar') {
    html += '<div class="centro"><button class="boton" id="bSeguir">Siguiente ronda</button></div>';
  } else if (fase === 'fin') {
    var gano = J[0].n > 0;
    html += '<div class="centro"><h2>' + (gano ? '🏆 ¡Has ganado!' : '💀 Te has quedado sin dados') + '</h2><button class="boton" id="bOtra">Otra partida</button></div>';
  } else {
    html += '<div class="centro" style="color:var(--muted)">' + J[turno].nombre + ' está pensando…</div>';
  }
  html += '<div class="log">' + log.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div>';
  app.innerHTML = html;

  if ($('menos')) {
    $('menos').onclick = function () { miCant = Math.max(1, miCant - 1); pintar(); };
    $('mas').onclick = function () { miCant = Math.min(totalDados(), miCant + 1); pintar(); };
    app.querySelectorAll('.caras button').forEach(function (b) { b.onclick = function () { miCara = +b.dataset.f; pintar(); }; });
    $('bApostar').onclick = function () { if (valida(miCant, miCara)) apostar(0, miCant, miCara); };
    $('bDudo').onclick = function () { dudar(0); };
  }
  if ($('bSeguir')) $('bSeguir').onclick = ronda;
  if ($('bOtra')) $('bOtra').onclick = nueva;
}
pintar();
