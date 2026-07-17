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
<style>
  :root {
    --cream: #F7F3E6; --ink: #161616; --ink-muted: #3A382F; --text-muted: #8C876F;
    --yellow: #F6C445; --pink: #F3A7C7; --green: #3FBE7A; --white: #FFFFFF;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: system-ui, -apple-system, sans-serif;
    background: var(--cream); color: var(--ink); padding: 32px 20px 80px;
  }
  h1 { font-size: 24px; margin: 0 0 24px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; max-width: 900px; margin: 0 auto 32px; }
  .stat-card { background: var(--white); border-radius: 16px; padding: 20px; }
  .stat-card .value { font-size: 32px; font-weight: 700; }
  .stat-card .label { font-size: 13px; color: var(--text-muted); }
  .panel { max-width: 900px; margin: 0 auto; background: var(--white); border-radius: 16px; padding: 8px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #EFEAD6; white-space: nowrap; }
  th { color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase; }
  .avatar { width: 28px; height: 28px; border-radius: 50%; vertical-align: middle; margin-right: 8px; background: var(--pink); }
  button.delete {
    background: none; border: 1px solid #d33; color: #d33; border-radius: 999px;
    padding: 4px 12px; font-size: 13px; cursor: pointer;
  }
  button.delete:hover { background: #d33; color: white; }
  .empty { padding: 32px; text-align: center; color: var(--text-muted); }
</style>
</head>
<body>
  <h1>ChaTin — Admin</h1>
  <div class="stats" id="stats">
    <div class="stat-card"><div class="value">—</div><div class="label">Chargement…</div></div>
  </div>
  <div class="panel">
    <table>
      <thead>
        <tr><th>Utilisateur</th><th>Email</th><th>Inscrit le</th><th></th></tr>
      </thead>
      <tbody id="users-body"></tbody>
    </table>
    <div class="empty" id="empty-state" style="display:none">Aucun utilisateur pour le moment.</div>
  </div>

  <script>
    async function loadStats() {
      const res = await fetch('/admin/api/stats');
      const data = await res.json();
      document.getElementById('stats').innerHTML = \`
        <div class="stat-card"><div class="value">\${data.userCount}</div><div class="label">Utilisateurs</div></div>
        <div class="stat-card"><div class="value">\${data.conversationCount}</div><div class="label">Conversations</div></div>
        <div class="stat-card"><div class="value">\${data.messageCount}</div><div class="label">Messages</div></div>
      \`;
    }

    async function loadUsers() {
      const res = await fetch('/admin/api/users');
      const users = await res.json();
      const body = document.getElementById('users-body');
      const empty = document.getElementById('empty-state');
      body.innerHTML = '';
      empty.style.display = users.length === 0 ? 'block' : 'none';
      for (const user of users) {
        const tr = document.createElement('tr');
        const avatar = user.avatarUrl
          ? \`<img class="avatar" src="\${user.avatarUrl}" alt="" />\`
          : '<span class="avatar" style="display:inline-block"></span>';
        tr.innerHTML = \`
          <td>\${avatar}\${escapeHtml(user.name)}</td>
          <td>\${escapeHtml(user.email)}</td>
          <td>\${new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
          <td><button class="delete" data-id="\${user.id}">Supprimer</button></td>
        \`;
        body.appendChild(tr);
      }
      body.querySelectorAll('button.delete').forEach((btn) => {
        btn.addEventListener('click', () => onDelete(btn.dataset.id));
      });
    }

    async function onDelete(id) {
      if (!confirm('Supprimer cet utilisateur et toutes ses conversations ?')) return;
      const res = await fetch('/admin/api/users/' + id, { method: 'DELETE' });
      if (res.ok) {
        await Promise.all([loadStats(), loadUsers()]);
      } else {
        alert('Échec de la suppression.');
      }
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    loadStats();
    loadUsers();
  </script>
</body>
</html>`;
