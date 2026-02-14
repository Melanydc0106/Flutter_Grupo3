const STORAGE_KEYS = {
  users: 'gta_users',
  tasks: 'gta_tasks',
  session: 'gta_session'
};

const state = {
  users: JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]'),
  tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]'),
  session: JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null'),
  accountEdit: false
};

const views = {
  landing: document.getElementById('landing-view'),
  auth: document.getElementById('auth-view'),
  portal: document.getElementById('portal-view'),
  loginCard: document.getElementById('login-card'),
  registerCard: document.getElementById('register-card')
};

const forms = {
  register: document.getElementById('register-form'),
  login: document.getElementById('login-form'),
  task: document.getElementById('task-form'),
  password: document.getElementById('password-form')
};

function persist() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(state.session));
}

function show(view) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  if (view === 'landing') views.landing.classList.remove('hidden');
  if (view === 'auth') views.auth.classList.remove('hidden');
  if (view === 'portal') views.portal.classList.remove('hidden');
}

function showAuthCard(card) {
  views.loginCard.classList.toggle('hidden', card !== 'login');
  views.registerCard.classList.toggle('hidden', card !== 'register');
}

function goToPortal() {
  show('portal');
  renderAll();
}

function login(email, password) {
  const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    alert('Credenciales incorrectas.');
    return;
  }
  state.session = { email: user.email };
  persist();
  goToPortal();
}

function register(name, email, password) {
  const exists = state.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    alert('Ese correo ya está registrado.');
    return;
  }
  state.users.push({ name, email, password, birth: '', phone: '' });
  persist();
  alert('Cuenta creada. Ahora inicia sesión.');
  showAuthCard('login');
}

function currentUser() {
  if (!state.session) return null;
  return state.users.find(u => u.email === state.session.email) || null;
}

function currentUserTasks() {
  const user = currentUser();
  if (!user) return [];
  return state.tasks.filter(t => t.owner === user.email);
}

function addTask(name, dueDate) {
  const user = currentUser();
  state.tasks.push({
    id: crypto.randomUUID(),
    owner: user.email,
    name,
    dueDate,
    status: 'pending',
    completedAt: ''
  });
  persist();
  renderTasks();
}

function markTaskDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.status = 'done';
  task.completedAt = new Date().toISOString().slice(0, 10);
  persist();
  renderTasks();
}

function renderTasks() {
  const pendingBody = document.getElementById('pending-table');
  const completedBody = document.getElementById('completed-table');
  const search = document.getElementById('pending-search').value.toLowerCase().trim();
  const tasks = currentUserTasks();

  const pending = tasks.filter(t => t.status === 'pending' && t.name.toLowerCase().includes(search));
  const completed = tasks.filter(t => t.status === 'done');

  pendingBody.innerHTML = pending.length
    ? pending.map(t => `
      <tr>
        <td>${t.name}</td>
        <td>${t.dueDate}</td>
        <td><button class="btn btn-success" data-action="done" data-id="${t.id}">Tarea completa</button></td>
      </tr>
    `).join('')
    : '<tr><td colspan="3">No hay tareas pendientes.</td></tr>';

  completedBody.innerHTML = completed.length
    ? completed.map(t => `
      <tr>
        <td>${t.name}</td>
        <td>${t.completedAt || '-'}</td>
        <td><span class="tag done">Finalizada</span></td>
      </tr>
    `).join('')
    : '<tr><td colspan="3">No hay tareas completas.</td></tr>';
}

function renderAccount() {
  const user = currentUser();
  if (!user) return;
  document.getElementById('account-name').value = user.name || '';
  document.getElementById('account-birth').value = user.birth || '';
  document.getElementById('account-phone').value = user.phone || '';
  document.getElementById('account-email').value = user.email || '';
}

function setAccountEditable(enabled) {
  ['account-name', 'account-birth', 'account-phone'].forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });
  state.accountEdit = enabled;
  document.getElementById('btn-edit-account').textContent = enabled ? 'Guardar Datos' : 'Editar Datos';
}

function renderAll() {
  renderTasks();
  renderAccount();
}

// navegación principal
document.getElementById('btn-open-login').addEventListener('click', () => {
  show('auth');
  showAuthCard('login');
});
document.getElementById('btn-open-register').addEventListener('click', () => {
  show('auth');
  showAuthCard('register');
});
document.getElementById('btn-go-login-task').addEventListener('click', () => {
  show('auth');
  showAuthCard('login');
});
document.getElementById('btn-go-login-dashboard').addEventListener('click', () => {
  show('auth');
  showAuthCard('login');
});

document.getElementById('link-to-register').addEventListener('click', () => showAuthCard('register'));
document.getElementById('link-to-login').addEventListener('click', () => showAuthCard('login'));

forms.register.addEventListener('submit', (e) => {
  e.preventDefault();
  register(
    document.getElementById('register-name').value.trim(),
    document.getElementById('register-email').value.trim(),
    document.getElementById('register-password').value
  );
  forms.register.reset();
});

forms.login.addEventListener('submit', (e) => {
  e.preventDefault();
  login(
    document.getElementById('login-email').value.trim(),
    document.getElementById('login-password').value
  );
  forms.login.reset();
});

forms.task.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(
    document.getElementById('task-name').value.trim(),
    document.getElementById('task-date').value
  );
  forms.task.reset();
  switchSection('pendientes');
});

document.getElementById('pending-search').addEventListener('input', renderTasks);

document.getElementById('pending-table').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="done"]');
  if (!btn) return;
  markTaskDone(btn.dataset.id);
});

document.querySelectorAll('.side-link').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

function switchSection(section) {
  document.querySelectorAll('.side-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${section}`).classList.remove('hidden');
}

document.getElementById('btn-edit-account').addEventListener('click', () => {
  const user = currentUser();
  if (!state.accountEdit) {
    setAccountEditable(true);
    return;
  }
  user.name = document.getElementById('account-name').value.trim();
  user.birth = document.getElementById('account-birth').value;
  user.phone = document.getElementById('account-phone').value.trim();
  persist();
  setAccountEditable(false);
  alert('Datos guardados.');
});

document.getElementById('btn-change-password').addEventListener('click', () => {
  forms.password.classList.toggle('hidden');
});

forms.password.addEventListener('submit', (e) => {
  e.preventDefault();
  const p1 = document.getElementById('new-password').value;
  const p2 = document.getElementById('repeat-password').value;
  if (p1 !== p2) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  const user = currentUser();
  user.password = p1;
  persist();
  forms.password.reset();
  forms.password.classList.add('hidden');
  alert('Contraseña actualizada.');
});

const logoutDialog = document.getElementById('logout-dialog');
document.getElementById('btn-logout').addEventListener('click', () => logoutDialog.showModal());
document.getElementById('cancel-logout').addEventListener('click', () => logoutDialog.close());
document.getElementById('confirm-logout').addEventListener('click', () => {
  state.session = null;
  persist();
  logoutDialog.close();
  show('landing');
});

if (state.session && currentUser()) {
  goToPortal();
} else {
  show('landing');
}
