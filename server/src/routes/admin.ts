import { Router } from 'express';
import { requireAdmin } from '../admin-auth.js';
import { deleteUser, getStats, listUsers } from '../admin-store.js';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/admin/api/stats', async (_req, res) => {
  res.json(await getStats());
});

adminRouter.get('/admin/api/users', async (_req, res) => {
  res.json(await listUsers());
});

adminRouter.delete('/admin/api/users/:id', async (req, res) => {
  const deleted = await deleteUser(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(204).end();
});

adminRouter.get('/admin', (_req, res) => {
  res.type('html').send(DASHBOARD_HTML);
});

const DASHBOARD_HTML = `<!doctype html>
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
    --white: #FFFFFF; --radius-lg: 32px; --radius-md: 24px; --radius-sm: 16px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: 'Baloo 2', system-ui, sans-serif;
    background: var(--cream); color: var(--ink);
  }
  .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

  .topbar {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px; border-bottom: 1px solid rgba(22,22,22,0.06);
  }
  .topbar img { width: 36px; height: 36px; border-radius: 10px; }
  .topbar h1 { font-size: 18px; font-weight: 800; margin: 0; }
  .badge {
    background: var(--ink); color: var(--white); font-size: 12px; font-weight: 600;
    padding: 5px 14px; border-radius: 999px; margin-left: auto;
  }

  main { padding: 32px 0 80px; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--white); border-radius: var(--radius-md); padding: 24px;
    border-top: 4px solid var(--accent, var(--yellow));
  }
  .stat-card .value { font-size: 36px; font-weight: 800; line-height: 1.1; }
  .stat-card .label { font-size: 13px; color: var(--text-muted); font-weight: 600; margin-top: 4px; }

  .section-title { font-size: 15px; font-weight: 700; color: var(--ink-muted); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.03em; }

  .panel { background: var(--white); border-radius: var(--radius-lg); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
  th, td { text-align: left; padding: 14px 20px; }
  thead th { color: var(--text-muted); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 2px solid var(--paper); }
  tbody tr:not(:last-child) td { border-bottom: 1px solid var(--paper); }
  .user-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%; background: var(--pink);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 12px; font-weight: 700; color: var(--ink); overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .email { color: var(--ink-muted); }
  .date { color: var(--text-muted); white-space: nowrap; }

  .btn-delete {
    font-family: inherit; background: none; border: 2px solid #E0555A; color: #E0555A;
    border-radius: 999px; padding: 6px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .btn-delete:hover { background: #E0555A; color: var(--white); }
  .btn-delete:disabled { opacity: 0.5; cursor: default; }

  .empty, .loading { padding: 48px 24px; text-align: center; color: var(--text-muted); font-weight: 600; }
</style>
</head>
<body>
  <header class="topbar">
    <img src="https://forgeronduweb.github.io/ChaTin/images/icon.png" alt="ChaTin" />
    <h1>ChaTin</h1>
    <span class="badge">Admin</span>
  </header>

  <main class="container">
    <div class="stats" id="stats">
      <div class="stat-card" style="--accent:#F6C445"><div class="value">—</div><div class="label">Utilisateurs</div></div>
      <div class="stat-card" style="--accent:#F3A7C7"><div class="value">—</div><div class="label">Conversations</div></div>
      <div class="stat-card" style="--accent:#3FBE7A"><div class="value">—</div><div class="label">Messages</div></div>
    </div>

    <h2 class="section-title">Utilisateurs</h2>
    <div class="panel">
      <table>
        <thead>
          <tr><th>Utilisateur</th><th>Email</th><th>Inscrit le</th><th></th></tr>
        </thead>
        <tbody id="users-body"></tbody>
      </table>
      <div class="loading" id="loading-state">Chargement…</div>
      <div class="empty" id="empty-state" style="display:none">Aucun utilisateur pour le moment.</div>
    </div>
  </main>

  <script>
    function initials(name) {
      return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    async function loadStats() {
      const res = await fetch('/admin/api/stats');
      const data = await res.json();
      const cards = document.querySelectorAll('#stats .value');
      cards[0].textContent = data.userCount;
      cards[1].textContent = data.conversationCount;
      cards[2].textContent = data.messageCount;
    }

    async function loadUsers() {
      const res = await fetch('/admin/api/users');
      const users = await res.json();
      const body = document.getElementById('users-body');
      const empty = document.getElementById('empty-state');
      const loading = document.getElementById('loading-state');
      loading.style.display = 'none';
      body.innerHTML = '';
      empty.style.display = users.length === 0 ? 'block' : 'none';

      for (const user of users) {
        const tr = document.createElement('tr');
        const avatar = user.avatarUrl
          ? \`<span class="avatar"><img src="\${user.avatarUrl}" alt="" /></span>\`
          : \`<span class="avatar">\${initials(user.name)}</span>\`;
        tr.innerHTML = \`
          <td><div class="user-cell">\${avatar}\${escapeHtml(user.name)}</div></td>
          <td class="email">\${escapeHtml(user.email)}</td>
          <td class="date">\${new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td><button class="btn-delete" data-id="\${user.id}">Supprimer</button></td>
        \`;
        body.appendChild(tr);
      }

      body.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.addEventListener('click', () => onDelete(btn));
      });
    }

    async function onDelete(btn) {
      if (!confirm('Supprimer cet utilisateur et toutes ses conversations ?')) return;
      btn.disabled = true;
      btn.textContent = '...';
      const res = await fetch('/admin/api/users/' + btn.dataset.id, { method: 'DELETE' });
      if (res.ok) {
        await Promise.all([loadStats(), loadUsers()]);
      } else {
        btn.disabled = false;
        btn.textContent = 'Supprimer';
        alert('Échec de la suppression.');
      }
    }

    loadStats();
    loadUsers();
  </script>
</body>
</html>`;
