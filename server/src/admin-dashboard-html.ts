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
  /* Prompts (and the overview/report pages) aren't tables - there's no
     thead to freeze - so what "frozen header" means there is this title
     bar staying put while the page scrolls past long content underneath
     it (e.g. the Prompts card grid). Sticky here works with a plain page
     scroll with no extra wrapper needed, unlike the table panels above. */
  .view-header {
    display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
    position: sticky; top: 0; z-index: 5; background: var(--cream); padding: 14px 0; margin-top: -14px;
  }
  .view-title { font-size: 23px; font-weight: 800; margin: 0; }

  .search-input, .form-input, .form-select {
    font-family: inherit; border: 1px solid var(--border); background: var(--white);
    border-radius: var(--radius-sm); padding: 9px 16px; font-size: 14px; color: var(--ink); outline: none;
  }
  .search-input:focus, .form-input:focus, .form-select:focus { border-color: var(--ink); }
  .form-input, .form-select { width: 100%; }

  /* Custom dropdown: a native <select>'s own popped-open option list can't
     be restyled cross-browser (font, colors, hover, selected highlight all
     stay OS chrome no matter what CSS is applied to the select itself) -
     the only way to actually match the rest of this UI is to hide the real
     <select> (kept only so existing code can still read/set .value and get
     a real 'change' event) and drive a fully custom trigger+list off it. */
  .native-select-hidden { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
  .custom-select { position: relative; width: 100%; }
  .filter-row .custom-select { width: auto; min-width: 170px; }
  .custom-select-trigger {
    width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
    font-family: inherit; font-weight: 600; font-size: 14px; color: var(--ink); text-align: left;
    border: 1px solid var(--border); background: var(--white); border-radius: var(--radius-sm);
    padding: 9px 14px; cursor: pointer; transition: border-color .15s;
  }
  .custom-select-trigger span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .custom-select-trigger:hover, .custom-select-trigger.open { border-color: var(--ink-muted); }
  .custom-select-trigger svg { width: 15px; height: 15px; flex-shrink: 0; color: var(--text-muted); transition: transform .15s; }
  .custom-select-trigger.open svg { transform: rotate(180deg); }
  .custom-select-list {
    display: none; position: absolute; left: 0; right: 0; top: calc(100% + 4px); max-height: 260px; overflow-y: auto;
    background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(22,22,22,0.14); padding: 6px; z-index: 30;
  }
  .custom-select-list.open { display: block; }
  .custom-select-item {
    display: block; width: 100%; padding: 9px 12px; border-radius: var(--radius-sm); border: none;
    background: none; font-family: inherit; font-size: 13.5px; font-weight: 600; color: var(--ink);
    cursor: pointer; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .custom-select-item:hover { background: var(--cream); }
  .custom-select-item.selected { background: rgba(246,196,69,0.3); font-weight: 800; }

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

  /* Row kebab menu (Utilisateurs table) */
  .row-menu-wrap { position: relative; display: inline-block; }
  .row-menu-btn {
    width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border);
    background: var(--white); color: var(--ink); cursor: pointer; display: inline-flex;
    align-items: center; justify-content: center; padding: 0; transition: border-color .15s, background .15s;
  }
  .row-menu-btn:hover, .row-menu-btn.open { border-color: var(--ink); background: var(--cream); }
  .row-menu {
    display: none; position: absolute; right: 0; top: calc(100% + 4px); min-width: 168px;
    background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(22,22,22,0.14); padding: 6px; z-index: 20;
  }
  .row-menu.open { display: block; }
  .row-menu-item {
    display: block; width: 100%; padding: 8px 10px; border-radius: var(--radius-sm); border: none;
    background: none; font-family: inherit; font-size: 13px; font-weight: 700; color: var(--ink);
    cursor: pointer; text-align: left;
  }
  .row-menu-item:hover { background: var(--cream); }
  .row-menu-item.danger { color: var(--red); }
  .row-menu-item.danger:hover { background: var(--red); color: var(--white); }

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
  /* overflow-x:auto alone doesn't work for a sticky header: per spec, once
     overflow-x isn't visible, overflow-y computes to auto too - which makes
     .panel a scroll container, but since it had no height limit it never
     actually scrolled internally, so thead's sticky top:0 just sat there
     inert instead of detaching and following the page scroll. A real
     bounded height (and only then does it get its own scrollbar) is what
     makes position:sticky have something to stick within.
     This has to be a fixed height, not max-height: a table short enough to
     never exceed max-height never gets an internal scrollbar either, so its
     header would stay "sticky" in name only and just scroll off with the
     rest of the page - which is exactly what still happened on the
     shorter Utilisateurs/Mises à jour/Retours tables after the first pass
     at this fix (only Conversations has enough rows to reliably exceed a
     max-height). Every table now gets the same fixed-height scroll box
     regardless of row count, so the header freezes consistently everywhere.
  */
  .panel {
    background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: auto; height: 70vh;
    scrollbar-width: none; -ms-overflow-style: none; /* Firefox / old Edge - scroll still works, just no visible track */
  }
  .panel::-webkit-scrollbar { display: none; } /* Chrome / Safari / Edge */
  table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 12px 20px; }
  thead th { color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; background: var(--cream); border-bottom: 1px solid var(--border); white-space: nowrap; position: sticky; top: 0; z-index: 2; }
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
  .conv-title-cell {
    max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  /* Keeps the actions column visible without having to scroll the wide
     Utilisateurs table all the way right to reach the buttons. */
  .sticky-actions {
    position: sticky; right: 0;
    background: var(--white);
    box-shadow: -6px 0 6px -6px rgba(0,0,0,0.12);
    z-index: 1;
  }
  thead th.sticky-actions { background: var(--cream); z-index: 3; }
  /* position:sticky gives every row's actions cell its own stacking
     context, so a z-index set only on .row-menu is scoped to its own cell -
     it still loses to the NEXT row's sticky-actions cell, which comes later
     in paint order at the same base z-index, and the open dropdown reads as
     "mixed into" the row below. Raising the whole cell's z-index while its
     menu is open makes that cell win against every other row instead. */
  .sticky-actions:has(.row-menu.open) { z-index: 30; }

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

  /* Communication */
  .comm-subtabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .comm-subview { display: none; }
  .comm-subview.active { display: block; }
  /* Modèles + Historique share one column, side by side with Composer -
     not three cards stacked one under another down the page. */
  .comm-email-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; align-items: start; }
  .comm-email-side { display: flex; flex-direction: column; gap: 20px; }
  .simple-list { display: flex; flex-direction: column; }
  .simple-list-item {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 12px 0; border-bottom: 1px solid var(--border);
  }
  .simple-list-item:last-child { border-bottom: none; }
  .simple-list-title { font-weight: 700; font-size: 13.5px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .simple-list-meta { font-size: 12px; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
  .filter-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .filter-row .search-input { flex: 1; min-width: 180px; }
  .type-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--paper); color: var(--ink-muted); white-space: nowrap; }
  .badge-draft { background: var(--paper); color: var(--ink-muted); }
  .badge-scheduled { background: rgba(142,197,252,0.25); color: #2a5f8f; }
  .badge-published { background: rgba(63,190,122,0.15); color: #1F8A50; }
  .badge-expired { background: rgba(140,135,111,0.18); color: var(--text-muted); }
  .badge-archived { background: rgba(224,85,90,0.12); color: var(--red); }
  .announcement-title-cell { font-weight: 700; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .preview-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; }
  .preview-card img { width: 100%; border-radius: var(--radius-sm); margin-bottom: 14px; display: block; }
  .preview-card h3 { margin: 0 0 10px; font-size: 17px; }
  .preview-card p { margin: 0 0 12px; font-size: 14px; line-height: 1.6; }

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
  .color-swatches { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .swatch { width: 26px; height: 26px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; }
  .swatch.selected { border-color: var(--ink); }
  .checkbox-row { display: flex; align-items: center; gap: 8px; }
  .checkbox-row label { margin: 0; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 24px; }
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
    <button class="nav-item" data-view="communication" style="--accent:#F3A7C7">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      Communication
    </button>
    <button class="nav-item" data-view="report" style="--accent:#8EC5FC">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-3-3L4.3 16.4"/></svg>
      Rapport
    </button>

    <form method="POST" action="/admin/logout" style="margin-top: auto;">
      <button class="nav-item" type="submit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
        Déconnexion
      </button>
    </form>
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
            <tr><th>Utilisateur</th><th>Email</th><th>Appareil</th><th>Inscrit le</th><th>Dernière connexion</th><th>Conv.</th><th>Msgs</th><th>Statut</th><th class="sticky-actions"></th></tr>
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
            <tr><th>Titre</th><th>Utilisateur</th><th>Date</th><th>Messages</th></tr>
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

    <!-- Communication -->
    <section class="view" id="view-communication">
      <div class="view-header">
        <h1 class="view-title">Communication</h1>
      </div>

      <div class="comm-subtabs">
        <button class="btn btn-primary comm-subtab" data-subtab="announcements">Annonces</button>
        <button class="btn btn-outline comm-subtab" data-subtab="email">Email</button>
      </div>

      <!-- Annonces -->
      <div class="comm-subview active" id="comm-announcements">
        <div class="filter-row">
          <select class="form-select" id="announcement-filter-type">
            <option value="">Tous les types</option>
            <option value="update">🚀 Mise à jour</option>
            <option value="info">ℹ️ Information</option>
            <option value="tip">💡 Astuce</option>
            <option value="prompt">⭐ Prompt recommandé</option>
            <option value="promo">🎁 Promotion</option>
            <option value="poll">📊 Sondage</option>
            <option value="security">🔒 Sécurité</option>
          </select>
          <select class="form-select" id="announcement-filter-status">
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Programmée</option>
            <option value="published">Publiée</option>
            <option value="expired">Expirée</option>
            <option value="archived">Archivée</option>
          </select>
          <select class="form-select" id="announcement-filter-target">
            <option value="">Tous les publics</option>
            <option value="all">Tous les utilisateurs</option>
            <option value="new">Nouveaux</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <input class="form-input search-input" id="announcement-search" placeholder="Rechercher un titre…" />
          <button class="btn btn-primary" id="add-announcement-btn" style="margin-left:auto;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M12 5v14M5 12h14"/></svg>
            Nouvelle annonce
          </button>
        </div>
        <div class="panel">
          <table>
            <thead><tr><th>Titre</th><th>Type</th><th>Public</th><th>Statut</th><th>Publiée le</th><th>Expire le</th><th>Email</th><th></th></tr></thead>
            <tbody id="announcements-body"></tbody>
          </table>
          <div class="loading" id="announcements-loading">Chargement…</div>
          <div class="empty" id="announcements-empty" style="display:none">Aucune annonce pour le moment.</div>
        </div>
      </div>

      <!-- Email -->
      <div class="comm-subview" id="comm-email">
       <div class="comm-email-layout">
        <div class="card" style="margin-bottom:0">
          <h3>Composer un email</h3>
          <p class="muted" style="background:rgba(246,196,69,0.18); border-radius:var(--radius-sm); padding:10px 14px; margin:-8px 0 16px; font-size:12.5px; line-height:1.5;">
            Resend est en mode test : tant qu'aucun domaine n'est vérifié (resend.com/domains), les emails ne partent que vers ta propre adresse Resend, pas vers tes utilisateurs.
          </p>
          <form id="campaign-form">
            <div class="form-row">
              <label for="campaign-template">Partir d'un modèle (optionnel)</label>
              <select class="form-select" id="campaign-template">
                <option value="">— Écrire à partir de zéro —</option>
              </select>
            </div>
            <div class="form-row">
              <label for="campaign-recipient">Destinataire</label>
              <select class="form-select" id="campaign-recipient">
                <option value="">Tous les utilisateurs</option>
              </select>
            </div>
            <div class="form-row">
              <label for="campaign-design">Design</label>
              <select class="form-select" id="campaign-design">
                <option value="announcement">Annonce (sobre)</option>
                <option value="promo">Promo (bandeau coloré)</option>
                <option value="newsletter">Newsletter (grand en-tête)</option>
              </select>
            </div>
            <div class="form-row">
              <label for="campaign-subject">Objet</label>
              <input class="form-input" id="campaign-subject" required />
            </div>
            <div class="form-row">
              <label for="campaign-body">Message</label>
              <textarea class="form-input" id="campaign-body" rows="9" required placeholder="Utilise {{name}} pour insérer le prénom du destinataire. Une ligne vide sépare deux paragraphes."></textarea>
            </div>
            <div class="modal-actions" style="justify-content:space-between; margin-top:16px; flex-wrap:wrap; gap:12px;">
              <span class="muted" id="campaign-recipient-count" style="font-weight:600; font-size:13px;"></span>
              <div style="display:flex; gap:12px;">
                <button type="button" class="btn btn-outline" id="campaign-preview-btn">Aperçu</button>
                <button type="button" class="btn btn-outline" id="save-as-template-btn">Enregistrer comme modèle</button>
                <button type="submit" class="btn btn-primary" id="campaign-send-btn">Envoyer</button>
              </div>
            </div>
          </form>
        </div>

        <div class="comm-email-side">
          <div class="card" style="margin-bottom:0">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <h3 style="margin:0">Modèles</h3>
              <button class="btn btn-outline btn-sm" id="add-template-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M12 5v14M5 12h14"/></svg>
                Nouveau modèle
              </button>
            </div>
            <div class="panel" style="height:auto; max-height:none; overflow-x:auto; overflow-y:visible; border:none;">
              <table>
                <thead><tr><th>Nom</th><th>Objet</th><th>Design</th><th>Modifié le</th><th></th></tr></thead>
                <tbody id="templates-body"></tbody>
              </table>
              <div class="loading" id="templates-loading">Chargement…</div>
              <div class="empty" id="templates-empty" style="display:none">Aucun modèle pour le moment.</div>
            </div>
          </div>

          <div class="card" style="margin-bottom:0">
            <h3>Historique des envois</h3>
            <div id="campaigns-list" class="simple-list"></div>
            <div class="loading" id="campaigns-loading">Chargement…</div>
            <div class="empty" id="campaigns-empty" style="display:none">Aucun envoi pour le moment.</div>
          </div>
        </div>
       </div>
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
        <div class="card" style="margin-bottom:0">
          <h3>Annonces publiées (30 derniers jours)</h3>
          <div class="chart-line-wrap" id="chart-announcements"></div>
        </div>
        <div class="card" style="margin-bottom:0">
          <h3>Emails envoyés (30 derniers jours)</h3>
          <div class="chart-line-wrap" id="chart-emails"></div>
        </div>
      </div>
    </section>
  </main>

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

  <!-- Confirm modal -->
  <div class="modal-overlay" id="confirm-modal">
    <div class="modal" style="max-width:380px">
      <p id="confirm-modal-message" style="margin:0 0 20px;font-weight:600"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="confirm-modal-cancel">Annuler</button>
        <button type="button" class="btn btn-danger" id="confirm-modal-ok">Supprimer</button>
      </div>
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

  <!-- Email template form modal -->
  <div class="modal-overlay" id="template-modal">
    <div class="modal">
      <button class="modal-close" data-close="template-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2 id="template-modal-title">Nouveau modèle</h2>
      <form id="template-form">
        <input type="hidden" id="template-id" />
        <div class="form-row">
          <label for="template-name">Nom du modèle</label>
          <input class="form-input" id="template-name" placeholder="Ex: Bienvenue, Relance, Nouveauté…" required />
        </div>
        <div class="form-row">
          <label for="template-subject">Objet</label>
          <input class="form-input" id="template-subject" required />
        </div>
        <div class="form-row">
          <label for="template-design">Design</label>
          <select class="form-select" id="template-design">
            <option value="announcement">Annonce (sobre)</option>
            <option value="promo">Promo (bandeau coloré)</option>
            <option value="newsletter">Newsletter (grand en-tête)</option>
          </select>
        </div>
        <div class="form-row">
          <label for="template-body">Message</label>
          <textarea class="form-input" id="template-body" rows="9" required placeholder="Utilise {{name}} pour insérer le prénom du destinataire."></textarea>
        </div>
        <div class="modal-actions" style="justify-content:space-between;">
          <button type="button" class="btn btn-outline" id="template-preview-btn">Aperçu</button>
          <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-outline" data-close="template-modal">Annuler</button>
            <button type="submit" class="btn btn-primary">Enregistrer</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Announcement form modal -->
  <div class="modal-overlay" id="announcement-modal">
    <div class="modal" style="max-width:560px">
      <button class="modal-close" data-close="announcement-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2 id="announcement-modal-title">Nouvelle annonce</h2>
      <form id="announcement-form">
        <input type="hidden" id="announcement-id" />
        <div class="form-row">
          <label for="announcement-title">Titre</label>
          <input class="form-input" id="announcement-title" required />
        </div>
        <div class="form-row">
          <label for="announcement-content">Contenu</label>
          <textarea class="form-input" id="announcement-content" rows="7" required placeholder="**Gras**, *italique*, une ligne vide sépare deux paragraphes."></textarea>
        </div>
        <div class="form-row">
          <label for="announcement-image">Image (URL, optionnel)</label>
          <input class="form-input" id="announcement-image" placeholder="https://…" />
        </div>
        <div class="form-row" style="display:flex; gap:14px;">
          <div style="flex:1">
            <label for="announcement-type">Type</label>
            <select class="form-select" id="announcement-type">
              <option value="update">🚀 Mise à jour</option>
              <option value="info">ℹ️ Information importante</option>
              <option value="tip">💡 Astuce</option>
              <option value="prompt">⭐ Prompt recommandé</option>
              <option value="promo">🎁 Promotion</option>
              <option value="poll">📊 Sondage</option>
              <option value="security">🔒 Sécurité</option>
            </select>
          </div>
          <div style="flex:1">
            <label for="announcement-target">Public cible</label>
            <select class="form-select" id="announcement-target">
              <option value="all">Tous les utilisateurs</option>
              <option value="new">Nouveaux utilisateurs</option>
              <option value="active">Utilisateurs actifs</option>
              <option value="inactive">Utilisateurs inactifs</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="display:flex; gap:14px;">
          <div style="flex:1">
            <label for="announcement-publish-at">Publication</label>
            <input class="form-input" id="announcement-publish-at" type="datetime-local" required />
          </div>
          <div style="flex:1">
            <label for="announcement-expires-at">Expiration (optionnel)</label>
            <input class="form-input" id="announcement-expires-at" type="datetime-local" />
          </div>
        </div>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="announcement-pinned" />
          <label for="announcement-pinned">📌 Épingler en haut de l'application</label>
        </div>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="announcement-send-email" />
          <label for="announcement-send-email">📧 Envoyer aussi par email au public ciblé</label>
        </div>
        <div class="modal-actions" style="justify-content:space-between; flex-wrap:wrap;">
          <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-outline" data-close="announcement-modal">Annuler</button>
            <button type="button" class="btn btn-outline" id="announcement-preview-btn">Aperçu</button>
          </div>
          <div style="display:flex; gap:10px;">
            <button type="submit" class="btn btn-outline" id="announcement-draft-btn">Enregistrer comme brouillon</button>
            <button type="submit" class="btn btn-primary" id="announcement-publish-btn">Publier</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Announcement preview modal -->
  <div class="modal-overlay" id="announcement-preview-modal">
    <div class="modal" style="max-width:420px">
      <button class="modal-close" data-close="announcement-preview-modal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <h2>Aperçu</h2>
      <div class="preview-card" id="announcement-preview-body"></div>
    </div>
  </div>

  <!-- Email design preview modal - shows the actual rendered HTML the
       recipient would get, since the 3 designs differ enough (banner vs
       masthead vs plain card) that a text description wouldn't do. -->
  <div class="modal-overlay" id="email-preview-modal">
    <div class="modal" style="max-width:560px; padding:16px;">
      <button class="modal-close" data-close="email-preview-modal" style="margin:10px 10px 0 0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <iframe id="email-preview-frame" title="Aperçu de l'email" style="width:100%; height:70vh; border:none; border-radius:var(--radius-md); background:#fff;"></iframe>
    </div>
  </div>

  <script>
    // Keep in sync with CARD_COLORS in server/src/auto-prompts.ts.
    const COLORS = ['#F6C445', '#F3A7C7', '#3FBE7A', '#8EC5FC', '#C9A7F3', '#FFB4A2', '#FFD6A5', '#A0E7E5', '#B8E0D2'];
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

    // textContent->innerHTML escapes &, < and > but NOT quote characters -
    // several call sites interpolate this straight into a double-quoted
    // HTML attribute (title="..."), so a raw " in the source string (e.g. a
    // conversation title, which any unauthenticated client can set via
    // POST /api/conversations) broke out of the attribute and injected
    // arbitrary markup/event handlers into this already-authenticated admin
    // page. Escaping all five XSS-relevant characters directly closes that.
    const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function escapeHtml(str) {
      return String(str ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
    }
    function initials(name) {
      return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }
    function fmtDate(iso) {
      if (!iso) return '—';
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ---------- Custom dropdowns ----------
    // Wraps a native <select> with a fully custom-styled trigger+list, since
    // the native option popup can't be restyled to match the rest of the
    // dashboard in any cross-browser way. The <select> itself stays in the
    // DOM (just visually hidden) so every existing call site that reads/sets
    // .value or listens for 'change' keeps working untouched - this only
    // replaces how it's presented, not how it's driven.
    const customSelectRefreshers = {};

    function enhanceSelect(selectEl) {
      selectEl.classList.add('native-select-hidden');
      selectEl.tabIndex = -1;

      const wrap = document.createElement('div');
      wrap.className = 'custom-select';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      const list = document.createElement('div');
      list.className = 'custom-select-list';

      function closeList() {
        list.classList.remove('open');
        trigger.classList.remove('open');
      }

      function renderTrigger() {
        const current = selectEl.options[selectEl.selectedIndex];
        trigger.innerHTML =
          '<span>' + escapeHtml(current ? current.textContent : '') + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
      }

      function renderList() {
        list.innerHTML = Array.from(selectEl.options).map((o) =>
          '<button type="button" class="custom-select-item' + (o.value === selectEl.value ? ' selected' : '') + '" data-value="' + escapeHtml(o.value) + '">' +
          escapeHtml(o.textContent) + '</button>',
        ).join('');
        list.querySelectorAll('.custom-select-item').forEach((item) => {
          item.addEventListener('click', () => {
            selectEl.value = item.dataset.value;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            renderTrigger();
            renderList();
            closeList();
          });
        });
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !list.classList.contains('open');
        document.querySelectorAll('.custom-select-list.open').forEach((el) => el.classList.remove('open'));
        document.querySelectorAll('.custom-select-trigger.open').forEach((el) => el.classList.remove('open'));
        if (willOpen) {
          list.classList.add('open');
          trigger.classList.add('open');
        }
      });

      renderTrigger();
      renderList();
      wrap.appendChild(trigger);
      wrap.appendChild(list);
      selectEl.insertAdjacentElement('afterend', wrap);

      customSelectRefreshers[selectEl.id] = () => {
        renderTrigger();
        renderList();
      };
    }

    function refreshCustomSelect(id) {
      const refresh = customSelectRefreshers[id];
      if (refresh) refresh();
    }

    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select-list.open').forEach((el) => el.classList.remove('open'));
      document.querySelectorAll('.custom-select-trigger.open').forEach((el) => el.classList.remove('open'));
    });

    [
      'announcement-filter-type', 'announcement-filter-status', 'announcement-filter-target',
      'announcement-type', 'announcement-target', 'campaign-template', 'campaign-recipient',
      'campaign-design', 'template-design',
    ].forEach((id) => enhanceSelect(document.getElementById(id)));

    async function showEmailPreview(design, subject, body) {
      const res = await fetch('/admin/api/email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design, subject, body }),
      });
      const html = await res.text();
      document.getElementById('email-preview-frame').srcdoc = html;
      openModal('email-preview-modal');
    }

    // ---------- Home ----------
    let lastStatsData = null;
    async function loadStats() {
      const res = await fetch('/admin/api/stats');
      const data = await res.json();
      lastStatsData = data;
      updateCampaignRecipientCount();
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
      renderLineChart('chart-announcements', data.announcementsTrend, PALETTE[2], 'annonces');
      renderLineChart('chart-emails', data.emailsTrend, PALETTE[3], 'emails');
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
          ? \`<span class="avatar"><img src="\${escapeHtml(u.avatarUrl)}" alt="" /></span>\`
          : \`<span class="avatar">\${initials(u.name)}</span>\`;
        const statusBadge = u.status === 'suspended'
          ? '<span class="badge badge-suspended">Suspendu</span>'
          : '<span class="badge badge-active">Actif</span>';
        const toggleItem = u.status === 'suspended'
          ? \`<button class="row-menu-item" data-action="reactivate" data-id="\${u.id}">Réactiver</button>\`
          : \`<button class="row-menu-item" data-action="suspend" data-id="\${u.id}">Suspendre</button>\`;
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
          <td class="sticky-actions">
            <div class="row-menu-wrap">
              <button class="row-menu-btn" data-action="toggle-menu" aria-label="Actions" aria-haspopup="true">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
              </button>
              <div class="row-menu">
                \${toggleItem}
                <button class="row-menu-item danger" data-action="delete-user" data-id="\${u.id}">Supprimer</button>
              </div>
            </div>
          </td>
        </tr>\`;
      }).join('');

      body.querySelectorAll('[data-action="toggle-menu"]').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = b.nextElementSibling;
        const wasOpen = menu.classList.contains('open');
        closeAllRowMenus();
        if (!wasOpen) {
          menu.classList.add('open');
          b.classList.add('open');
        }
      }));
      body.querySelectorAll('[data-action="suspend"]').forEach((b) => b.addEventListener('click', () => userAction(b.dataset.id, 'suspend')));
      body.querySelectorAll('[data-action="reactivate"]').forEach((b) => b.addEventListener('click', () => userAction(b.dataset.id, 'reactivate')));
      body.querySelectorAll('[data-action="delete-user"]').forEach((b) => b.addEventListener('click', () => deleteUserRow(b)));
    }

    function closeAllRowMenus() {
      document.querySelectorAll('.row-menu.open').forEach((m) => m.classList.remove('open'));
      document.querySelectorAll('.row-menu-btn.open').forEach((b) => b.classList.remove('open'));
    }
    document.addEventListener('click', closeAllRowMenus);

    async function userAction(id, action) {
      await fetch('/admin/api/users/' + id + '/' + action, { method: 'POST' });
      loadUsers(document.getElementById('users-search').value);
      loadStats();
    }

    async function deleteUserRow(btn) {
      if (!(await customConfirm('Supprimer cet utilisateur et toutes ses conversations ?'))) return;
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
          <td class="conv-title-cell" title="\${escapeHtml(c.title)}">\${escapeHtml(c.title)}</td>
          <td class="muted">\${c.userName ? escapeHtml(c.userName) : 'Invité'}</td>
          <td class="muted">\${fmtDate(c.createdAt)}</td>
          <td>\${c.messageCount}</td>
        </tr>\`).join('');
    }

    // ---------- Prompts ----------
    async function loadPrompts() {
      const res = await fetch('/admin/api/prompts');
      const prompts = await res.json();
      const grid = document.getElementById('prompts-grid');
      document.getElementById('prompts-loading').style.display = 'none';
      document.getElementById('prompts-empty').style.display = prompts.length === 0 ? 'block' : 'none';
      grid.innerHTML = prompts.map((p) => \`
        <div class="prompt-card" style="background:\${escapeHtml(p.color)}">
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
      if (!(await customConfirm('Supprimer ce prompt ?'))) return;
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
          <td><a href="\${escapeHtml(r.apkUrl)}" target="_blank" rel="noopener">\${escapeHtml(r.version)}</a></td>
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
        if (release.supabaseError) {
          alert(
            "La mise à jour a bien été publiée (GitHub Releases et la landing page fonctionnent), " +
            "mais la copie miroir vers Supabase Storage a échoué. Cela n'affecte rien côté utilisateurs." +
            "\\n\\nDétail : " + release.supabaseError,
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
      if (!(await customConfirm('Supprimer cette version ? Le fichier restera dans le stockage.'))) return;
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
      if (!(await customConfirm('Supprimer ce retour ?'))) return;
      btn.disabled = true;
      await fetch('/admin/api/feedback/' + btn.dataset.id, { method: 'DELETE' });
      loadFeedback();
    }

    // ---------- Communication ----------
    let emailTemplatesCache = [];
    let campaignUsersCache = [];

    async function loadCampaignRecipientOptions() {
      const res = await fetch('/admin/api/users');
      campaignUsersCache = await res.json();
      const select = document.getElementById('campaign-recipient');
      const currentValue = select.value;
      select.innerHTML = '<option value="">Tous les utilisateurs</option>' +
        campaignUsersCache.map((u) => '<option value="' + u.id + '">' + escapeHtml(u.name) + ' — ' + escapeHtml(u.email) + '</option>').join('');
      select.value = campaignUsersCache.some((u) => u.id === currentValue) ? currentValue : '';
      refreshCustomSelect('campaign-recipient');
      updateCampaignRecipientCount();
    }

    document.getElementById('campaign-recipient').addEventListener('change', () => updateCampaignRecipientCount());

    function updateCampaignRecipientCount() {
      const el = document.getElementById('campaign-recipient-count');
      const recipientId = document.getElementById('campaign-recipient').value;
      if (recipientId) {
        const user = campaignUsersCache.find((u) => u.id === recipientId);
        el.textContent = user ? 'Envoi à ' + user.name + ' (' + user.email + ')' : '';
        return;
      }
      el.textContent = lastStatsData
        ? 'Envoi à tous les utilisateurs inscrits avec un email (' + lastStatsData.totalUsers + ')'
        : '';
    }

    const EMAIL_DESIGN_LABELS = { announcement: 'Annonce', promo: 'Promo', newsletter: 'Newsletter' };

    async function loadEmailTemplates() {
      const res = await fetch('/admin/api/email-templates');
      emailTemplatesCache = await res.json();
      const body = document.getElementById('templates-body');
      document.getElementById('templates-loading').style.display = 'none';
      document.getElementById('templates-empty').style.display = emailTemplatesCache.length === 0 ? 'block' : 'none';
      body.innerHTML = emailTemplatesCache.map((t) => \`
        <tr>
          <td style="font-weight:700">\${escapeHtml(t.name)}</td>
          <td class="muted">\${escapeHtml(t.subject)}</td>
          <td class="muted">\${EMAIL_DESIGN_LABELS[t.design] || t.design}</td>
          <td class="muted">\${fmtDate(t.updatedAt)}</td>
          <td><div class="actions-cell">
            <button class="btn btn-outline btn-sm" data-action="edit-template" data-id="\${t.id}">Modifier</button>
            <button class="btn btn-danger btn-sm" data-action="delete-template" data-id="\${t.id}">Supprimer</button>
          </div></td>
        </tr>\`).join('');

      body.querySelectorAll('[data-action="edit-template"]').forEach((b) => b.addEventListener('click', () => editTemplate(emailTemplatesCache.find((t) => t.id === b.dataset.id))));
      body.querySelectorAll('[data-action="delete-template"]').forEach((b) => b.addEventListener('click', () => deleteTemplateRow(b)));

      const select = document.getElementById('campaign-template');
      const currentValue = select.value;
      select.innerHTML = '<option value="">— Écrire à partir de zéro —</option>' +
        emailTemplatesCache.map((t) => \`<option value="\${t.id}">\${escapeHtml(t.name)}</option>\`).join('');
      select.value = emailTemplatesCache.some((t) => t.id === currentValue) ? currentValue : '';
      refreshCustomSelect('campaign-template');
    }

    document.getElementById('campaign-template').addEventListener('change', (e) => {
      const template = emailTemplatesCache.find((t) => t.id === e.target.value);
      if (!template) return;
      document.getElementById('campaign-subject').value = template.subject;
      document.getElementById('campaign-body').value = template.body;
      document.getElementById('campaign-design').value = template.design;
      refreshCustomSelect('campaign-design');
    });

    document.getElementById('add-template-btn').addEventListener('click', () => {
      document.getElementById('template-modal-title').textContent = 'Nouveau modèle';
      document.getElementById('template-form').reset();
      document.getElementById('template-id').value = '';
      document.getElementById('template-design').value = 'announcement';
      refreshCustomSelect('template-design');
      openModal('template-modal');
    });

    function editTemplate(t) {
      document.getElementById('template-modal-title').textContent = 'Modifier le modèle';
      document.getElementById('template-id').value = t.id;
      document.getElementById('template-name').value = t.name;
      document.getElementById('template-subject').value = t.subject;
      document.getElementById('template-body').value = t.body;
      document.getElementById('template-design').value = t.design;
      refreshCustomSelect('template-design');
      openModal('template-modal');
    }

    document.getElementById('template-preview-btn').addEventListener('click', () => {
      showEmailPreview(
        document.getElementById('template-design').value,
        document.getElementById('template-subject').value,
        document.getElementById('template-body').value,
      );
    });

    document.getElementById('template-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('template-id').value;
      const payload = {
        name: document.getElementById('template-name').value,
        subject: document.getElementById('template-subject').value,
        body: document.getElementById('template-body').value,
        design: document.getElementById('template-design').value,
      };
      await fetch(id ? '/admin/api/email-templates/' + id : '/admin/api/email-templates', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      closeModal('template-modal');
      loadEmailTemplates();
    });

    async function deleteTemplateRow(btn) {
      if (!(await customConfirm('Supprimer ce modèle ?'))) return;
      btn.disabled = true;
      await fetch('/admin/api/email-templates/' + btn.dataset.id, { method: 'DELETE' });
      loadEmailTemplates();
    }

    document.getElementById('save-as-template-btn').addEventListener('click', async () => {
      const subject = document.getElementById('campaign-subject').value.trim();
      const body = document.getElementById('campaign-body').value.trim();
      const design = document.getElementById('campaign-design').value;
      if (!subject || !body) {
        alert("Renseigne l'objet et le message avant d'enregistrer un modèle.");
        return;
      }
      const name = prompt('Nom du modèle :', document.getElementById('campaign-template').selectedOptions[0]?.textContent === '— Écrire à partir de zéro —' ? '' : '');
      if (!name || !name.trim()) return;
      await fetch('/admin/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), subject, body, design }),
      });
      loadEmailTemplates();
    });

    document.getElementById('campaign-preview-btn').addEventListener('click', () => {
      showEmailPreview(
        document.getElementById('campaign-design').value,
        document.getElementById('campaign-subject').value,
        document.getElementById('campaign-body').value,
      );
    });

    document.getElementById('campaign-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('campaign-subject').value.trim();
      const body = document.getElementById('campaign-body').value.trim();
      const design = document.getElementById('campaign-design').value;
      const userId = document.getElementById('campaign-recipient').value;
      const recipientUser = userId ? campaignUsersCache.find((u) => u.id === userId) : null;
      const recipientLabel = recipientUser
        ? recipientUser.name + ' (' + recipientUser.email + ')'
        : (lastStatsData ? lastStatsData.totalUsers + ' destinataire(s)' : 'tous les utilisateurs');
      if (!(await customConfirm('Envoyer cet email à ' + recipientLabel + ' ? Cette action ne peut pas être annulée.', 'Envoyer', false))) return;

      const sendBtn = document.getElementById('campaign-send-btn');
      sendBtn.disabled = true;
      sendBtn.textContent = 'Envoi…';
      try {
        const res = await fetch('/admin/api/email-campaigns/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, body, design, userId: userId || undefined }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Échec de l\\'envoi');
        alert(
          'Email envoyé à ' + result.recipientCount + ' destinataire(s)' +
          (result.failureCount > 0 ? ', dont ' + result.failureCount + ' échec(s).' : '.'),
        );
        document.getElementById('campaign-form').reset();
        refreshCustomSelect('campaign-recipient');
        refreshCustomSelect('campaign-template');
        refreshCustomSelect('campaign-design');
        updateCampaignRecipientCount();
        loadEmailCampaigns();
      } catch (err) {
        alert("Échec de l'envoi : " + (err instanceof Error ? err.message : String(err)));
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Envoyer';
      }
    });

    async function loadEmailCampaigns() {
      const res = await fetch('/admin/api/email-campaigns');
      const rows = await res.json();
      const list = document.getElementById('campaigns-list');
      document.getElementById('campaigns-loading').style.display = 'none';
      document.getElementById('campaigns-empty').style.display = rows.length === 0 ? 'block' : 'none';
      list.innerHTML = rows.map((c) => \`
        <div class="simple-list-item">
          <span class="simple-list-title">\${escapeHtml(c.subject)}</span>
          <span class="simple-list-meta">\${EMAIL_DESIGN_LABELS[c.design] || c.design} · \${c.recipientCount} destinataire(s)\${c.failureCount > 0 ? ' · ' + c.failureCount + ' échec(s)' : ''} · \${fmtDate(c.createdAt)}</span>
        </div>\`).join('');
    }

    // ---------- Communication sub-tabs ----------
    document.querySelectorAll('.comm-subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comm-subtab').forEach((b) => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        document.querySelectorAll('.comm-subview').forEach((v) => v.classList.remove('active'));
        document.getElementById('comm-' + btn.dataset.subtab).classList.add('active');
      });
    });

    // ---------- Announcements ----------
    const ANNOUNCEMENT_TYPE_LABELS = {
      update: '🚀 Mise à jour', info: 'ℹ️ Information', tip: '💡 Astuce',
      prompt: '⭐ Prompt recommandé', promo: '🎁 Promotion', poll: '📊 Sondage', security: '🔒 Sécurité',
    };
    const ANNOUNCEMENT_STATUS_LABELS = {
      draft: 'Brouillon', scheduled: 'Programmée', published: 'Publiée', expired: 'Expirée', archived: 'Archivée',
    };
    const ANNOUNCEMENT_TARGET_LABELS = { all: 'Tous', new: 'Nouveaux', active: 'Actifs', inactive: 'Inactifs' };

    let announcementsCache = [];
    let announcementSearchTimer;

    function toDatetimeLocalValue(iso) {
      const d = iso ? new Date(iso) : new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    async function loadAnnouncements() {
      const params = new URLSearchParams();
      const type = document.getElementById('announcement-filter-type').value;
      const status = document.getElementById('announcement-filter-status').value;
      const target = document.getElementById('announcement-filter-target').value;
      const search = document.getElementById('announcement-search').value;
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (target) params.set('target', target);
      if (search) params.set('search', search);

      const res = await fetch('/admin/api/announcements?' + params.toString());
      announcementsCache = await res.json();
      const body = document.getElementById('announcements-body');
      document.getElementById('announcements-loading').style.display = 'none';
      document.getElementById('announcements-empty').style.display = announcementsCache.length === 0 ? 'block' : 'none';
      body.innerHTML = announcementsCache.map((a) => \`
        <tr>
          <td class="announcement-title-cell" title="\${escapeHtml(a.title)}">\${a.pinned ? '📌 ' : ''}\${escapeHtml(a.title)}</td>
          <td><span class="type-badge">\${ANNOUNCEMENT_TYPE_LABELS[a.type] || a.type}</span></td>
          <td class="muted">\${ANNOUNCEMENT_TARGET_LABELS[a.target] || a.target}</td>
          <td><span class="badge badge-\${a.status}">\${ANNOUNCEMENT_STATUS_LABELS[a.status] || a.status}</span></td>
          <td class="muted">\${fmtDate(a.publishAt)}</td>
          <td class="muted">\${a.expiresAt ? fmtDate(a.expiresAt) : '—'}</td>
          <td class="muted">\${a.sendEmail ? (a.emailSentAt ? 'Envoyé' : 'En attente') : '—'}</td>
          <td><div class="actions-cell">
            <button class="btn btn-outline btn-sm" data-action="edit-announcement" data-id="\${a.id}">Modifier</button>
            <button class="btn btn-outline btn-sm" data-action="duplicate-announcement" data-id="\${a.id}">Dupliquer</button>
            \${a.status !== 'archived' ? \`<button class="btn btn-outline btn-sm" data-action="archive-announcement" data-id="\${a.id}">Archiver</button>\` : ''}
            <button class="btn btn-danger btn-sm" data-action="delete-announcement" data-id="\${a.id}">Supprimer</button>
          </div></td>
        </tr>\`).join('');

      body.querySelectorAll('[data-action="edit-announcement"]').forEach((b) => b.addEventListener('click', () => editAnnouncement(announcementsCache.find((a) => a.id === b.dataset.id))));
      body.querySelectorAll('[data-action="duplicate-announcement"]').forEach((b) => b.addEventListener('click', () => duplicateAnnouncementRow(b)));
      body.querySelectorAll('[data-action="archive-announcement"]').forEach((b) => b.addEventListener('click', () => archiveAnnouncementRow(b)));
      body.querySelectorAll('[data-action="delete-announcement"]').forEach((b) => b.addEventListener('click', () => deleteAnnouncementRow(b)));
    }

    ['announcement-filter-type', 'announcement-filter-status', 'announcement-filter-target'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => loadAnnouncements());
    });
    document.getElementById('announcement-search').addEventListener('input', () => {
      clearTimeout(announcementSearchTimer);
      announcementSearchTimer = setTimeout(loadAnnouncements, 300);
    });

    document.getElementById('add-announcement-btn').addEventListener('click', () => {
      document.getElementById('announcement-modal-title').textContent = 'Nouvelle annonce';
      document.getElementById('announcement-form').reset();
      document.getElementById('announcement-id').value = '';
      document.getElementById('announcement-publish-at').value = toDatetimeLocalValue();
      document.getElementById('announcement-expires-at').value = '';
      refreshCustomSelect('announcement-type');
      refreshCustomSelect('announcement-target');
      openModal('announcement-modal');
    });

    function editAnnouncement(a) {
      document.getElementById('announcement-modal-title').textContent = "Modifier l'annonce";
      document.getElementById('announcement-id').value = a.id;
      document.getElementById('announcement-title').value = a.title;
      document.getElementById('announcement-content').value = a.content;
      document.getElementById('announcement-image').value = a.imageUrl || '';
      document.getElementById('announcement-type').value = a.type;
      document.getElementById('announcement-target').value = a.target;
      document.getElementById('announcement-publish-at').value = toDatetimeLocalValue(a.publishAt);
      document.getElementById('announcement-expires-at').value = a.expiresAt ? toDatetimeLocalValue(a.expiresAt) : '';
      document.getElementById('announcement-pinned').checked = a.pinned;
      document.getElementById('announcement-send-email').checked = a.sendEmail;
      refreshCustomSelect('announcement-type');
      refreshCustomSelect('announcement-target');
      openModal('announcement-modal');
    }

    function renderAnnouncementPreviewHtml(content) {
      return escapeHtml(content)
        .split(/\\n{2,}/)
        .map((block) => '<p>' + block.replace(/\\n/g, '<br/>').replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.+?)\\*/g, '<em>$1</em>') + '</p>')
        .join('');
    }

    document.getElementById('announcement-preview-btn').addEventListener('click', () => {
      const title = document.getElementById('announcement-title').value || '(sans titre)';
      const content = document.getElementById('announcement-content').value;
      const image = document.getElementById('announcement-image').value;
      document.getElementById('announcement-preview-body').innerHTML =
        (image ? '<img src="' + escapeHtml(image) + '" alt="" />' : '') +
        '<h3>' + escapeHtml(title) + '</h3>' +
        renderAnnouncementPreviewHtml(content || '');
      openModal('announcement-preview-modal');
    });

    document.getElementById('announcement-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('announcement-id').value;
      const saveAsDraft = Boolean(e.submitter && e.submitter.id === 'announcement-draft-btn');
      const publishAtValue = document.getElementById('announcement-publish-at').value;
      const expiresAtValue = document.getElementById('announcement-expires-at').value;
      const payload = {
        title: document.getElementById('announcement-title').value,
        content: document.getElementById('announcement-content').value,
        imageUrl: document.getElementById('announcement-image').value,
        type: document.getElementById('announcement-type').value,
        target: document.getElementById('announcement-target').value,
        pinned: document.getElementById('announcement-pinned').checked,
        sendEmail: document.getElementById('announcement-send-email').checked,
        publishAt: publishAtValue ? new Date(publishAtValue).toISOString() : new Date().toISOString(),
        expiresAt: expiresAtValue ? new Date(expiresAtValue).toISOString() : null,
        saveAsDraft,
      };
      await fetch(id ? '/admin/api/announcements/' + id : '/admin/api/announcements', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      closeModal('announcement-modal');
      loadAnnouncements();
    });

    async function duplicateAnnouncementRow(btn) {
      btn.disabled = true;
      await fetch('/admin/api/announcements/' + btn.dataset.id + '/duplicate', { method: 'POST' });
      loadAnnouncements();
    }

    async function archiveAnnouncementRow(btn) {
      if (!(await customConfirm('Archiver cette annonce ?', 'Archiver', false))) return;
      btn.disabled = true;
      await fetch('/admin/api/announcements/' + btn.dataset.id + '/archive', { method: 'POST' });
      loadAnnouncements();
    }

    async function deleteAnnouncementRow(btn) {
      if (!(await customConfirm('Supprimer cette annonce ?'))) return;
      btn.disabled = true;
      await fetch('/admin/api/announcements/' + btn.dataset.id, { method: 'DELETE' });
      loadAnnouncements();
    }

    // ---------- Modals ----------
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    let cancelPendingConfirm = null;
    // okLabel/danger default to the delete-confirmation look every existing
    // call site relies on - pass e.g. customConfirm(msg, 'Envoyer', false)
    // for a non-destructive action so the button doesn't say "Supprimer"
    // for something that isn't a deletion.
    function customConfirm(message, okLabel, danger) {
      if (cancelPendingConfirm) cancelPendingConfirm();
      return new Promise((resolve) => {
        document.getElementById('confirm-modal-message').textContent = message;
        const okBtn = document.getElementById('confirm-modal-ok');
        okBtn.textContent = okLabel || 'Supprimer';
        okBtn.classList.toggle('btn-danger', danger !== false);
        okBtn.classList.toggle('btn-primary', danger === false);
        openModal('confirm-modal');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        const cleanup = (result) => {
          closeModal('confirm-modal');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
          cancelPendingConfirm = null;
          resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        cancelPendingConfirm = onCancel;
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
      });
    }
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (overlay.id === 'confirm-modal' && cancelPendingConfirm) { cancelPendingConfirm(); return; }
        overlay.classList.remove('open');
      });
    });

    // ---------- Init ----------
    loadStats();
    loadNotifications();
    loadUsers();
    loadConversations();
    loadPrompts();
    loadReleases();
    loadFeedback();
    loadEmailTemplates();
    loadEmailCampaigns();
    loadCampaignRecipientOptions();
    loadAnnouncements();
  </script>
</body>
</html>`;

export function renderLoginHtml(showError: boolean): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ChaTin — Admin</title>
<link rel="icon" href="https://forgeronduweb.github.io/ChaTin/images/icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root {
    --cream: #F7F3E6; --paper: #EFEAD6; --ink: #161616; --ink-muted: #3A382F;
    --text-muted: #8C876F; --yellow: #F6C445; --red: #E0555A; --border: #E6E1D2;
    --radius-lg: 16px; --radius-md: 12px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: 'Baloo 2', system-ui, sans-serif; background: var(--cream); color: var(--ink);
    min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .card {
    width: 100%; max-width: 340px; background: var(--paper); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 32px 28px; text-align: center;
  }
  .card img { width: 48px; height: 48px; border-radius: 14px; margin-bottom: 14px; }
  .card h1 { font-size: 19px; margin: 0 0 22px; }
  .form-input {
    width: 100%; font-family: inherit; font-size: 15px; border: 1px solid var(--border); background: var(--white, #fff);
    border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 14px;
  }
  .form-input:focus { outline: 2px solid var(--yellow); outline-offset: 1px; }
  .submit-btn {
    width: 100%; font-family: inherit; font-size: 15px; font-weight: 700; border: none; cursor: pointer;
    background: var(--yellow); color: var(--ink); border-radius: var(--radius-md); padding: 12px 14px;
  }
  .submit-btn:hover { filter: brightness(0.96); }
  .error {
    color: var(--red); font-size: 13px; font-weight: 600; margin: -8px 0 14px;
  }
</style>
</head>
<body>
  <div class="card">
    <img src="https://forgeronduweb.github.io/ChaTin/images/icon.png" alt="ChaTin" />
    <h1>Accès admin</h1>
    <form method="POST" action="/admin/login">
      ${showError ? '<p class="error">Mot de passe incorrect.</p>' : ''}
      <input class="form-input" type="password" name="password" placeholder="Mot de passe" autofocus required />
      <button class="submit-btn" type="submit">Se connecter</button>
    </form>
  </div>
</body>
</html>`;
}
