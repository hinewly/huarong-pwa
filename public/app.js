/* 华容道 · DaoBox 家族（v0.1.0） */
"use strict";

var APP_VERSION = "v0.1.0";
var STORE_KEY = "dbyrd-save";

var mode = "number";        // number | classic
var numSize = 4;
var grid = [];              // 数字模式 N x N，0 = 空格
var moves = 0;
var timerInt = null;
var startTs = 0;
var playing = false;        // 已开始计时
var solved = false;
var locked = false;         // portal 时长锁

var pieces = [];            // 经典模式棋子
var layoutKey = "hengdao";
var dirPadEl = null;
var dirPadTimer = null;

var best = { num: {}, classic: {} };

function $(id) { return document.getElementById(id); }
function boardEl() { return $("board"); }

/* ---------- 存档 ---------- */
function saveGame() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(best)); } catch (err) {}
}
function loadGame() {
  try {
    var d = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    if (d && typeof d === "object") { best.num = d.num || {}; best.classic = d.classic || {}; }
  } catch (err) {}
}
function bestKey() { return mode === "number" ? String(numSize) : layoutKey; }
function bestVal() { return (mode === "number" ? best.num : best.classic)[bestKey()] || null; }

/* ---------- 计时 ---------- */
function fmtTime(sec) {
  var m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}
function startTimer() {
  if (playing) return;
  playing = true; startTs = Date.now();
  timerInt = setInterval(function () {
    $("time").textContent = fmtTime(Math.floor((Date.now() - startTs) / 1000));
  }, 500);
}
function stopTimer() {
  if (timerInt) { clearInterval(timerInt); timerInt = null; }
  playing = false;
  return Math.floor((Date.now() - startTs) / 1000);
}
function resetTimer() {
  stopTimer();
  $("time").textContent = "0:00";
}

function updateHud() {
  $("moves").textContent = moves;
  $("best").textContent = bestVal() === null ? "—" : bestVal() + " 步";
}

function onMove() {
  if (solved) return;
  moves++;
  startTimer();
  updateHud();
}

/* ---------- 胜利 ---------- */
function win(subText) {
  solved = true;
  stopTimer();
  var prevBest = bestVal();
  var isNew = prevBest === null || moves < prevBest;
  if (isNew) {
    (mode === "number" ? best.num : best.classic)[bestKey()] = moves;
    saveGame();
  }
  $("win-text").textContent = "🎉 通关！";
  $("win-sub").textContent = (subText || "") + (isNew ? " · 🏆 新纪录！" : (prevBest !== null ? " · 纪录 " + prevBest + " 步" : ""));
  $("win-banner").classList.remove("hidden");
  updateHud();
}

/* ============================================================
   数字华容道
============================================================ */
function newNumericGame() {
  var N = numSize;
  grid = [];
  for (var r = 0; r < N; r++) {
    var row = [];
    for (var c = 0; c < N; c++) row.push(r * N + c + 1);
    grid.push(row);
  }
  grid[N - 1][N - 1] = 0;
  // 从终局随机走合法步打乱（保证有解），避免立即回退
  var blank = { r: N - 1, c: N - 1 };
  var lastDir = null;
  var DIRS = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
  for (var i = 0; i < N * N * 40; i++) {
    var cand = DIRS.filter(function (d, di) {
      var rr = blank.r + d.dr, cc = blank.c + d.dc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) return false;
      if (lastDir && d.dr === -lastDir.dr && d.dc === -lastDir.dc) return false;
      return true;
    });
    if (!cand.length) continue;
    var d2 = cand[Math.floor(Math.random() * cand.length)];
    grid[blank.r][blank.c] = grid[blank.r + d2.dr][blank.c + d2.dc];
    grid[blank.r + d2.dr][blank.c + d2.dc] = 0;
    blank = { r: blank.r + d2.dr, c: blank.c + d2.dc };
    lastDir = d2;
  }
  if (isNumericSolved()) { return newNumericGame(); }
  moves = 0; solved = false;
  resetTimer();
  $("win-banner").classList.add("hidden");
  renderNumeric();
  updateHud();
}

function isNumericSolved() {
  var N = numSize;
  for (var r = 0; r < N; r++)
    for (var c = 0; c < N; c++) {
      var want = (r === N - 1 && c === N - 1) ? 0 : r * N + c + 1;
      if (grid[r][c] !== want) return false;
    }
  return true;
}

function findBlank() {
  var N = numSize;
  for (var r = 0; r < N; r++)
    for (var c = 0; c < N; c++) if (grid[r][c] === 0) return { r: r, c: c };
  return null;
}

// 点击数字块：同行/同列则整段滑向空格（每格计 1 步）
function numericTap(r, c) {
  if (locked || solved) return;
  var N = numSize;
  var blank = findBlank();
  if (r !== blank.r && c !== blank.c) return;
  var shifted = 0;
  if (r === blank.r) {
    var dir = c > blank.c ? 1 : -1; // 朝目标方向逐格搬移
    for (var cc = blank.c; cc !== c; cc += dir) {
      grid[r][cc] = grid[r][cc + dir]; grid[r][cc + dir] = 0; shifted++;
    }
  } else {
    var dir2 = r > blank.r ? 1 : -1;
    for (var rr = blank.r; rr !== r; rr += dir2) {
      grid[rr][c] = grid[rr + dir2][c]; grid[rr + dir2][c] = 0; shifted++;
    }
  }
  if (shifted > 0) {
    onMove();
    renderNumeric();
    if (isNumericSolved()) win("用时 " + $("time").textContent + " · " + moves + " 步");
  }
}

function renderNumeric() {
  var N = numSize;
  var board = boardEl();
  board.className = "board numeric";
  board.innerHTML = "";
  var cellPct = 100 / N;
  var gap = 4; // px
  for (var r = 0; r < N; r++) {
    for (var c = 0; c < N; c++) {
      var v = grid[r][c];
      if (v === 0) continue;
      var t = document.createElement("div");
      t.className = "tile";
      t.textContent = v;
      t.style.width = "calc(" + cellPct + "% - " + gap * 2 + "px)";
      t.style.height = "calc(" + cellPct + "% - " + gap * 2 + "px)";
      t.style.left = "calc(" + (c * cellPct) + "% + " + gap + "px)";
      t.style.top = "calc(" + (r * cellPct) + "% + " + gap + "px)";
      (function (rr, ccc) {
        t.addEventListener("click", function () { numericTap(rr, ccc); });
      })(r, c);
      board.appendChild(t);
    }
  }
}

/* ============================================================
   经典华容道（ Klotski ）
============================================================ */
var LAYOUTS = {
  hengdao: [
    { n: "张飞", role: "五虎将", t: "general", w: 1, h: 2, r: 0, c: 0 },
    { n: "曹操", role: "主帅", t: "caocao", w: 2, h: 2, r: 0, c: 1 },
    { n: "黄忠", role: "五虎将", t: "general", w: 1, h: 2, r: 0, c: 3 },
    { n: "马超", role: "五虎将", t: "general", w: 1, h: 2, r: 2, c: 0 },
    { n: "关羽", role: "五虎上将", t: "guanyu", w: 2, h: 1, r: 2, c: 1 },
    { n: "赵云", role: "五虎将", t: "general", w: 1, h: 2, r: 2, c: 3 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 3, c: 1 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 3, c: 2 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 4, c: 0 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 4, c: 3 }
  ],
  zhihui: [
    { n: "张飞", role: "五虎将", t: "general", w: 1, h: 2, r: 0, c: 0 },
    { n: "曹操", role: "主帅", t: "caocao", w: 2, h: 2, r: 0, c: 1 },
    { n: "黄忠", role: "五虎将", t: "general", w: 1, h: 2, r: 0, c: 3 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 2, c: 0 },
    { n: "关羽", role: "五虎上将", t: "guanyu", w: 2, h: 1, r: 2, c: 1 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 2, c: 3 },
    { n: "马超", role: "五虎将", t: "general", w: 1, h: 2, r: 3, c: 0 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 3, c: 1 },
    { n: "卒", t: "soldier", w: 1, h: 1, r: 3, c: 2 },
    { n: "赵云", role: "五虎将", t: "general", w: 1, h: 2, r: 3, c: 3 }
  ]
};

function occupied(r, c, exceptIdx) {
  for (var i = 0; i < pieces.length; i++) {
    if (i === exceptIdx) continue;
    var p = pieces[i];
    if (r >= p.r && r < p.r + p.h && c >= p.c && c < p.c + p.w) return true;
  }
  return false;
}

// piece 沿 dr,dc 最多可滑几格
function freeSteps(idx, dr, dc) {
  var p = pieces[idx];
  var steps = 0;
  for (var s = 1; s <= 4; s++) {
    if (dr !== 0) {
      var rr = dr > 0 ? p.r + p.h - 1 + s : p.r - s;
      if (rr < 0 || rr >= 5) break;
      for (var c = p.c; c < p.c + p.w; c++) if (occupied(rr, c, idx)) break;
      if (c < p.c + p.w) break;
    } else {
      var cc = dc > 0 ? p.c + p.w - 1 + s : p.c - s;
      if (cc < 0 || cc >= 4) break;
      for (var r = p.r; r < p.r + p.h; r++) if (occupied(r, cc, idx)) break;
      if (r < p.r + p.h) break;
    }
    steps = s;
  }
  return steps;
}

function movableDirs(idx) {
  var out = [];
  var ds = [{ k: "up", dr: -1, dc: 0 }, { k: "down", dr: 1, dc: 0 }, { k: "left", dr: 0, dc: -1 }, { k: "right", dr: 0, dc: 1 }];
  for (var i = 0; i < ds.length; i++) {
    var s = freeSteps(idx, ds[i].dr, ds[i].dc);
    if (s > 0) out.push({ k: ds[i].k, dr: ds[i].dr, dc: ds[i].dc, steps: s });
  }
  return out;
}

function movePiece(idx, dr, dc, steps) {
  if (locked || solved) return false;
  var p = pieces[idx];
  var free = freeSteps(idx, dr, dc);
  if (free <= 0) return false;
  var n = Math.min(steps || 1, free);
  p.r += dr * n; p.c += dc * n;
  onMove();
  renderClassic();
  hideDirPad();
  // 曹操到底部中口
  var cao = pieces[idx];
  if (cao.t === "caocao" && cao.r === 3 && cao.c === 1) {
    win("用时 " + $("time").textContent + " · " + moves + " 步");
  }
  return true;
}

function renderClassic() {
  var board = boardEl();
  board.className = "board classic";
  // 只更新位置（保留节点，动画顺滑）
  var needsRebuild = board.children.length !== pieces.length || pieces.some(function (p) { return !p.el; });
  if (needsRebuild) {
    board.innerHTML = "";
    pieces.forEach(function (p, i) {
      var el = document.createElement("div");
      el.className = "piece piece-" + p.t;
      var name = document.createElement("div");
      name.className = "p-name";
      name.textContent = p.n;
      el.appendChild(name);
      if (p.role) {
        var role = document.createElement("div");
        role.className = "p-role";
        role.textContent = p.role;
        el.appendChild(role);
      }
      bindPieceDrag(el, i);
      board.appendChild(el);
      p.el = el;
    });
  }
  pieces.forEach(function (p) {
    p.el.style.left = (p.c * 25) + "%";
    p.el.style.top = (p.r * 20) + "%";
    p.el.style.width = (p.w * 25) + "%";
    p.el.style.height = (p.h * 20) + "%";
  });
}

function newClassicGame() {
  pieces = LAYOUTS[layoutKey].map(function (d) {
    return JSON.parse(JSON.stringify(d));
  });
  moves = 0; solved = false;
  resetTimer();
  hideDirPad();
  $("win-banner").classList.add("hidden");
  renderClassic();
  updateHud();
}

/* ---------- 经典模式输入：点按 + 拖动 ---------- */
function bindPieceDrag(el, idx) {
  var startX = 0, startY = 0, tracking = false;
  el.addEventListener("pointerdown", function (e) {
    if (locked || solved) return;
    startX = e.clientX; startY = e.clientY;
    tracking = true;
    e.preventDefault();
  });
  el.addEventListener("pointerup", function (e) {
    if (!tracking || locked || solved) return;
    tracking = false;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    var dist = Math.hypot(dx, dy);
    if (dist < 14) {
      classicTap(idx);
      return;
    }
    var dirs = movableDirs(idx);
    if (!dirs.length) return;
    var want = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    var d = dirs.filter(function (x) { return x.k === want; })[0];
    if (!d) return;
    // 拖动距离折算格数（约 56px 一格）
    var steps = Math.max(1, Math.min(d.steps, Math.round(dist / 56)));
    movePiece(idx, d.dr, d.dc, steps);
  });
  el.addEventListener("pointercancel", function () { tracking = false; });
}

function classicTap(idx) {
  var dirs = movableDirs(idx);
  if (!dirs.length) return;
  if (dirs.length === 1) {
    movePiece(idx, dirs[0].dr, dirs[0].dc, 1);
  } else {
    showDirPad(idx, dirs);
  }
}

function showDirPad(idx, dirs) {
  hideDirPad();
  var p = pieces[idx];
  var pad = document.createElement("div");
  pad.className = "dir-pad";
  dirs.forEach(function (d) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "dir-btn";
    b.setAttribute("data-dir", d.k);
    b.textContent = { up: "↑", down: "↓", left: "←", right: "→" }[d.k];
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      movePiece(idx, d.dr, d.dc, 1);
    });
    pad.appendChild(b);
  });
  boardEl().appendChild(pad);
  // 居中于棋子
  requestAnimationFrame(function () {
    var bw = boardEl().getBoundingClientRect();
    var pw = p.el.getBoundingClientRect();
    pad.style.left = (pw.left - bw.left + pw.width / 2 - pad.offsetWidth / 2) + "px";
    pad.style.top = (pw.top - bw.top + pw.height / 2 - pad.offsetHeight / 2) + "px";
  });
  dirPadEl = pad;
  clearTimeout(dirPadTimer);
  dirPadTimer = setTimeout(hideDirPad, 4000);
}

function hideDirPad() {
  if (dirPadEl) { dirPadEl.remove(); dirPadEl = null; }
  clearTimeout(dirPadTimer);
}

/* ---------- 模式/尺寸/布局切换 ---------- */
function switchMode(m) {
  mode = m;
  solved = false;
  $("mode-number").classList.toggle("active", m === "number");
  $("mode-classic").classList.toggle("active", m === "classic");
  $("num-sizes").classList.toggle("hidden", m !== "number");
  $("classic-layouts").classList.toggle("hidden", m !== "classic");
  hideDirPad();
  if (m === "number") newNumericGame(); else newClassicGame();
}

/* ---------- 时长体系：portal.js 超时事件 ---------- */
function applyTimeLock() {
  locked = true;
  $("time-lock").classList.remove("hidden");
}
window.addEventListener("daobox:timeexceeded", function () { applyTimeLock(); });
setTimeout(function () {
  try { if (window.DaoBox && window.DaoBox.timeExceeded) applyTimeLock(); } catch (err) {}
}, 1200);

/* ---------- 启动 ---------- */
function boot() {
  $("app-version").textContent = APP_VERSION;
  $("refresh-btn").addEventListener("click", function () {
    if ("caches" in window) {
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).finally(function () { location.reload(); });
    } else { location.reload(); }
  });
  $("lock-close").addEventListener("click", function () { $("time-lock").classList.add("hidden"); });
  $("btn-restart").addEventListener("click", function () {
    if (mode === "number") newNumericGame(); else newClassicGame();
  });
  $("mode-number").addEventListener("click", function () { switchMode("number"); });
  $("mode-classic").addEventListener("click", function () { switchMode("classic"); });
  [...document.querySelectorAll("#num-sizes .sub-btn")].forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#num-sizes .sub-btn").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      numSize = parseInt(b.getAttribute("data-size"), 10);
      newNumericGame();
    });
  });
  [...document.querySelectorAll("#classic-layouts .sub-btn")].forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#classic-layouts .sub-btn").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      layoutKey = b.getAttribute("data-layout");
      newClassicGame();
    });
  });

  loadGame();
  newNumericGame();
}
document.addEventListener("DOMContentLoaded", boot);
