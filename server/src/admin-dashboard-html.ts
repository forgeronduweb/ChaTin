export const DASHBOARD_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ChaTin — Admin</title>
<link rel="icon" href="https://forgeronduweb.github.io/ChaTin/images/icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root {
    --cream: #F7F3E6; --paper: #EFEAD6; --ink: #161616; --ink-muted: #3A382F;
    --text-muted: #8C876F; --yellow: #F6C445; --pink: #F3A7C7; --green: #3FBE7A;
    --blue: #8EC5FC; --purple: #C9A7F3; --white: #FFFFFF; --red: #E0555A;
    --border: #E6E1D2;
    --radius-lg: 16px; --radius-md: 12px; --radius-sm: 10px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: 'Baloo 2', system-ui, sans-serif;
    background: var(--cream); color: var(--ink); display: flex; min-height: 100vh;
  }
  a { color: inherit; }
  svg { display: block; }

  /* Sidebar */
  .sidebar {
    width: 220px; flex-shrink: 0; background: var(--ink); color: var(--white);
    display: flex; flex-direction: column; padding: 20px 14px; position: sticky; top: 0; height: 100vh;
  }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 8px 10px 24px; }
  .sidebar-brand img { width: 32px; height: 32px; border-radius: 9px; }
  .sidebar-brand span { font-weight: 800; font-size: 16px; }
  .nav-item {
    display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: var(--radius-sm);
    font-weight: 600; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.55);
    margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left; font-family: inherit;
    transition: background .15s, color .15s;
  }
  .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.75; transition: opacity .15s, color .15s; }
  .nav-item:hover { color: var(--white); background: rgba(255,255,255,0.06); }
  .nav-item.active { background: rgba(255,255,255,0.09); color: var(--white); }
  .nav-item.active svg { opacity: 1; color: var(--accent, var(--yellow)); }
  .nav-badge {
    margin-left: auto; background: var(--red); color: var(--white);
    font-size: 10.5px; font-weight: 800; min-width: 18px; height: 18px; flex-shrink: 0;
    border-radius: 999px; display: none; align-items: center; justify-content: center; padding: 0 5px; line-height: 1;
  }
  .nav-badge.show { display: inline-flex; }

  /* Main */
  .main { flex: 1; min-width: 0; padding: 32px 36px 80px; }
  .view { display: none; }
  .view.active { display: block; }
  .view-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .view-title { font-size: 23px; font-weight: 800; margin: 0; }

  .search-input, .form-input, .form-select {
    font-family: inherit; border: 1px solid var(--border); background: var(--white);
    border-radius: var(--radius-sm); padding: 9px 16px; font-size: 14px; color: var(--ink); outline: none;
  }
  .search-input:focus, .form-input:focus, .form-select:focus { border-color: var(--ink); }
  .form-input, .form-select { width: 100%; }

  .btn {
    font-family: inherit; font-weight: 700; font-size: 13.5px; border-radius: var(--radius-sm); border: 1px solid transparent;
    padding: 9px 16px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background .15s, border-color .15s, color .15s;
  }
  .btn-primary { background: var(--yellow); color: var(--ink); }
  .btn-primary:hover { background: #ecb62a; }
  .btn-outline { background: var(--white); border-color: var(--border); color: var(--ink); }
  .btn-outline:hover { border-color: var(--ink); }
  .btn-danger { background: none; border-color: var(--border); color: var(--red); }
  .btn-danger:hover { background: var(--red); border-color: var(--red); color: var(--white); }
  .btn-sm { padding: 7px 14px; font-size: 12px; }
  .btn:disabled { opacity: 0.5; cursor: default; }

  /* Stats */
  .stat-section { margin-bottom: 26px; }
  .stat-section-title { font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 800; margin: 0 0 12px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
  .stat-card-head { display: flex; align-items: center; justify-content: space-between; }
  .stat-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--accent-bg); color: var(--accent); flex-shrink: 0; }
  .stat-icon svg { width: 16px; height: 16px; }
  .stat-card .value { font-size: 26px; font-weight: 800; line-height: 1.1; }
  .stat-card .label { font-size: 12.5px; color: var(--text-muted); font-weight: 600; }

  .card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 24px; }
  .card h3 { margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); font-weight: 700; }

  .chart { display: flex; align-items: flex-end; gap: 10px; height: 140px; }

  /* Report */
  .report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
  .chart-line-wrap { position: relative; }
  .chart-svg { width: 100%; height: 190px; display: block; overflow: visible; }
  .chart-tooltip {
    position: absolute; pointer-events: none; background: var(--ink); color: var(--white);
    font-size: 11.5px; font-weight: 700; padding: 6px 10px; border-radius: 8px; white-space: nowrap;
    transform: translate(-50%, -100%); opacity: 0; transition: opacity .1s; z-index: 5; top: 0; left: 0;
  }
  .chart-tooltip.show { opacity: 1; }
  .chart-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; }
  .chart-legend-item { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; color: var(--ink-muted); }
  .chart-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

  .rate-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .rate-card { flex: 1; min-width: 190px; background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px 20px; }
  .rate-card .value { font-size: 25px; font-weight: 800; }
  .rate-card .label { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 4px; }
  .rate-bar { height: 6px; border-radius: 999px; background: var(--paper); margin-top: 12px; overflow: hidden; }
  .rate-bar-fill { height: 100%; border-radius: 999px; }

  .donut-wrap { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
  .chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
  .chart-bar { width: 100%; max-width: 32px; background: var(--yellow); border-radius: 5px 5px 2px 2px; min-height: 4px; }
  .chart-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }

  /* Table */
  .panel { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 12px 20px; }
  thead th { color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; background: var(--cream); border-bottom: 1px solid var(--border); white-space: nowrap; }
  tbody tr:not(:last-child) td { border-bottom: 1px solid var(--border); }
  tbody tr:hover { background: rgba(22,22,22,0.015); }
  td { vertical-align: middle; }
  .user-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; background: var(--pink);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 10.5px; font-weight: 700; color: var(--ink); overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .muted { color: var(--text-muted); }
  .actions-cell { display: flex; gap: 8px; white-space: nowrap; }

  .badge { display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge-active { background: rgba(63,190,122,0.15); color: #1F8A50; }
  .badge-suspended { background: rgba(224,85,90,0.12); color: var(--red); }

  .empty, .loading { padding: 48px 24px; text-align: center; color: var(--text-muted); font-weight: 600; }

  /* Prompts grid */
  .prompts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .prompt-card {
    border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px;
    position: relative; min-height: 174px; box-shadow: 0 1px 3px rgba(22,22,22,0.07);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .prompt-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(22,22,22,0.14); }
  .prompt-card-body { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .prompt-category-pill {
    align-self: flex-start; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    background: rgba(22,22,22,0.14); color: rgba(22,22,22,0.78); padding: 3px 10px; border-radius: 999px;
  }
  .prompt-title {
    font-weight: 700; font-size: 15.5px; line-height: 1.35; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .prompt-author {
    font-size: 12px; color: rgba(22,22,22,0.6); font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .prompt-actions { display: flex; gap: 8px; margin-top: 2px; }
  .prompt-actions .btn { flex: 1; justify-content: center; }
  .btn-prompt-delete { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .btn-prompt-delete:hover { background: #000; border-color: #000; }
  .prompt-featured { position: absolute; top: 14px; right: 14px; font-size: 10.5px; font-weight: 700; background: var(--ink); color: var(--white); padding: 3px 10px; border-radius: 999px; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(22,22,22,0.5); display: none;
    align-items: center; justify-content: center; padding: 20px; z-index: 50;
  }
  .modal-overlay.open { display: flex; }
  .modal {
    background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 26px;
    width: 100%; max-width: 480px; max-height: 85vh; overflow-y: auto;
  }
  .modal h2 { margin: 0 0 20px; font-size: 18px; }
  .modal-close { float: right; background: none; border: none; padding: 4px; cursor: pointer; color: var(--text-muted); font-family: inherit; border-radius: 6px; }
  .modal-close:hover { color: var(--ink); background: rgba(22,22,22,0.06); }
  .modal-close svg { width: 16px; height: 16px; }
  .form-row { margin-bottom: 14px; }
  .form-row label { display: block; font-size: 12px; font-weight: 700; color: var(--ink-muted); margin-bottom: 6px; }
  .color-swatches { display: flex; gap: 8px; margin-top: 6px; }
  .swatch { width: 26px; height: 26px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; }
  .swatch.selected { border-color: var(--ink); }
  .checkbox-row { display: flex; align-items: center; gap: 8px; }
  .checkbox-row label { margin: 0; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 24px; }

  .msg-list { display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto; }
  .msg-wrap { display: flex; flex-direction: column; gap: 4px; max-width: 85%; }
  .msg-wrap.msg-wrap-me { align-self: flex-end; align-items: flex-end; }
  .msg-bubble { padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.4; }
  .msg-me { background: var(--white); border: 1px solid var(--border); }
  .msg-bot { background: var(--paper); }
  .msg-attachment {
    display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600;
    color: var(--ink-muted); background: var(--cream); border: 1px solid var(--border);
    border-radius: 999px; padding: 3px 10px;
  }
  .msg-reaction { font-size: 12px; font-weight: 700; }
  .msg-reaction-like { color: var(--green); }
  .msg-reaction-dislike { color: var(--red); }
</style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="https://forgeronduweb.github.io/ChaTin/images/icon.png" alt="ChaTin" />
      <span>ChaTin</span>
    </div>
    <button class="nav-item active" data-view="home" style="--accent:#F6C445">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
      Accueil
    </button>
    <button class="nav-item" data-view="users" style="--accent:#F3A7C7">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Utilisateurs
      <span class="nav-badge" id="badge-users">0</span>
    </button>
    <button class="nav-item" data-view="conversations" style="--accent:#3FBE7A">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Conversations
    </button>
    <button class="nav-item" data-view="prompts" style="--accent:#C9A7F3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>
      Prompts
    </button>
    <button class="nav-item" data-view="updates" style="--accent:#8EC5FC">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
      Mises à jour
    </button>
    <button class="nav-item" data-view="feedback" style="--accent:#3FBE7A">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      Retours
      <span class="nav-badge" id="badge-feedback">0</span>
    </button>
    <button class="nav-item" data-view="report" style="--accent:#8EC5FC">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-3-3L4.3 16.4"/></svg>
      Rapport
    </button>
  </aside>

  <main class="main">
    <!-- Accueil -->
    <section class="view active" id="view-home">
      <div class="view-header"><h1 class="view-title">Accueil</h1></div>

      <div class="stat-section">
        <p class="stat-section-title">Utilisateurs inscrits</p>
        <div class="stats">
          <div class="stat-card" style="--accent:#C9822B;--accent-bg:rgba(246,196,69,.16)">
            <div class="stat-card-head">
              <span class="label">Total inscrits</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            </div>
            <div class="value" id="stat-totalUsers">—</div>
          </div>
          <div class="stat-card" style="--accent:#238C56;--accent-bg:rgba(63,190,122,.16)">
            <div class="stat-card-head">
              <span class="label">Nouveaux aujourd'hui</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg></span>
            </div>
            <div class="value" id="stat-newUsersToday">—</div>
          </div>
          <div class="stat-card" style="--accent:#238C56;--accent-bg:rgba(63,190,122,.16)">
            <div class="stat-card-head">
              <span class="label">Nouveaux cette semaine</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
            </div>
            <div class="value" id="stat-newUsersWeek">—</div>
          </div>
          <div class="stat-card" style="--accent:#238C56;--accent-bg:rgba(63,190,122,.16)">
            <div class="stat-card-head">
              <span class="label">Nouveaux ce mois</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></svg></span>
            </div>
            <div class="value" id="stat-newUsersMonth">—</div>
          </div>
          <div class="stat-card" style="--accent:#238C56;--accent-bg:rgba(63,190,122,.16)">
            <div class="stat-card-head">
              <span class="label">Nouveaux cette année</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
            </div>
            <div class="value" id="stat-newUsersYear">—</div>
          </div>
        </div>
      </div>

      <div class="stat-section">
        <p class="stat-section-title">Utilisation de l'application</p>
        <div class="stats">
          <div class="stat-card" style="--accent:#C1568A;--accent-bg:rgba(243,167,199,.2)">
            <div class="stat-card-head">
              <span class="label">Actifs aujourd'hui</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
            </div>
            <div class="value" id="stat-activeUsersToday">—</div>
          </div>
          <div class="stat-card" style="--accent:#C1568A;--accent-bg:rgba(243,167,199,.2)">
            <div class="stat-card-head">
              <span class="label">Actifs cette semaine</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
            </div>
            <div class="value" id="stat-activeUsersWeek">—</div>
          </div>
          <div class="stat-card" style="--accent:#3E7FBF;--accent-bg:rgba(142,197,252,.22)">
            <div class="stat-card-head">
              <span class="label">Utilisateurs actifs (total)</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            </div>
            <div class="value" id="stat-usersWithActivity">—</div>
          </div>
          <div class="stat-card" style="--accent:#7C4FBF;--accent-bg:rgba(201,167,243,.22)">
            <div class="stat-card-head">
              <span class="label">Prompts générés</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg></span>
            </div>
            <div class="value" id="stat-totalPrompts">—</div>
          </div>
          <div class="stat-card" style="--accent:#7C4FBF;--accent-bg:rgba(201,167,243,.22)">
            <div class="stat-card-head">
              <span class="label">Messages aujourd'hui</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
            </div>
            <div class="value" id="stat-messagesToday">—</div>
          </div>
          <div class="stat-card" style="--accent:#7C4FBF;--accent-bg:rgba(201,167,243,.22)">
            <div class="stat-card-head">
              <span class="label">Messages au total</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
            </div>
            <div class="value" id="stat-totalMessages">—</div>
          </div>
        </div>
      </div>

      <div class="stat-section">
        <p class="stat-section-title">Inscrits vs invités</p>
        <div class="stats">
          <div class="stat-card" style="--accent:#3E7FBF;--accent-bg:rgba(142,197,252,.22)">
            <div class="stat-card-head">
              <span class="label">Conversations totales</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            </div>
            <div class="value" id="stat-conversationCount">—</div>
          </div>
          <div class="stat-card" style="--accent:#238C56;--accent-bg:rgba(63,190,122,.16)">
            <div class="stat-card-head">
              <span class="label">Conv. par inscrits</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
            </div>
            <div class="value" id="stat-registeredConversations">—</div>
          </div>
          <div class="stat-card" style="--accent:#C9822B;--accent-bg:rgba(246,196,69,.16)">
            <div class="stat-card-head">
              <span class="label">Conv. par invités</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
            </div>
            <div class="value" id="stat-guestConversations">—</div>
          </div>
          <div class="stat-card" style="--accent:#C1568A;--accent-bg:rgba(243,167,199,.2)">
            <div class="stat-card-head">
              <span class="label">Retours reçus</span>
              <span class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
            </div>
            <div class="value" id="stat-totalFeedbackCount">—</div>
          </div>
        </div>
        <div class="rate-card" style="max-width:420px">
          <span class="label">Part des conversations démarrées par un utilisateur inscrit</span>
          <div class="rate-bar"><div class="rate-bar-fill" id="home-registered-bar" style="width:0%;background:#2a78d6"></div></div>
        </div>
      </div>

      <div class="card">
        <h3>Activité — messages envoyés (7 derniers jours)</h3>
        <div class="chart" id="chart"></div>
      </div>
    </section>

    <!-- Utilisateurs -->
    <section class="view" id="view-users">
      <div class="view-header">
        <h1 class="view-title">Utilisateurs</h1>
        <input class="search-input" id="users-search" placeholder="Rechercher un nom…" />
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr><th>Utilisateur</th><th>Email</th><th>Appareil</th><th>Inscrit le</th><th>Dernière connexion</th><th>Conv.</th><th>Msgs</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody id="users-body"></tbody>
        </table>
        <div class="loading" id="users-loading">Chargement…</div>
        <div class="empty" id="users-empty" style="display:none">Aucun utilisateur.</div>
      </div>
    </section>

    <!-- Conversations -->
    <section class="view" id="view-conversations">
      <div class="view-header">
        <h1 class="view-title">Conversations</h1>
        <input class="search-input" id="conv-search" placeholder="Rechercher un titre…" />
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr><th>Titre</th><th>Utilisateur</th><th>Date</th><th>Messages</th><th></th></tr>
          </thead>
          <tbody id="conv-body"></tbody>
        </table>
        <div class="loading" id="conv-loading">Chargement…</div>
        <div class="empty" id="conv-empty" style="display:none">Aucune conversation.</div>
      </div>
    </section>

    <!-- Prompts -->
    <section class="view" id="view-prompts">
      <div class="view-header">
        <h1 class="view-title">Prompts</h1>
        <button class="btn btn-primary" id="add-prompt-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M12 5v14M5 12h14"/></svg>
          Ajouter un prompt
        </button>
      </div>
      <div class="prompts-grid" id="prompts-grid"></div>
      <div class="loading" id="prompts-loading">Chargement…</div>
      <div class="empty" id="prompts-empty" style="display:none">Aucun prompt pour le moment.</div>
    </section>

    <!-- Mises à jour -->
    <section class="view" id="view-updates">
      <div class="view-header">
        <h1 class="view-title">Mises à jour</h1>
        <button class="btn btn-primary" id="add-release-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M12 5v14M5 12h14"/></svg>
          Publier une version
        </button>
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr><th>Version</th><th>Code</th><th>Publiée le</th><th>Type</th><th></th></tr>
          </thead>
          <tbody id="releases-body"></tbody>
        </table>
        <div class="loading" id="releases-loading">Chargement…</div>
        <div class="empty" id="releases-empty" style="display:none">Aucune version publiée.</div>
      </div>
    </section>

    <!-- Retours -->
    <section class="view" id="view-feedback">
      <div class="view-header">
        <h1 class="view-title">Retours</h1>
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr><th>Message</th><th>Utilisateur</th><th>Version</th><th>Date</th><th></th></tr>
          </thead>
          <tbody id="feedback-body"></tbody>
        </table>
        <div class="loading" id="feedback-loading">Chargement…</div>
        <div class="empty" id="feedback-empty" style="display:none">Aucun retour pour le moment.</div>
      </div>
    </section>

    <!-- Rapport -->
    <section class="view" id="view-report">
      <div class="view-header"><h1 class="view-title">Rapport</h1></div>

      <div class="rate-row">
        <div class="rate-card">
          <span class="value" id="rate-registration">—</span>
          <div class="label">Taux d'inscription (conv. par inscrits)</div>
          <div class="rate-bar"><div class="rate-bar-fill" id="rate-registration-bar" style="background:#2a78d6"></div></div>
        </div>
        <div class="rate-card">
          <span class="value" id="rate-activity">—</span>
          <div class="label">Taux d'activité (actifs cette semaine)</div>
          <div class="rate-bar"><div class="rate-bar-fill" id="rate-activity-bar" style="background:#008300"></div></div>
        </div>
        <div class="rate-card">
          <span class="value" id="rate-prompts">—</span>
          <div class="label">Prompts générés au total</div>
        </div>
        <div class="rate-card">
          <span class="value" id="rate-feedback">—</span>
          <div class="label">Retours reçus au total</div>
        </div>
      </div>

      <div class="report-grid">
        <div class="card" style="margin-bottom:0">
          <h3>Évolution des inscriptions (30 derniers jours)</h3>
          <div class="chart-line-wrap" id="chart-registrations"></div>
        </div>
        <div class="card" style="margin-bottom:0">
          <h3>Évolution de l'utilisation — messages (30 derniers jours)</h3>
          <div class="chart-line-wrap" id="chart-usage"></div>
        </div>
        <div class="card" style="margin-bottom:0">
          <h3>Inscrits vs invités</h3>
          <div class="donut-wrap" id="donut-registered"></div>
        </div>
      </div>
    </section>
  </main>

  <!-- Conversation detail modal -->
  <div class="modal-overlay" id="conv-modal">
    <div class="modal">
      <button class="modal-close" data-close="conv-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2 id="conv-modal-title">Conversation</h2>
      <div class="msg-list" id="conv-modal-messages"></div>
    </div>
  </div>

  <!-- Prompt form modal -->
  <div class="modal-overlay" id="prompt-modal">
    <div class="modal">
      <button class="modal-close" data-close="prompt-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2 id="prompt-modal-title">Ajouter un prompt</h2>
      <form id="prompt-form">
        <input type="hidden" id="prompt-id" />
        <div class="form-row">
          <label for="prompt-title">Titre</label>
          <input class="form-input" id="prompt-title" required />
        </div>
        <div class="form-row">
          <label for="prompt-author">Auteur</label>
          <input class="form-input" id="prompt-author" placeholder="Optionnel" />
        </div>
        <div class="form-row">
          <label for="prompt-category">Catégorie</label>
          <input class="form-input" id="prompt-category" placeholder="Ex: Cuisine, Productivité…" />
        </div>
        <div class="form-row">
          <label>Couleur</label>
          <div class="color-swatches" id="color-swatches"></div>
          <input type="hidden" id="prompt-color" value="#F3A7C7" />
        </div>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="prompt-featured" />
          <label for="prompt-featured">Mettre en vedette (visible sur l'accueil de l'app)</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-close="prompt-modal">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Release upload modal -->
  <div class="modal-overlay" id="release-modal">
    <div class="modal">
      <button class="modal-close" data-close="release-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2>Publier une version</h2>
      <form id="release-form">
        <div class="form-row">
          <label for="release-apk">Fichier APK</label>
          <input class="form-input" id="release-apk" type="file" accept=".apk" required />
        </div>
        <div class="form-row">
          <label for="release-version">Version (ex: 1.4.0)</label>
          <input class="form-input" id="release-version" required />
        </div>
        <div class="form-row">
          <label for="release-version-code">Code de version (android.versionCode utilisé pour ce build)</label>
          <input class="form-input" id="release-version-code" type="number" min="1" step="1" required />
        </div>
        <div class="form-row">
          <label for="release-notes">Notes (optionnel)</label>
          <input class="form-input" id="release-notes" placeholder="Ce qui a changé dans cette version" />
        </div>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="release-mandatory" />
          <label for="release-mandatory">Mise à jour obligatoire</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-close="release-modal">Annuler</button>
          <button type="submit" class="btn btn-primary" id="release-submit-btn">Publier</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const COLORS = ['#F6C445', '#F3A7C7', '#3FBE7A', '#8EC5FC', '#C9A7F3'];
    const PALETTE = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948'];

    // ---------- Navigation ----------
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('view-' + btn.dataset.view).classList.add('active');

        if (btn.dataset.view === 'users' || btn.dataset.view === 'feedback') {
          markNotificationRead(btn.dataset.view);
        }
        if (btn.dataset.view === 'report') {
          loadReport();
        }
      });
    });

    // ---------- Notifications ----------
    async function loadNotifications() {
      const res = await fetch('/admin/api/notifications');
      const counts = await res.json();
      updateBadge('badge-users', counts.users);
      updateBadge('badge-feedback', counts.feedback);
    }

    function updateBadge(id, value) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value > 99 ? '99+' : String(value);
      el.classList.toggle('show', value > 0);
    }

    async function markNotificationRead(key) {
      const badgeId = 'badge-' + key;
      const el = document.getElementById(badgeId);
      if (el && !el.classList.contains('show')) return;
      updateBadge(badgeId, 0);
      await fetch('/admin/api/notifications/' + key + '/read', { method: 'POST' });
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str ?? '';
      return div.innerHTML;
    }
    function initials(name) {
      return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }
    function fmtDate(iso) {
      if (!iso) return '—';
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ---------- Home ----------
    async function loadStats() {
      const res = await fetch('/admin/api/stats');
      const data = await res.json();
      [
        'totalUsers', 'newUsersToday', 'newUsersWeek', 'newUsersMonth', 'newUsersYear',
        'activeUsersToday', 'activeUsersWeek', 'usersWithActivity', 'totalPrompts',
        'messagesToday', 'totalMessages', 'conversationCount', 'registeredConversations',
        'guestConversations', 'totalFeedbackCount',
      ].forEach((key) => {
        const el = document.getElementById('stat-' + key);
        if (el) el.textContent = data[key];
      });

      const registeredPct = data.conversationCount > 0
        ? Math.round((data.registeredConversations / data.conversationCount) * 100)
        : 0;
      document.getElementById('home-registered-bar').style.width = registeredPct + '%';

      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const byDay = Object.fromEntries(data.activity.map((row) => [row.day, Number(row.count)]));
      const max = Math.max(1, ...days.map((d) => byDay[d] || 0));
      const chart = document.getElementById('chart');
      chart.innerHTML = days.map((d) => {
        const val = byDay[d] || 0;
        const pct = Math.max(4, Math.round((val / max) * 100));
        const label = new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' });
        return \`<div class="chart-bar-wrap"><div class="chart-bar" style="height:\${pct}%" title="\${val} messages"></div><div class="chart-label">\${label}</div></div>\`;
      }).join('');
    }

    // ---------- Rapport ----------
    let reportLoaded = false;
    async function loadReport() {
      if (reportLoaded) return;
      reportLoaded = true;
      const res = await fetch('/admin/api/report');
      const data = await res.json();

      document.getElementById('rate-registration').textContent = data.registrationRate.toFixed(1) + '%';
      document.getElementById('rate-registration-bar').style.width = Math.min(100, data.registrationRate) + '%';
      document.getElementById('rate-activity').textContent = data.activityRate.toFixed(1) + '%';
      document.getElementById('rate-activity-bar').style.width = Math.min(100, data.activityRate) + '%';
      document.getElementById('rate-prompts').textContent = data.totalPrompts;
      document.getElementById('rate-feedback').textContent = data.totalFeedbackCount;

      renderLineChart('chart-registrations', data.registrationTrend, PALETTE[0], 'inscriptions');
      renderLineChart('chart-usage', data.usageTrend, PALETTE[1], 'messages');
      renderDonut('donut-registered', data.registeredVsGuest);
    }

    function buildDayRange(n) {
      const days = [];
      const today = new Date();
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      return days;
    }

    function renderLineChart(wrapId, rows, color, unitLabel) {
      const days = buildDayRange(30);
      const byDay = Object.fromEntries(rows.map((r) => [r.day, Number(r.count)]));
      const values = days.map((d) => byDay[d] || 0);
      const max = Math.max(1, ...values);
      const w = 600, h = 190, pad = 12;
      const stepX = (w - pad * 2) / (values.length - 1);
      const points = values.map((v, i) => ({
        x: pad + i * stepX,
        y: h - pad - (v / max) * (h - pad * 2),
        v,
        day: days[i],
      }));
      const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
      const last = points[points.length - 1];
      const first = points[0];
      const areaPath = linePath + \` L\${last.x.toFixed(1)},\${h - pad} L\${first.x.toFixed(1)},\${h - pad} Z\`;

      const wrap = document.getElementById(wrapId);
      wrap.innerHTML = \`
        <svg class="chart-svg" viewBox="0 0 \${w} \${h}" preserveAspectRatio="none">
          <path d="\${areaPath}" fill="\${color}" opacity="0.1" stroke="none"></path>
          <path d="\${linePath}" fill="none" stroke="\${color}" stroke-width="2.5"></path>
          \${points.map((p) => \`<circle cx="\${p.x.toFixed(1)}" cy="\${p.y.toFixed(1)}" r="10" fill="transparent" class="chart-hit" data-i="\${p.day}"></circle>\`).join('')}
        </svg>
        <div class="chart-tooltip" id="\${wrapId}-tooltip"></div>
        <div class="chart-legend">
          <span class="chart-legend-item"><span class="chart-legend-dot" style="background:\${color}"></span>\${unitLabel} par jour</span>
        </div>\`;

      const svg = wrap.querySelector('svg');
      const tooltip = document.getElementById(wrapId + '-tooltip');
      wrap.querySelectorAll('.chart-hit').forEach((circle, i) => {
        circle.addEventListener('mouseenter', () => {
          const p = points[i];
          const rect = svg.getBoundingClientRect();
          tooltip.style.left = ((p.x / w) * rect.width) + 'px';
          tooltip.style.top = ((p.y / h) * rect.height) + 'px';
          tooltip.textContent = new Date(p.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' — ' + p.v + ' ' + unitLabel;
          tooltip.classList.add('show');
        });
        circle.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
      });
    }

    function renderDonut(containerId, counts) {
      const total = counts.registered + counts.guest;
      const registeredPct = total > 0 ? counts.registered / total : 0;
      const r = 62, sw = 24, c = 2 * Math.PI * r;
      const regLen = c * registeredPct;
      const cx = 76, cy = 76;

      const wrap = document.getElementById(containerId);
      wrap.innerHTML = \`
        <svg width="152" height="152" viewBox="0 0 152 152">
          <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="\${PALETTE[1]}" stroke-width="\${sw}"></circle>
          <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="\${PALETTE[0]}" stroke-width="\${sw}"
            stroke-dasharray="\${regLen.toFixed(1)} \${(c - regLen).toFixed(1)}" stroke-linecap="butt"
            transform="rotate(-90 \${cx} \${cy})"></circle>
          <text x="\${cx}" y="\${cy - 3}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--ink)">\${total}</text>
          <text x="\${cx}" y="\${cy + 15}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-muted)">conversations</text>
        </svg>
        <div class="chart-legend" style="flex-direction:column;gap:10px;margin-top:0">
          <span class="chart-legend-item"><span class="chart-legend-dot" style="background:\${PALETTE[0]}"></span>Inscrits — \${counts.registered} (\${Math.round(registeredPct * 100)}%)</span>
          <span class="chart-legend-item"><span class="chart-legend-dot" style="background:\${PALETTE[1]}"></span>Invités — \${counts.guest} (\${Math.round(100 - registeredPct * 100)}%)</span>
        </div>\`;
    }

    // ---------- Users ----------
    let usersSearchTimer;
    document.getElementById('users-search').addEventListener('input', (e) => {
      clearTimeout(usersSearchTimer);
      usersSearchTimer = setTimeout(() => loadUsers(e.target.value), 300);
    });

    async function loadUsers(search) {
      const url = '/admin/api/users' + (search ? '?search=' + encodeURIComponent(search) : '');
      const res = await fetch(url);
      const users = await res.json();
      const body = document.getElementById('users-body');
      document.getElementById('users-loading').style.display = 'none';
      document.getElementById('users-empty').style.display = users.length === 0 ? 'block' : 'none';
      body.innerHTML = users.map((u) => {
        const avatar = u.avatarUrl
          ? \`<span class="avatar"><img src="\${u.avatarUrl}" alt="" /></span>\`
          : \`<span class="avatar">\${initials(u.name)}</span>\`;
        const statusBadge = u.status === 'suspended'
          ? '<span class="badge badge-suspended">Suspendu</span>'
          : '<span class="badge badge-active">Actif</span>';
        const toggleBtn = u.status === 'suspended'
          ? \`<button class="btn btn-outline btn-sm" data-action="reactivate" data-id="\${u.id}">Réactiver</button>\`
          : \`<button class="btn btn-outline btn-sm" data-action="suspend" data-id="\${u.id}">Suspendre</button>\`;
        const device = u.deviceModel
          ? escapeHtml(u.deviceModel) + (u.osVersion ? ' · Android ' + escapeHtml(u.osVersion) : '')
          : '—';
        return \`<tr>
          <td><div class="user-cell">\${avatar}\${escapeHtml(u.name)}</div></td>
          <td class="muted">\${escapeHtml(u.email)}</td>
          <td class="muted">\${device}</td>
          <td class="muted">\${fmtDate(u.createdAt)}</td>
          <td class="muted">\${fmtDate(u.lastLoginAt)}</td>
          <td>\${u.conversationCount}</td>
          <td>\${u.messageCount}</td>
          <td>\${statusBadge}</td>
          <td><div class="actions-cell">\${toggleBtn}<button class="btn btn-danger btn-sm" data-action="delete-user" data-id="\${u.id}">Supprimer</button></div></td>
        </tr>\`;
      }).join('');

      body.querySelectorAll('[data-action="suspend"]').forEach((b) => b.addEventListener('click', () => userAction(b.dataset.id, 'suspend')));
      body.querySelectorAll('[data-action="reactivate"]').forEach((b) => b.addEventListener('click', () => userAction(b.dataset.id, 'reactivate')));
      body.querySelectorAll('[data-action="delete-user"]').forEach((b) => b.addEventListener('click', () => deleteUserRow(b)));
    }

    async function userAction(id, action) {
      await fetch('/admin/api/users/' + id + '/' + action, { method: 'POST' });
      loadUsers(document.getElementById('users-search').value);
      loadStats();
    }

    async function deleteUserRow(btn) {
      if (!confirm('Supprimer cet utilisateur et toutes ses conversations ?')) return;
      btn.disabled = true;
      await fetch('/admin/api/users/' + btn.dataset.id, { method: 'DELETE' });
      loadUsers(document.getElementById('users-search').value);
      loadStats();
    }

    // ---------- Conversations ----------
    let convSearchTimer;
    document.getElementById('conv-search').addEventListener('input', (e) => {
      clearTimeout(convSearchTimer);
      convSearchTimer = setTimeout(() => loadConversations(e.target.value), 300);
    });

    async function loadConversations(search) {
      const url = '/admin/api/conversations' + (search ? '?search=' + encodeURIComponent(search) : '');
      const res = await fetch(url);
      const rows = await res.json();
      const body = document.getElementById('conv-body');
      document.getElementById('conv-loading').style.display = 'none';
      document.getElementById('conv-empty').style.display = rows.length === 0 ? 'block' : 'none';
      body.innerHTML = rows.map((c) => \`
        <tr>
          <td>\${escapeHtml(c.title)}</td>
          <td class="muted">\${c.userName ? escapeHtml(c.userName) : 'Invité'}</td>
          <td class="muted">\${fmtDate(c.createdAt)}</td>
          <td>\${c.messageCount}</td>
          <td><div class="actions-cell">
            <button class="btn btn-outline btn-sm" data-action="open-conv" data-id="\${c.id}">Ouvrir</button>
            <button class="btn btn-danger btn-sm" data-action="delete-conv" data-id="\${c.id}">Supprimer</button>
          </div></td>
        </tr>\`).join('');

      body.querySelectorAll('[data-action="open-conv"]').forEach((b) => b.addEventListener('click', () => openConversation(b.dataset.id)));
      body.querySelectorAll('[data-action="delete-conv"]').forEach((b) => b.addEventListener('click', () => deleteConversationRow(b)));
    }

    async function openConversation(id) {
      if (!confirm("Vous allez consulter les messages privés d'un utilisateur. Continuer ?")) return;
      const res = await fetch('/admin/api/conversations/' + id);
      const conv = await res.json();
      document.getElementById('conv-modal-title').textContent = conv.title;
      document.getElementById('conv-modal-messages').innerHTML = conv.messages.map((m) => \`
        <div class="msg-wrap \${m.from === 'me' ? 'msg-wrap-me' : ''}">
          \${m.attachmentName ? \`<span class="msg-attachment">📎 \${escapeHtml(m.attachmentName)}</span>\` : ''}
          <div class="msg-bubble \${m.from === 'me' ? 'msg-me' : 'msg-bot'}">\${escapeHtml(m.text)}</div>
          \${m.reaction === 'like' ? '<span class="msg-reaction msg-reaction-like">👍 Aimé</span>' : ''}
          \${m.reaction === 'dislike' ? '<span class="msg-reaction msg-reaction-dislike">👎 Pas aimé</span>' : ''}
        </div>\`
      ).join('') || '<p class="muted">Aucun message.</p>';
      openModal('conv-modal');
    }

    async function deleteConversationRow(btn) {
      if (!confirm('Supprimer cette conversation ?')) return;
      btn.disabled = true;
      await fetch('/admin/api/conversations/' + btn.dataset.id, { method: 'DELETE' });
      loadConversations(document.getElementById('conv-search').value);
      loadStats();
    }

    // ---------- Prompts ----------
    async function loadPrompts() {
      const res = await fetch('/admin/api/prompts');
      const prompts = await res.json();
      const grid = document.getElementById('prompts-grid');
      document.getElementById('prompts-loading').style.display = 'none';
      document.getElementById('prompts-empty').style.display = prompts.length === 0 ? 'block' : 'none';
      grid.innerHTML = prompts.map((p) => \`
        <div class="prompt-card" style="background:\${p.color}">
          \${p.featured ? '<span class="prompt-featured">Vedette</span>' : ''}
          <div class="prompt-card-body">
            \${p.category ? \`<span class="prompt-category-pill">\${escapeHtml(p.category)}</span>\` : ''}
            <p class="prompt-title" title="\${escapeHtml(p.title)}">\${escapeHtml(p.title)}</p>
            \${p.author ? \`<span class="prompt-author">\${escapeHtml(p.author)}</span>\` : ''}
          </div>
          <div class="prompt-actions">
            <button class="btn btn-outline btn-sm" data-action="edit-prompt" data-id="\${p.id}">Modifier</button>
            <button class="btn btn-prompt-delete btn-sm" data-action="delete-prompt" data-id="\${p.id}">Supprimer</button>
          </div>
        </div>\`).join('');

      grid.querySelectorAll('[data-action="edit-prompt"]').forEach((b) => b.addEventListener('click', () => editPrompt(prompts.find((p) => p.id === b.dataset.id))));
      grid.querySelectorAll('[data-action="delete-prompt"]').forEach((b) => b.addEventListener('click', () => deletePromptCard(b)));
    }

    function renderSwatches(selected) {
      const wrap = document.getElementById('color-swatches');
      wrap.innerHTML = COLORS.map((c) =>
        \`<span class="swatch \${c === selected ? 'selected' : ''}" style="background:\${c}" data-color="\${c}"></span>\`
      ).join('');
      wrap.querySelectorAll('.swatch').forEach((s) => {
        s.addEventListener('click', () => {
          wrap.querySelectorAll('.swatch').forEach((el) => el.classList.remove('selected'));
          s.classList.add('selected');
          document.getElementById('prompt-color').value = s.dataset.color;
        });
      });
    }

    document.getElementById('add-prompt-btn').addEventListener('click', () => {
      document.getElementById('prompt-modal-title').textContent = 'Ajouter un prompt';
      document.getElementById('prompt-form').reset();
      document.getElementById('prompt-id').value = '';
      document.getElementById('prompt-color').value = COLORS[0];
      renderSwatches(COLORS[0]);
      openModal('prompt-modal');
    });

    function editPrompt(p) {
      document.getElementById('prompt-modal-title').textContent = 'Modifier le prompt';
      document.getElementById('prompt-id').value = p.id;
      document.getElementById('prompt-title').value = p.title;
      document.getElementById('prompt-author').value = p.author || '';
      document.getElementById('prompt-category').value = p.category || '';
      document.getElementById('prompt-featured').checked = p.featured;
      document.getElementById('prompt-color').value = p.color;
      renderSwatches(p.color);
      openModal('prompt-modal');
    }

    document.getElementById('prompt-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('prompt-id').value;
      const payload = {
        title: document.getElementById('prompt-title').value,
        author: document.getElementById('prompt-author').value,
        category: document.getElementById('prompt-category').value,
        color: document.getElementById('prompt-color').value,
        featured: document.getElementById('prompt-featured').checked,
      };
      await fetch(id ? '/admin/api/prompts/' + id : '/admin/api/prompts', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      closeModal('prompt-modal');
      loadPrompts();
    });

    async function deletePromptCard(btn) {
      if (!confirm('Supprimer ce prompt ?')) return;
      btn.disabled = true;
      await fetch('/admin/api/prompts/' + btn.dataset.id, { method: 'DELETE' });
      loadPrompts();
    }

    // ---------- Releases ----------
    async function loadReleases() {
      const res = await fetch('/admin/api/releases');
      const releases = await res.json();
      const body = document.getElementById('releases-body');
      document.getElementById('releases-loading').style.display = 'none';
      document.getElementById('releases-empty').style.display = releases.length === 0 ? 'block' : 'none';
      body.innerHTML = releases.map((r) => \`
        <tr>
          <td><a href="\${r.apkUrl}" target="_blank" rel="noopener">\${escapeHtml(r.version)}</a></td>
          <td class="muted">\${r.versionCode}</td>
          <td class="muted">\${fmtDate(r.createdAt)}</td>
          <td>\${r.mandatory ? '<span class="badge badge-suspended">Obligatoire</span>' : '<span class="badge badge-active">Optionnelle</span>'}</td>
          <td><div class="actions-cell">
            <button class="btn btn-danger btn-sm" data-action="delete-release" data-id="\${r.id}">Supprimer</button>
          </div></td>
        </tr>\`).join('');

      body.querySelectorAll('[data-action="delete-release"]').forEach((b) => b.addEventListener('click', () => deleteReleaseRow(b)));
    }

    document.getElementById('add-release-btn').addEventListener('click', () => {
      document.getElementById('release-form').reset();
      openModal('release-modal');
    });

    document.getElementById('release-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = document.getElementById('release-apk').files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('apk', file);
      formData.append('version', document.getElementById('release-version').value);
      formData.append('versionCode', document.getElementById('release-version-code').value);
      formData.append('notes', document.getElementById('release-notes').value);
      formData.append('mandatory', document.getElementById('release-mandatory').checked);

      const submitBtn = document.getElementById('release-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi…';
      try {
        const res = await fetch('/admin/api/releases', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const release = await res.json();
        closeModal('release-modal');
        loadReleases();
        if (release.githubError) {
          alert(
            "La mise à jour a bien été publiée pour l'app (les utilisateurs seront notifiés), " +
            "mais l'envoi vers GitHub Releases a échoué : le bouton de téléchargement de la landing page " +
            "ne pointera pas vers cette version.\\n\\nDétail : " + release.githubError,
          );
        }
      } catch {
        alert("Échec de l'envoi de l'APK. Vérifiez la configuration du stockage.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publier';
      }
    });

    async function deleteReleaseRow(btn) {
      if (!confirm('Supprimer cette version ? Le fichier restera dans le stockage.')) return;
      btn.disabled = true;
      await fetch('/admin/api/releases/' + btn.dataset.id, { method: 'DELETE' });
      loadReleases();
    }

    // ---------- Retours ----------
    async function loadFeedback() {
      const res = await fetch('/admin/api/feedback');
      const rows = await res.json();
      const body = document.getElementById('feedback-body');
      document.getElementById('feedback-loading').style.display = 'none';
      document.getElementById('feedback-empty').style.display = rows.length === 0 ? 'block' : 'none';
      body.innerHTML = rows.map((f) => \`
        <tr>
          <td style="max-width:420px;white-space:normal">\${escapeHtml(f.message)}</td>
          <td class="muted">\${f.userName ? escapeHtml(f.userName) + (f.userEmail ? ' · ' + escapeHtml(f.userEmail) : '') : 'Invité'}</td>
          <td class="muted">\${f.appVersion ? escapeHtml(f.appVersion) : '—'}</td>
          <td class="muted">\${fmtDate(f.createdAt)}</td>
          <td><button class="btn btn-danger btn-sm" data-action="delete-feedback" data-id="\${f.id}">Supprimer</button></td>
        </tr>\`).join('');

      body.querySelectorAll('[data-action="delete-feedback"]').forEach((b) => b.addEventListener('click', () => deleteFeedbackRow(b)));
    }

    async function deleteFeedbackRow(btn) {
      if (!confirm('Supprimer ce retour ?')) return;
      btn.disabled = true;
      await fetch('/admin/api/feedback/' + btn.dataset.id, { method: 'DELETE' });
      loadFeedback();
    }

    // ---------- Modals ----------
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    });

    // ---------- Init ----------
    loadStats();
    loadNotifications();
    loadUsers();
    loadConversations();
    loadPrompts();
    loadReleases();
    loadFeedback();
  </script>
</body>
</html>`;
