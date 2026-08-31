/* ═══════════════════════════════════════
   CONFIG SUPABASE
   (même projet que le site Dupont Productions)
═══════════════════════════════════════ */
const SUPABASE_URL = 'https://csijufljeasiwfppmnog.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yXiQd9iGZ7LxKLvU2ibnUQ_pBFh-xKi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let state = { artistes: [], demandes: [], discographie: [] };
let currentFilter = 'tous';

/* ═══════════════════════════════════════
   AUTHENTIFICATION
═══════════════════════════════════════ */
function showApp(){
  document.getElementById('login-overlay').classList.remove('active');
  document.getElementById('app-root').style.display = 'block';
}
function showLogin(msg){
  document.getElementById('app-root').style.display = 'none';
  document.getElementById('login-overlay').classList.add('active');
  const err = document.getElementById('login-error');
  if(msg){ err.textContent = msg; err.style.display = 'block'; }
  else { err.style.display = 'none'; }
}

async function checkSession(){
  const { data } = await sb.auth.getSession();
  if(data.session){
    showApp();
    init();
  } else {
    showLogin();
  }
}

document.getElementById('login-btn').addEventListener('click', doLogin);
document.getElementById('login-password').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });

async function doLogin(){
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Connexion...';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = 'Se connecter';
  if(error){
    showLogin("Email ou mot de passe incorrect.");
    return;
  }
  showApp();
  init();
}

document.getElementById('btn-logout').addEventListener('click', async ()=>{
  await sb.auth.signOut();
  showLogin();
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
async function init(){
  await loadAll();
  renderDemandes();
  renderArtistes();
  renderStatsTab();
  renderDiscographieTab();
  renderDashboard();
  await loadCorbeille();
  renderCorbeille();
}

document.getElementById('btn-refresh').addEventListener('click', async ()=>{
  await loadAll();
  renderDemandes();
  renderArtistes();
  renderStatsTab();
  renderDiscographieTab();
  renderDashboard();
  await loadCorbeille();
  renderCorbeille();
  toast('🔄 Données actualisées');
});

async function loadAll(){
  const [{ data: artistes, error: e1 }, { data: contacts, error: e2 }, { data: reservations, error: e3 }, { data: discographie, error: e4 }] =
    await Promise.all([
      sb.from('artistes').select('*').eq('supprime', false).order('ordre'),
      sb.from('messages_contact').select('*').eq('supprime', false).order('created_at', { ascending: false }),
      sb.from('demandes_reservation').select('*').eq('supprime', false).order('created_at', { ascending: false }),
      sb.from('discographie').select('*').eq('supprime', false).order('ordre')
    ]);

  if(e1) console.warn('Erreur chargement artistes:', e1.message);
  if(e2) console.warn('Erreur chargement messages:', e2.message);
  if(e3) console.warn('Erreur chargement réservations:', e3.message);
  if(e4) console.warn('Erreur chargement discographie:', e4.message);

  state.discographie = discographie || [];

  state.artistes = (artistes || []).map(a => ({
    id: a.id,
    nom: a.nom,
    style: (a.liens && a.liens.genre) || '',
    bio: a.bio || '',
    photoUrl: a.image_url || '',
    spotifyUrl: (a.liens && a.liens.spotify) || '',
    youtubeUrl: (a.liens && a.liens.youtube) || '',
    appleMusicUrl: (a.liens && a.liens.appleMusic) || '',
    deezerUrl: (a.liens && a.liens.deezer) || '',
    paysEcoute: (a.liens && a.liens.paysEcoute) || 0,
    statut: (a.liens && a.liens.statut) || 'actif',
    streams: (a.liens && a.liens.streams) || 0,
    abonnes: (a.liens && a.liens.abonnes) || 0,
    ecoutes: (a.liens && a.liens.ecoutes) || 0,
    vuesYoutube: (a.liens && a.liens.vuesYoutube) || 0,
    ordre: a.ordre || 0,
    styleBars: (a.liens && Array.isArray(a.liens.style_bars)) ? a.liens.style_bars : [],
    _liens: a.liens || {}
  }));

  const contactDemandes = (contacts || []).map(c => ({
    id: c.id, type: 'contact', nom: c.nom, email: c.email,
    profil: c.profil || '', lien: c.lien || '', message: c.message || '',
    statut: c.statut || 'nouveau', note: c.note || '', date: c.created_at
  }));
  const reservationDemandes = (reservations || []).map(r => ({
    id: r.id, type: 'reservation', nom: r.nom, email: r.email,
    telephone: r.telephone || '', date_souhaitee: r.date_souhaitee || '',
    heure_debut: r.heure_debut || '', heure_fin: r.heure_fin || '',
    message: r.message || '', statut: r.statut || 'nouveau', note: r.note || '',
    date: r.created_at
  }));
  state.demandes = [...contactDemandes, ...reservationDemandes];
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════
   ONGLETS
═══════════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

/* ═══════════════════════ TABLEAU DE BORD ═══════════════════════ */
function updateNavBadge(){
  const count = state.demandes.filter(d => d.statut === 'nouveau').length;
  const badge = document.getElementById('nav-badge-demandes');
  if(count > 0){ badge.textContent = count; badge.style.display = 'inline-block'; }
  else { badge.style.display = 'none'; }
}

function renderDashboard(){
  updateNavBadge();
  const nouveaux = state.demandes.filter(d => d.statut === 'nouveau').length;
  const reservationsEnAttente = state.demandes.filter(d => d.type === 'reservation' && d.statut === 'nouveau').length;
  const artistesActifs = state.artistes.filter(a => a.statut !== 'archive').length;
  const totalTitres = state.discographie.length;

  document.getElementById('dashboard-cards').innerHTML = `
    <div class="dash-card"><div class="dash-card-value">${nouveaux}</div><div class="dash-card-label">Messages non lus</div></div>
    <div class="dash-card"><div class="dash-card-value">${reservationsEnAttente}</div><div class="dash-card-label">Réservations en attente</div></div>
    <div class="dash-card"><div class="dash-card-value">${artistesActifs}</div><div class="dash-card-label">Artistes actifs</div></div>
    <div class="dash-card"><div class="dash-card-value">${totalTitres}</div><div class="dash-card-label">Titres au catalogue</div></div>
  `;

  const recent = [...state.demandes]
    .sort((a,b) => new Date(b.date||0) - new Date(a.date||0))
    .slice(0, 6);
  const recentList = document.getElementById('dashboard-recent');
  if(recent.length === 0){
    recentList.innerHTML = '<div class="empty-state">Aucune activité pour le moment.</div>';
    return;
  }
  recentList.innerHTML = recent.map(d => `
    <div class="card" onclick="switchToTab('demandes');setTimeout(()=>openDemandeModal('${d.id}'),50)">
      <div class="avatar">${(d.type==='reservation'?'🎙️':'✉️')}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(d.nom||'(sans nom)')} <span class="badge badge-${d.statut}">${statutLabel(d.statut)}</span></div>
        <div class="card-sub">${escapeHtml(d.email||'')} — ${escapeHtml((d.message||'').slice(0,70))}</div>
      </div>
    </div>
  `).join('');
}

function switchToTab(tabName){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById('tab-'+tabName).classList.add('active');
}

/* ═══════════════════════ RÉORGANISATION (glisser-déposer) ═══════════════════════ */
let wasDragging = false;

function makeListDraggable(container, onReorder){
  let draggedEl = null;

  container.querySelectorAll('.card').forEach(card => {
    card.draggable = true;

    card.addEventListener('dragstart', () => {
      draggedEl = card;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over'));
      const newOrder = [...container.querySelectorAll('.card')].map(c => c.dataset.id);
      wasDragging = true;
      setTimeout(() => wasDragging = false, 200);
      onReorder(newOrder);
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if(card === draggedEl) return;
      card.classList.add('drag-over');
      const rect = card.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      container.insertBefore(draggedEl, after ? card.nextSibling : card);
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
  });
}

/* ═══════════════════════ DEMANDES ═══════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderDemandes();
  });
});

function renderDemandes(){
  const list = document.getElementById('demandes-list');
  let items = [...state.demandes].sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
  if(currentFilter !== 'tous') items = items.filter(d=>d.statut===currentFilter);

  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">Aucune demande pour le moment.<br>Les messages du site apparaîtront automatiquement ici.</div>';
    return;
  }
  list.innerHTML = items.map(d => `
    <div class="card" onclick="openDemandeModal('${d.id}')">
      <div class="avatar">${(d.type==='reservation'?'🎙️':'✉️')}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(d.nom||'(sans nom)')} <span class="badge badge-${d.statut}">${statutLabel(d.statut)}</span></div>
        <div class="card-sub">${escapeHtml(d.email||'')} — ${escapeHtml((d.message||'').slice(0,70))}</div>
      </div>
    </div>
  `).join('');
}

function statutLabel(s){
  return {nouveau:'Nouveau', en_cours:'En cours', traite:'Traité', refuse:'Refusé',
          actif:'Actif', a_venir:'À venir', archive:'Archivé'}[s] || s;
}

document.getElementById('btn-add-demande').addEventListener('click', ()=>openDemandeModal(null));
document.getElementById('d-cancel').addEventListener('click', closeDemandeModal);
document.getElementById('d-type').addEventListener('change', updateDemandeTypeFields);

function updateDemandeTypeFields(){
  const isReservation = document.getElementById('d-type').value === 'reservation';
  document.getElementById('d-champs-contact').style.display = isReservation ? 'none' : 'block';
  document.getElementById('d-champs-reservation').style.display = isReservation ? 'block' : 'none';
}

function openDemandeModal(id){
  const modal = document.getElementById('modal-demande');
  const d = id ? state.demandes.find(x=>x.id===id) : null;
  document.getElementById('modal-demande-title').textContent = d ? 'Modifier la demande' : 'Nouvelle demande';
  document.getElementById('d-id').value = d ? d.id : '';
  document.getElementById('d-type').value = d ? d.type : 'contact';
  document.getElementById('d-nom').value = d ? d.nom||'' : '';
  document.getElementById('d-email').value = d ? d.email||'' : '';
  document.getElementById('d-profil').value = d ? d.profil||'' : '';
  document.getElementById('d-lien').value = d ? d.lien||'' : '';
  document.getElementById('d-telephone').value = d ? d.telephone||'' : '';
  document.getElementById('d-date').value = d ? d.date_souhaitee||'' : '';
  document.getElementById('d-heure-debut').value = d ? d.heure_debut||'' : '';
  document.getElementById('d-heure-fin').value = d ? d.heure_fin||'' : '';
  document.getElementById('d-message').value = d ? d.message||'' : '';
  document.getElementById('d-statut').value = d ? d.statut : 'nouveau';
  document.getElementById('d-note').value = d ? d.note||'' : '';
  document.getElementById('d-delete').style.display = d ? 'inline-block' : 'none';
  updateDemandeTypeFields();
  modal.classList.add('active');
}
function closeDemandeModal(){ document.getElementById('modal-demande').classList.remove('active'); }

document.getElementById('d-save').addEventListener('click', async ()=>{
  const id = document.getElementById('d-id').value;
  const type = document.getElementById('d-type').value;
  const statut = document.getElementById('d-statut').value;
  const note = document.getElementById('d-note').value.trim();
  const nom = document.getElementById('d-nom').value.trim();
  const email = document.getElementById('d-email').value.trim();
  const message = document.getElementById('d-message').value.trim();

  try{
    if(type === 'contact'){
      const payload = {
        nom, email, message, statut, note,
        profil: document.getElementById('d-profil').value.trim(),
        lien: document.getElementById('d-lien').value.trim()
      };
      if(id) await sb.from('messages_contact').update(payload).eq('id', id);
      else   await sb.from('messages_contact').insert(payload);
    } else {
      const payload = {
        nom, email, message, statut, note,
        telephone: document.getElementById('d-telephone').value.trim(),
        date_souhaitee: document.getElementById('d-date').value || null,
        heure_debut: document.getElementById('d-heure-debut').value || null,
        heure_fin: document.getElementById('d-heure-fin').value || null
      };
      if(id) await sb.from('demandes_reservation').update(payload).eq('id', id);
      else   await sb.from('demandes_reservation').insert(payload);
    }
    await loadAll();
    renderDemandes();
    renderDashboard();
    closeDemandeModal();
    toast('✅ Demande enregistrée');
  }catch(e){
    toast('⚠️ Erreur : ' + e.message);
  }
});

document.getElementById('d-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('d-id').value;
  const d = state.demandes.find(x=>x.id===id);
  if(!confirm('Mettre cette demande à la corbeille ?')) return;
  const table = d.type === 'reservation' ? 'demandes_reservation' : 'messages_contact';
  await sb.from(table).update({ supprime: true }).eq('id', id);
  await loadAll();
  renderDemandes();
  renderDashboard();
  closeDemandeModal();
  toast('🗑 Demande envoyée à la corbeille');
  await loadCorbeille();
  renderCorbeille();
});

/* ═══════════════════════ ARTISTES ═══════════════════════ */
function renderArtistes(){
  const list = document.getElementById('artistes-list');
  const items = [...state.artistes].sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">Aucun artiste. Clique sur "+ Ajouter un artiste".</div>';
    return;
  }
  list.innerHTML = items.map(a => `
    <div class="card" data-id="${a.id}" onclick="if(!wasDragging)openArtisteModal('${a.id}')">
      <span class="drag-handle">⠿</span>
      <div class="avatar" style="${a.photoUrl?`background-image:url('${a.photoUrl}')`:''}">${a.photoUrl?'':(a.nom||'?')[0]}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(a.nom)} <span class="badge badge-${a.statut}">${statutLabel(a.statut)}</span></div>
        <div class="card-sub">${escapeHtml(a.style||'')}</div>
      </div>
    </div>
  `).join('');
  makeListDraggable(list, async (newOrderIds) => {
    await Promise.all(newOrderIds.map((id, i) => sb.from('artistes').update({ ordre: i }).eq('id', id)));
    await loadAll();
    renderArtistes();
  });
}

document.getElementById('btn-add-artiste').addEventListener('click', ()=>openArtisteModal(null));
document.getElementById('a-cancel').addEventListener('click', closeArtisteModal);

function openArtisteModal(id){
  const modal = document.getElementById('modal-artiste');
  const a = id ? state.artistes.find(x=>x.id===id) : null;
  document.getElementById('modal-artiste-title').textContent = a ? "Modifier l'artiste" : 'Nouvel artiste';
  document.getElementById('a-id').value = a ? a.id : '';
  document.getElementById('a-nom').value = a ? a.nom : '';
  document.getElementById('a-style').value = a ? a.style||'' : '';
  document.getElementById('a-bio').value = a ? a.bio||'' : '';
  document.getElementById('a-photo').value = a ? a.photoUrl||'' : '';
  document.getElementById('a-spotify').value = a ? a.spotifyUrl||'' : '';
  document.getElementById('a-youtube').value = a ? a.youtubeUrl||'' : '';
  document.getElementById('a-apple').value = a ? a.appleMusicUrl||'' : '';
  document.getElementById('a-deezer').value = a ? a.deezerUrl||'' : '';
  document.getElementById('a-pays').value = a ? a.paysEcoute||0 : 0;
  document.getElementById('a-ordre').value = a ? a.ordre||(state.artistes.length+1) : (state.artistes.length+1);
  document.getElementById('a-statut').value = a ? a.statut : 'actif';
  const bars = a ? (a.styleBars||[]) : [];
  document.getElementById('a-bar1-label').value = bars[0] ? bars[0].label||'' : '';
  document.getElementById('a-bar1-value').value = bars[0] ? bars[0].value||'' : '';
  document.getElementById('a-bar2-label').value = bars[1] ? bars[1].label||'' : '';
  document.getElementById('a-bar2-value').value = bars[1] ? bars[1].value||'' : '';
  document.getElementById('a-bar3-label').value = bars[2] ? bars[2].label||'' : '';
  document.getElementById('a-bar3-value').value = bars[2] ? bars[2].value||'' : '';
  document.getElementById('a-delete').style.display = a ? 'inline-block' : 'none';
  modal.classList.add('active');
}
function closeArtisteModal(){ document.getElementById('modal-artiste').classList.remove('active'); }

document.getElementById('a-save').addEventListener('click', async ()=>{
  const id = document.getElementById('a-id').value;
  const nom = document.getElementById('a-nom').value.trim();
  if(!nom){ toast("⚠️ Le nom d'artiste est obligatoire"); return; }

  const existing = id ? state.artistes.find(x=>x.id===id) : null;
  const existingLiens = existing ? (existing._liens || {}) : {};

  const existingBars = (existingLiens.style_bars || []);
  const defaultColors = ['#1a8cff', '#00e5ff', '#9d6cff'];
  const barInputs = [
    { label: document.getElementById('a-bar1-label').value.trim(), value: document.getElementById('a-bar1-value').value },
    { label: document.getElementById('a-bar2-label').value.trim(), value: document.getElementById('a-bar2-value').value },
    { label: document.getElementById('a-bar3-label').value.trim(), value: document.getElementById('a-bar3-value').value }
  ];
  const style_bars = barInputs
    .map((b, i) => ({
      label: b.label,
      value: b.value === '' ? null : Math.max(0, Math.min(100, parseInt(b.value) || 0)),
      color: (existingBars[i] && existingBars[i].color) || defaultColors[i]
    }))
    .filter(b => b.label && b.value !== null);

  const liens = {
    ...existingLiens,
    genre: document.getElementById('a-style').value.trim(),
    spotify: document.getElementById('a-spotify').value.trim(),
    youtube: document.getElementById('a-youtube').value.trim(),
    appleMusic: document.getElementById('a-apple').value.trim(),
    deezer: document.getElementById('a-deezer').value.trim(),
    paysEcoute: parseInt(document.getElementById('a-pays').value)||0,
    statut: document.getElementById('a-statut').value,
    style_bars
  };

  const payload = {
    nom,
    bio: document.getElementById('a-bio').value.trim(),
    image_url: document.getElementById('a-photo').value.trim(),
    ordre: parseInt(document.getElementById('a-ordre').value)||0,
    liens
  };

  try{
    if(id) await sb.from('artistes').update(payload).eq('id', id);
    else   await sb.from('artistes').insert(payload);
    await loadAll();
    renderArtistes();
    renderStatsTab();
    renderDiscographieTab();
    renderDashboard();
    closeArtisteModal();
    toast('✅ Artiste enregistré');
  }catch(e){
    toast('⚠️ Erreur : ' + e.message);
  }
});

document.getElementById('a-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('a-id').value;
  if(!confirm('Mettre cet artiste à la corbeille ?')) return;
  await sb.from('artistes').update({ supprime: true }).eq('id', id);
  await loadAll();
  renderArtistes();
  renderStatsTab();
  renderDashboard();
  closeArtisteModal();
  toast('🗑 Artiste envoyé à la corbeille');
  await loadCorbeille();
  renderCorbeille();
});

function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ═══════════════════════ UPLOAD DE PHOTOS ═══════════════════════ */
async function uploadFile(file){
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { upsert: false });
  if(error) throw error;
  const { data } = sb.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

document.getElementById('a-photo-upload-btn').addEventListener('click', () => {
  document.getElementById('a-photo-file').click();
});
document.getElementById('a-photo-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  toast('⬆️ Envoi de la photo...');
  try{
    const url = await uploadFile(file);
    document.getElementById('a-photo').value = url;
    toast('✅ Photo envoyée');
  }catch(err){
    toast('⚠️ Erreur upload : ' + err.message);
  }
  e.target.value = '';
});

document.getElementById('t-cover-upload-btn').addEventListener('click', () => {
  document.getElementById('t-cover-file').click();
});
document.getElementById('t-cover-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  toast('⬆️ Envoi de la pochette...');
  try{
    const url = await uploadFile(file);
    document.getElementById('t-cover').value = url;
    toast('✅ Pochette envoyée');
  }catch(err){
    toast('⚠️ Erreur upload : ' + err.message);
  }
  e.target.value = '';
});

/* ═══════════════════════ STATISTIQUES ═══════════════════════ */
function renderStatsTab(){
  const list = document.getElementById('stats-list');
  const items = [...state.artistes].sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">Aucun artiste pour le moment.</div>';
    return;
  }
  list.innerHTML = items.map(a => `
    <div class="card" onclick="openStatsModal('${a.id}')">
      <div class="avatar" style="${a.photoUrl?`background-image:url('${a.photoUrl}')`:''}">${a.photoUrl?'':(a.nom||'?')[0]}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(a.nom)}</div>
        <div class="card-sub">${(a.streams||0).toLocaleString('fr-FR')} streams · ${(a.abonnes||0).toLocaleString('fr-FR')} abonnés · ${(a.ecoutes||0).toLocaleString('fr-FR')} écoutes/mois · ${(a.vuesYoutube||0).toLocaleString('fr-FR')} vues YouTube</div>
      </div>
    </div>
  `).join('');
}

function openStatsModal(id){
  const a = state.artistes.find(x=>x.id===id);
  if(!a) return;
  document.getElementById('modal-stats-title').textContent = 'Statistiques — ' + a.nom;
  document.getElementById('s-id').value = a.id;
  document.getElementById('s-streams').value = a.streams||'';
  document.getElementById('s-abonnes').value = a.abonnes||'';
  document.getElementById('s-ecoutes').value = a.ecoutes||'';
  document.getElementById('s-vues-youtube').value = a.vuesYoutube||'';
  document.getElementById('modal-stats').classList.add('active');
}
function closeStatsModal(){ document.getElementById('modal-stats').classList.remove('active'); }
document.getElementById('s-cancel').addEventListener('click', closeStatsModal);

document.getElementById('s-save').addEventListener('click', async ()=>{
  const id = document.getElementById('s-id').value;
  const a = state.artistes.find(x=>x.id===id);
  if(!a) return;

  const liens = {
    ...a._liens,
    streams: parseInt(document.getElementById('s-streams').value)||0,
    abonnes: parseInt(document.getElementById('s-abonnes').value)||0,
    ecoutes: parseInt(document.getElementById('s-ecoutes').value)||0,
    vuesYoutube: parseInt(document.getElementById('s-vues-youtube').value)||0
  };

  try{
    await sb.from('artistes').update({ liens }).eq('id', id);
    await loadAll();
    renderStatsTab();
    closeStatsModal();
    toast('✅ Statistiques enregistrées');
  }catch(e){
    toast('⚠️ Erreur : ' + e.message);
  }
});

/* ═══════════════════════ DISCOGRAPHIE ═══════════════════════ */
function populateDiscoFilter(){
  const select = document.getElementById('disco-filter-artiste');
  const current = select.value;
  const sorted = [...state.artistes].sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  select.innerHTML = '<option value="">Tous les artistes</option>' +
    sorted.map(a => `<option value="${a.id}">${escapeHtml(a.nom)}</option>`).join('');
  select.value = sorted.some(a=>a.id===current) ? current : '';
}
document.getElementById('disco-filter-artiste').addEventListener('change', renderDiscographieTab);

function renderDiscographieTab(){
  populateDiscoFilter();
  const filterId = document.getElementById('disco-filter-artiste').value;
  const list = document.getElementById('discographie-tab-list');
  const artisteById = {};
  state.artistes.forEach(a => { artisteById[a.id] = a; });

  let tracks = [...state.discographie];
  if(filterId){
    tracks = tracks.filter(t => t.artiste_id === filterId).sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  } else {
    tracks.sort((a,b) => new Date(b.date_sortie||0) - new Date(a.date_sortie||0));
  }

  if(tracks.length === 0){
    list.innerHTML = '<div class="empty-state">Aucun titre pour le moment.<br>Clique sur "+ Ajouter un titre" pour commencer.</div>';
    return;
  }
  list.innerHTML = tracks.map(t => `
    <div class="card" data-id="${t.id}" onclick="if(!wasDragging)openTrackModal('${t.id}')">
      ${filterId ? '<span class="drag-handle">⠿</span>' : ''}
      <div class="avatar" style="${t.cover_url?`background-image:url('${t.cover_url}')`:''}">${t.cover_url?'':'🎵'}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(t.titre||'')}</div>
        <div class="card-sub">${escapeHtml((artisteById[t.artiste_id]||{}).nom||'')} — ${({single:'Single',ep:'EP',album:'Album'}[t.type]||t.type||'')}${t.date_sortie ? ' · ' + t.date_sortie : ''}</div>
      </div>
    </div>
  `).join('');

  if(filterId){
    makeListDraggable(list, async (newOrderIds) => {
      await Promise.all(newOrderIds.map((id, i) => sb.from('discographie').update({ ordre: i }).eq('id', id)));
      const { data } = await sb.from('discographie').select('*').eq('supprime', false).order('ordre');
      state.discographie = data || [];
      renderDiscographieTab();
    });
  }
}

document.getElementById('btn-add-track').addEventListener('click', () => openTrackModal(null));
document.getElementById('t-cancel').addEventListener('click', closeTrackModal);

function populateTrackArtisteSelect(preselectId){
  const select = document.getElementById('t-artiste');
  const sorted = [...state.artistes].sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  select.innerHTML = sorted.map(a => `<option value="${a.id}">${escapeHtml(a.nom)}</option>`).join('');
  if(preselectId) select.value = preselectId;
}

function openTrackModal(id){
  const t = id ? state.discographie.find(x=>x.id===id) : null;
  const filterId = document.getElementById('disco-filter-artiste').value;
  document.getElementById('modal-track-title').textContent = t ? 'Modifier le titre' : 'Nouveau titre';
  document.getElementById('t-id').value = t ? t.id : '';
  populateTrackArtisteSelect(t ? t.artiste_id : filterId);
  document.getElementById('t-titre').value = t ? t.titre||'' : '';
  document.getElementById('t-type').value = t ? t.type||'single' : 'single';
  document.getElementById('t-date').value = t ? t.date_sortie||'' : '';
  document.getElementById('t-cover').value = t ? t.cover_url||'' : '';
  document.getElementById('t-spotify').value = t ? t.spotify_url||'' : '';
  document.getElementById('t-youtube').value = t ? t.youtube_url||'' : '';
  document.getElementById('t-apple').value = t ? t.apple_music_url||'' : '';
  document.getElementById('t-deezer').value = t ? t.deezer_url||'' : '';
  document.getElementById('t-delete').style.display = t ? 'inline-block' : 'none';
  document.getElementById('modal-track').classList.add('active');
}
function closeTrackModal(){ document.getElementById('modal-track').classList.remove('active'); }

document.getElementById('t-save').addEventListener('click', async ()=>{
  const id = document.getElementById('t-id').value;
  const artisteId = document.getElementById('t-artiste').value;
  const titre = document.getElementById('t-titre').value.trim();
  if(!artisteId){ toast('⚠️ Choisis un artiste'); return; }
  if(!titre){ toast('⚠️ Le titre est obligatoire'); return; }

  const existingCount = state.discographie.filter(t => t.artiste_id === artisteId).length;
  const payload = {
    artiste_id: artisteId,
    titre,
    type: document.getElementById('t-type').value,
    date_sortie: document.getElementById('t-date').value || null,
    cover_url: document.getElementById('t-cover').value.trim(),
    spotify_url: document.getElementById('t-spotify').value.trim(),
    youtube_url: document.getElementById('t-youtube').value.trim(),
    apple_music_url: document.getElementById('t-apple').value.trim(),
    deezer_url: document.getElementById('t-deezer').value.trim()
  };
  if(!id) payload.ordre = existingCount;

  try{
    if(id) await sb.from('discographie').update(payload).eq('id', id);
    else   await sb.from('discographie').insert(payload);
    const { data } = await sb.from('discographie').select('*').eq('supprime', false).order('ordre');
    state.discographie = data || [];
    renderDiscographieTab();
    renderDashboard();
    closeTrackModal();
    toast('✅ Titre enregistré');
  }catch(e){
    toast('⚠️ Erreur : ' + e.message);
  }
});

document.getElementById('t-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('t-id').value;
  if(!confirm('Mettre ce titre à la corbeille ?')) return;
  await sb.from('discographie').update({ supprime: true }).eq('id', id);
  const { data } = await sb.from('discographie').select('*').eq('supprime', false).order('ordre');
  state.discographie = data || [];
  renderDiscographieTab();
  renderDashboard();
  closeTrackModal();
  toast('🗑 Titre envoyé à la corbeille');
  await loadCorbeille();
  renderCorbeille();
});

/* ═══════════════════════ CORBEILLE ═══════════════════════ */
let corbeilleFilter = 'tous';
let corbeilleItems = [];

document.querySelectorAll('.corbeille-filter-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.corbeille-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    corbeilleFilter = btn.dataset.type;
    renderCorbeille();
  });
});

async function loadCorbeille(){
  const [{ data: artistes }, { data: contacts }, { data: reservations }, { data: titres }] = await Promise.all([
    sb.from('artistes').select('*').eq('supprime', true),
    sb.from('messages_contact').select('*').eq('supprime', true),
    sb.from('demandes_reservation').select('*').eq('supprime', true),
    sb.from('discographie').select('*').eq('supprime', true)
  ]);

  corbeilleItems = [
    ...(artistes||[]).map(a => ({ kind:'artiste', table:'artistes', id:a.id, label:a.nom, sub:'Artiste', date:a.created_at })),
    ...(contacts||[]).map(c => ({ kind:'demande', table:'messages_contact', id:c.id, label:c.nom||'(sans nom)', sub:'Message : ' + (c.message||'').slice(0,50), date:c.created_at })),
    ...(reservations||[]).map(r => ({ kind:'demande', table:'demandes_reservation', id:r.id, label:r.nom||'(sans nom)', sub:'Réservation studio', date:r.created_at })),
    ...(titres||[]).map(t => ({ kind:'titre', table:'discographie', id:t.id, label:t.titre, sub:'Titre discographie', date:t.created_at }))
  ];
}

function renderCorbeille(){
  const list = document.getElementById('corbeille-list');
  let items = [...corbeilleItems];
  if(corbeilleFilter !== 'tous') items = items.filter(i => i.kind === corbeilleFilter);
  items.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));

  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">La corbeille est vide.</div>';
    return;
  }
  list.innerHTML = items.map((item, i) => `
    <div class="card" style="cursor:default;">
      <div class="avatar">${({artiste:'◈',titre:'🎵',demande:'✉️'})[item.kind]}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(item.label||'')}</div>
        <div class="card-sub">${escapeHtml(item.sub||'')}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn btn-ghost" onclick="restoreFromCorbeille('${item.table}','${item.id}')">↺ Restaurer</button>
        <button class="btn btn-danger" onclick="deleteForeverFromCorbeille('${item.table}','${item.id}')">Supprimer définitivement</button>
      </div>
    </div>
  `).join('');
}

async function restoreFromCorbeille(table, id){
  await sb.from(table).update({ supprime: false }).eq('id', id);
  await loadCorbeille();
  renderCorbeille();
  await loadAll();
  renderDemandes(); renderArtistes(); renderStatsTab(); renderDiscographieTab(); renderDashboard();
  toast('↺ Élément restauré');
}

async function deleteForeverFromCorbeille(table, id){
  if(!confirm('Supprimer définitivement ? Cette action est irréversible.')) return;
  await sb.from(table).delete().eq('id', id);
  await loadCorbeille();
  renderCorbeille();
  toast('🗑 Supprimé définitivement');
}

/* ═══════════════════════════════════════
   DÉMARRAGE
═══════════════════════════════════════ */
checkSession();
