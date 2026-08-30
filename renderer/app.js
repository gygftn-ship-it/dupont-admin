let state = { artistes: [], demandes: [] };
let currentFilter = 'tous';

// ─── Init ───
(async function init(){
  state = await window.dupontAPI.getData();
  renderDemandes();
  renderArtistes();
})();

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

async function persist(){
  await window.dupontAPI.saveData(state);
}

// ─── Onglets ───
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// ═══════════════════════ DEMANDES ═══════════════════════
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
    list.innerHTML = '<div class="empty-state">Aucune demande pour le moment.<br>Clique sur "+ Ajouter une demande" pour en enregistrer une.</div>';
    return;
  }
  list.innerHTML = items.map(d => `
    <div class="card" onclick="openDemandeModal('${d.id}')">
      <div class="avatar">${(d.type==='demo'?'🎵':'✉️')}</div>
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
  document.getElementById('d-message').value = d ? d.message||'' : '';
  document.getElementById('d-statut').value = d ? d.statut : 'nouveau';
  document.getElementById('d-note').value = d ? d.note||'' : '';
  document.getElementById('d-delete').style.display = d ? 'inline-block' : 'none';
  modal.classList.add('active');
}
function closeDemandeModal(){ document.getElementById('modal-demande').classList.remove('active'); }

document.getElementById('d-save').addEventListener('click', async ()=>{
  const id = document.getElementById('d-id').value;
  const data = {
    type: document.getElementById('d-type').value,
    nom: document.getElementById('d-nom').value.trim(),
    email: document.getElementById('d-email').value.trim(),
    profil: document.getElementById('d-profil').value.trim(),
    lien: document.getElementById('d-lien').value.trim(),
    message: document.getElementById('d-message').value.trim(),
    statut: document.getElementById('d-statut').value,
    note: document.getElementById('d-note').value.trim()
  };
  if(id){
    const idx = state.demandes.findIndex(x=>x.id===id);
    state.demandes[idx] = {...state.demandes[idx], ...data};
  } else {
    state.demandes.push({ id: 'd_'+Date.now(), date: new Date().toISOString(), ...data });
  }
  await persist();
  renderDemandes();
  closeDemandeModal();
  toast('✅ Demande enregistrée');
});

document.getElementById('d-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('d-id').value;
  if(!confirm('Supprimer cette demande ?')) return;
  state.demandes = state.demandes.filter(x=>x.id!==id);
  await persist();
  renderDemandes();
  closeDemandeModal();
  toast('🗑 Demande supprimée');
});

// ═══════════════════════ ARTISTES ═══════════════════════
function renderArtistes(){
  const list = document.getElementById('artistes-list');
  const items = [...state.artistes].sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">Aucun artiste. Clique sur "+ Ajouter un artiste".</div>';
    return;
  }
  list.innerHTML = items.map(a => `
    <div class="card" onclick="openArtisteModal('${a.id}')">
      <div class="avatar" style="${a.photoUrl?`background-image:url('${a.photoUrl}')`:''}">${a.photoUrl?'':(a.nom||'?')[0]}</div>
      <div class="card-main">
        <div class="card-title">${escapeHtml(a.nom)} <span class="badge badge-${a.statut}">${statutLabel(a.statut)}</span></div>
        <div class="card-sub">${escapeHtml(a.style||'')}</div>
      </div>
    </div>
  `).join('');
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
  document.getElementById('a-delete').style.display = a ? 'inline-block' : 'none';
  modal.classList.add('active');
}
function closeArtisteModal(){ document.getElementById('modal-artiste').classList.remove('active'); }

document.getElementById('a-save').addEventListener('click', async ()=>{
  const id = document.getElementById('a-id').value;
  const nom = document.getElementById('a-nom').value.trim();
  if(!nom){ toast("⚠️ Le nom d'artiste est obligatoire"); return; }
  const data = {
    nom,
    style: document.getElementById('a-style').value.trim(),
    bio: document.getElementById('a-bio').value.trim(),
    photoUrl: document.getElementById('a-photo').value.trim(),
    spotifyUrl: document.getElementById('a-spotify').value.trim(),
    youtubeUrl: document.getElementById('a-youtube').value.trim(),
    appleMusicUrl: document.getElementById('a-apple').value.trim(),
    deezerUrl: document.getElementById('a-deezer').value.trim(),
    paysEcoute: parseInt(document.getElementById('a-pays').value)||0,
    ordre: parseInt(document.getElementById('a-ordre').value)||0,
    statut: document.getElementById('a-statut').value
  };
  if(id){
    const idx = state.artistes.findIndex(x=>x.id===id);
    state.artistes[idx] = {...state.artistes[idx], ...data};
  } else {
    const slug = nom.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    state.artistes.push({ id: slug || ('a_'+Date.now()), ...data });
  }
  await persist();
  renderArtistes();
  closeArtisteModal();
  toast('✅ Artiste enregistré');
});

document.getElementById('a-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('a-id').value;
  if(!confirm('Supprimer cet artiste ?')) return;
  state.artistes = state.artistes.filter(x=>x.id!==id);
  await persist();
  renderArtistes();
  closeArtisteModal();
  toast('🗑 Artiste supprimé');
});

document.getElementById('btn-export').addEventListener('click', async ()=>{
  const result = await window.dupontAPI.exportArtistes(state.artistes);
  if(result && result.ok) toast('⇩ Fichier exporté : ' + result.path);
});

function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
