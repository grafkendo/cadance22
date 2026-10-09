/* Cadence — simple project board. State lives in localStorage. */
(function(){
"use strict";

var LS_KEY = "cadence.v1";
var STATUSES = [
  { id:"backlog", label:"Backlog" },
  { id:"todo",    label:"To Do" },
  { id:"doing",   label:"In Progress", wip:3 },
  { id:"done",    label:"Done" }
];
var PROJECT_COLORS = ["#0F766E","#7C3AED","#D97706","#2563EB","#DB2777","#65A30D"];

function uid(){ return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

/* ---------- Seed data ---------- */
function seed(){
  var p1 = uid(), p2 = uid(), p3 = uid();
  return {
    projects:[
      { id:p1, name:"Protograph", color:"#0F766E" },
      { id:p2, name:"Sketch Tool", color:"#7C3AED" },
      { id:p3, name:"Ideas", color:"#D97706" }
    ],
    cards:[
      { id:uid(), projectId:p1, status:"doing", priority:"high", title:"Verify Day 1 teaser posted (10am Fri)", desc:"Cron fires 10:00 PT. Confirm live, then: follow @hitdreup, reply to early comments, reshare to Stories." },
      { id:uid(), projectId:p1, status:"doing", priority:"high", title:"Pick the demo slate", desc:"Second influencer (Theo or Sage?), product spot (coffee or sneaker?), animated short (logo sting or origami flight?). Unlocks the portfolio section." },
      { id:uid(), projectId:p1, status:"todo", priority:"medium", title:"Verify Day 3 carousel posts Monday", desc:"Cron fires Mon 10:00 PT. Six vector slides." },
      { id:uid(), projectId:p1, status:"backlog", priority:"medium", title:"Add portfolio/work section to site", desc:"Needs approved demos first. Research mobile-video portfolio best practices, then build." },
      { id:uid(), projectId:p1, status:"backlog", priority:"low", title:"Buy a domain", desc:"Candidates looked available: getprotograph.com, protograph.co. Recheck at registrar before buying." },
      { id:uid(), projectId:p1, status:"backlog", priority:"low", title:"Create Facebook Page", desc:"Don't claim cross-posting is active until it exists." },
      { id:uid(), projectId:p1, status:"done", priority:"medium", title:"Nova teaser video", desc:"22s intro teaser built. Reuse Nova for Day 7 reveal." },
      { id:uid(), projectId:p1, status:"done", priority:"medium", title:"WordPress theme v1.0.0", desc:"Ported from the landing page. Zip ready for upload." },
      { id:uid(), projectId:p1, status:"done", priority:"medium", title:"Site live on Vercel", desc:"protograph-lilac.vercel.app, production." },
      { id:uid(), projectId:p2, status:"doing", priority:"high", title:"Review sketch-service spec", desc:"Spec at workspace/agent-tools-lab/specs/sketch-service-spec.md. Four open questions need answers: name, build surface, photoreal bridge, first demo vertical." },
      { id:uid(), projectId:p2, status:"backlog", priority:"medium", title:"Trust-layer research (parked)", desc:"Verification layer for MCP servers. Parked, not dropped." },
      { id:uid(), projectId:p2, status:"backlog", priority:"medium", title:"Agent payments research (parked)", desc:"Billing rails for agents. Parked, not dropped." },
      { id:uid(), projectId:p2, status:"done", priority:"medium", title:"Landscape research", desc:"MCP/A2A standards, market sizing, gap validated. Report in Agent Tools Lab chat." },
      { id:uid(), projectId:p3, status:"backlog", priority:"low", title:"Second influencer character", desc:"Theo (streetwear) or Sage (wellness)? Contrasts Nova." },
      { id:uid(), projectId:p3, status:"backlog", priority:"low", title:"Companion avatar pricing page", desc:"1,874 subs at $5/mo target. Needs a real page when ready." }
    ],
    filter:"all",
    search:""
  };
}

/* ---------- State ---------- */
var state;
try {
  state = JSON.parse(localStorage.getItem(LS_KEY)) || seed();
} catch(e){ state = seed(); }
if(!state.projects || !state.cards) state = seed();
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} scheduleBackup(); }

function projById(id){ return state.projects.find(function(p){return p.id===id;}) || {name:"?",color:"#9AA0AA"}; }

/* ---------- DOM ---------- */
var $ = function(id){ return document.getElementById(id); };
var boardEl=$("board"), projectListEl=$("projectList"), statsEl=$("stats"),
    boardTitleEl=$("boardTitle"), searchEl=$("search");

/* ---------- Render: sidebar ---------- */
function renderProjects(){
  projectListEl.innerHTML = "";
  function addRow(id, name, color, count, active){
    var b = document.createElement("button");
    b.className = "proj" + (active?" active":"");
    b.innerHTML = '<span class="dot" style="background:'+esc(color)+'"></span><span>'+esc(name)+
      '</span><span class="count">'+count+'</span>';
    b.onclick = function(){ state.filter = id; save(); render(); };
    projectListEl.appendChild(b);
  }
  var open = state.cards.filter(function(c){return c.status!=="done";}).length;
  addRow("all","All projects","#1A1D21",open,state.filter==="all");
  state.projects.forEach(function(p){
    var n = state.cards.filter(function(c){return c.projectId===p.id && c.status!=="done";}).length;
    addRow(p.id,p.name,p.color,n,state.filter===p.id);
  });
}

/* ---------- Render: stats ---------- */
function renderStats(){
  var open = state.cards.filter(function(c){return c.status!=="done";}).length;
  var doing = state.cards.filter(function(c){return c.status==="doing";}).length;
  var done = state.cards.filter(function(c){return c.status==="done";}).length;
  statsEl.innerHTML = "<span><b>"+open+"</b> open</span><span><b>"+doing+"</b> in progress</span><span><b>"+done+"</b> done</span>";
  var f = state.filter;
  boardTitleEl.textContent = f==="all" ? "All projects" : projById(f).name;
}

/* ---------- Render: board ---------- */
function visibleCards(){
  var q = (state.search||"").toLowerCase();
  return state.cards.filter(function(c){
    if(state.filter!=="all" && c.projectId!==state.filter) return false;
    if(q && (c.title+" "+(c.desc||"")).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
}

function renderBoard(){
  boardEl.innerHTML = "";
  var cards = visibleCards();
  STATUSES.forEach(function(st){
    var col = document.createElement("div");
    col.className = "column";
    var list = cards.filter(function(c){return c.status===st.id;});
    var pill = '<span class="pill'+(st.wip&&list.length>st.wip?" over":"")+'">'+list.length+"</span>";
    var wip = st.wip ? '<span class="wip">WIP '+st.wip+'</span>' : "";
    col.innerHTML = '<div class="col-head">'+esc(st.label)+" "+pill+wip+'</div>';
    var wrap = document.createElement("div");
    wrap.className = "cards";
    wrap.dataset.status = st.id;
    list.forEach(function(c){ wrap.appendChild(cardEl(c)); });
    col.appendChild(wrap);
    var add = document.createElement("button");
    add.className = "add-card";
    add.textContent = "+ Add card";
    add.onclick = function(){ openModal(null, st.id); };
    col.appendChild(add);
    boardEl.appendChild(col);
  });
  wireDnD();
}

function cardEl(c){
  var p = projById(c.projectId);
  var d = document.createElement("div");
  d.className = "card"; d.draggable = true; d.dataset.id = c.id;
  d.innerHTML =
    '<div class="card-top"><span class="pri '+esc(c.priority)+'"></span>'+
    '<span class="card-proj">'+esc(p.name)+'</span></div>'+
    '<div class="card-title">'+esc(c.title)+'</div>'+
    (c.desc ? '<div class="card-desc">'+esc(c.desc)+'</div>' : '');
  d.onclick = function(){ openModal(c.id); };
  d.ondragstart = function(e){ e.dataTransfer.setData("text/plain", c.id); d.classList.add("dragging"); };
  d.ondragend = function(){ d.classList.remove("dragging"); };
  return d;
}

/* ---------- Drag & drop ---------- */
function wireDnD(){
  boardEl.querySelectorAll(".cards").forEach(function(zone){
    zone.ondragover = function(e){ e.preventDefault(); zone.classList.add("dragover"); };
    zone.ondragleave = function(){ zone.classList.remove("dragover"); };
    zone.ondrop = function(e){
      e.preventDefault(); zone.classList.remove("dragover");
      var id = e.dataTransfer.getData("text/plain");
      var c = state.cards.find(function(x){return x.id===id;});
      if(c && c.status!==zone.dataset.status){
        c.status = zone.dataset.status; save(); render();
        toast("Moved to " + label(zone.dataset.status));
      }
    };
  });
}
function label(s){ var st = STATUSES.find(function(x){return x.id===s;}); return st?st.label:s; }

/* ---------- Modal ---------- */
var editingId = null;
var modalBackdrop=$("modalBackdrop");
function openModal(id, presetStatus){
  editingId = id || null;
  var c = id ? state.cards.find(function(x){return x.id===id;}) : null;
  $("modalTitle").textContent = c ? "Edit card" : "New card";
  $("fTitle").value = c ? c.title : "";
  $("fDesc").value = c ? (c.desc||"") : "";
  $("fPriority").value = c ? c.priority : "medium";
  $("fStatus").value = c ? c.status : (presetStatus||"todo");
  var fp = $("fProject"); fp.innerHTML = "";
  state.projects.forEach(function(p){
    var o = document.createElement("option");
    o.value = p.id; o.textContent = p.name;
    if(c ? c.projectId===p.id : (state.filter!=="all"&&state.filter===p.id)) o.selected = true;
    fp.appendChild(o);
  });
  $("deleteCardBtn").hidden = !c;
  modalBackdrop.hidden = false;
  setTimeout(function(){ $("fTitle").focus(); }, 30);
}
function closeModal(){ modalBackdrop.hidden = true; editingId = null; }

$("saveBtn").onclick = function(){
  var title = $("fTitle").value.trim();
  if(!title){ toast("Give the card a title first"); return; }
  if(editingId){
    var c = state.cards.find(function(x){return x.id===editingId;});
    c.title = title; c.desc = $("fDesc").value.trim();
    c.priority = $("fPriority").value; c.projectId = $("fProject").value; c.status = $("fStatus").value;
    toast("Card updated");
  } else {
    state.cards.push({ id:uid(), projectId:$("fProject").value, status:$("fStatus").value,
      priority:$("fPriority").value, title:title, desc:$("fDesc").value.trim() });
    toast("Card added");
  }
  save(); closeModal(); render();
};
$("deleteCardBtn").onclick = function(){
  if(editingId && confirm("Delete this card?")){
    state.cards = state.cards.filter(function(x){return x.id!==editingId;});
    save(); closeModal(); render(); toast("Card deleted");
  }
};
$("cancelBtn").onclick = closeModal;
modalBackdrop.addEventListener("click", function(e){ if(e.target===modalBackdrop) closeModal(); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape"&&!modalBackdrop.hidden) closeModal(); });

/* ---------- Projects ---------- */
$("addProjectBtn").onclick = function(){
  var name = prompt("Project name:");
  if(!name || !name.trim()) return;
  var used = state.projects.map(function(p){return p.color;});
  var color = PROJECT_COLORS.find(function(c){return used.indexOf(c)<0;}) || PROJECT_COLORS[0];
  state.projects.push({ id:uid(), name:name.trim(), color:color });
  save(); render(); toast("Project added");
};
$("addCardBtn").onclick = function(){ openModal(null, "todo"); };

/* ---------- Search / sidebar ---------- */
searchEl.addEventListener("input", function(){ state.search = searchEl.value; renderBoard(); });
$("menuBtn").onclick = function(){ $("sidebar").classList.toggle("open"); };

/* ---------- Toast ---------- */
var toastTimer = null;
function toast(msg){
  var t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.hidden = true; }, 2200);
}

/* ================= Google Drive backup =================
   Needs a Google OAuth client ID (see README). With it set, the
   "Connect Google Drive" button appears in the sidebar; every change
   is backed up to Drive ~2.5s after you make it. Scope is drive.file:
   the app can only touch files it created itself. */
var GOOGLE_CLIENT_ID = "195451360720-a7cam3ccakgeig4ff6dfqcs73o89iptk.apps.googleusercontent.com"; /* Cadence Drive backup */
var DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
var DRIVE_FOLDER_NAME = "Cadence";
var DRIVE_FILE_NAME = "cadence-backup.json";

var drive = {
  token:null, tokenExp:0, tokenClient:null,
  folderId:null, fileId:null, state:"idle", /* idle|unconfigured|disconnected|working|ok|error */
  backupTimer:null
};
drive.state = GOOGLE_CLIENT_ID.indexOf("apps.googleusercontent.com") > 0 ? "disconnected" : "unconfigured";

function driveUi(msg){
  var box = $("driveStatus"), txt = $("driveStatusText"),
      btn = $("driveBtn"), note = $("driveNote");
  box.className = "drive-status" + (drive.state==="ok" ? " ok" : drive.state==="working" ? " working" : drive.state==="error" ? " err" : "");
  var labels = { unconfigured:"Drive not configured", disconnected:"Drive not connected",
    working:"Working…", ok:"Backing up to Drive ✓", error:"Drive error — tap to retry", idle:"Drive not connected" };
  txt.textContent = msg || labels[drive.state] || labels.idle;
  if(drive.state === "unconfigured"){
    btn.hidden = true; note.hidden = false;
    note.innerHTML = "To enable Drive backup, add an OAuth client ID in <code>app.js</code> (<code>GOOGLE_CLIENT_ID</code>), with this origin authorized:<br><code>" + esc(location.origin) + "</code>";
  } else {
    btn.hidden = false; note.hidden = true;
    btn.textContent = drive.state==="ok" ? "Disconnect Drive" : drive.state==="disconnected" ? "Connect Google Drive" : "Drive…";
  }
}

$("driveBtn").onclick = function(){
  if(drive.state === "ok"){ driveDisconnect(); }
  else { driveConnect(); }
};

function driveConnect(){
  if(drive.state === "unconfigured"){ driveUi(); return; }
  if(!window.google || !google.accounts || !google.accounts.oauth2){
    drive.state = "error"; driveUi("Google script still loading — try again"); return;
  }
  drive.state = "working"; driveUi();
  if(!drive.tokenClient){
    drive.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE,
      callback: function(resp){
        if(resp && resp.access_token){
          drive.token = resp.access_token;
          drive.tokenExp = Date.now() + (parseInt(resp.expires_in||"3600",10) * 1000);
          driveEnsure().then(function(){ drive.state = "ok"; driveUi(); scheduleBackup(400); })
                        .catch(function(){ drive.state = "error"; driveUi(); });
        } else { drive.state = "error"; driveUi("Sign-in cancelled"); }
      }
    });
  }
  drive.tokenClient.requestAccessToken({ prompt: drive.token ? "" : "consent" });
}

function driveDisconnect(){
  drive.token = null; drive.folderId = null; drive.fileId = null;
  drive.state = "disconnected"; driveUi(); toast("Drive disconnected");
}

function driveApi(path, opts){
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers["Authorization"] = "Bearer " + drive.token;
  return fetch("https://www.googleapis.com" + path, opts).then(function(r){
    if(r.status === 401){ drive.state = "error"; driveUi("Session expired — reconnect Drive"); throw new Error("unauthorized"); }
    return r;
  });
}

function driveEnsure(){
  /* find or create the Cadence folder, then locate the backup file */
  var q = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='" + DRIVE_FOLDER_NAME + "' and trashed=false");
  return driveApi("/drive/v3/files?q=" + q + "&fields=files(id)").then(function(r){ return r.json(); })
  .then(function(j){
    if(j.files && j.files.length){ drive.folderId = j.files[0].id; return; }
    return driveApi("/drive/v3/files?fields=id", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" })
    }).then(function(r){ return r.json(); }).then(function(j2){ drive.folderId = j2.id; });
  }).then(function(){
    var q2 = encodeURIComponent("name='" + DRIVE_FILE_NAME + "' and '" + drive.folderId + "' in parents and trashed=false");
    return driveApi("/drive/v3/files?q=" + q2 + "&fields=files(id)").then(function(r){ return r.json(); });
  }).then(function(j){
    drive.fileId = (j.files && j.files.length) ? j.files[0].id : null;
  });
}

function drivePayload(){
  return JSON.stringify({ app:"cadence", version:1, exportedAt:new Date().toISOString(),
    projects: state.projects, cards: state.cards });
}

function scheduleBackup(delay){
  if(drive.state !== "ok") return;
  clearTimeout(drive.backupTimer);
  drive.backupTimer = setTimeout(driveBackupNow, delay || 2500);
}

function driveBackupNow(){
  if(drive.state !== "ok" || !drive.token) return;
  if(Date.now() > drive.tokenExp - 60000){ drive.state = "error"; driveUi("Session expired — reconnect Drive"); return; }
  drive.state = "working"; driveUi("Backing up…");
  var body = drivePayload();
  var done = function(){ drive.state = "ok"; driveUi(); };
  var fail = function(){ drive.state = "error"; driveUi(); };
  if(drive.fileId){
    driveApi("/upload/drive/v3/files/" + drive.fileId + "?uploadType=media", {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body: body
    }).then(function(r){ if(!r.ok) throw 0; done(); }).catch(fail);
  } else {
    var boundary = "cadence" + Date.now();
    var meta = JSON.stringify({ name: DRIVE_FILE_NAME, parents: [drive.folderId], mimeType: "application/json" });
    var multipart = "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
      meta + "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" + body +
      "\r\n--" + boundary + "--";
    driveApi("/upload/drive/v3/files?uploadType=multipart", {
      method:"POST", headers:{"Content-Type":"multipart/related; boundary=" + boundary}, body: multipart
    }).then(function(r){ return r.json().then(function(j){ if(!r.ok) throw 0; drive.fileId = j.id; }); })
      .then(done).catch(fail);
  }
}

/* ---------- Render all ---------- */
function render(){ renderProjects(); renderStats(); renderBoard(); }
driveUi();
render();
})();
