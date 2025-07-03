document.addEventListener('DOMContentLoaded', function () {
  const usuario = localStorage.getItem('usuarioLogado') || 'anonimo';

  const themeButtons = document.querySelectorAll('.theme-btn');
  const progressSlider = document.getElementById('course-progress');
  const progressValue = document.querySelector('.progress-value');
  const challengeItems = document.querySelectorAll('.challenge-item input');
  const courseForm = document.getElementById('courseForm');
  const courseFilter = document.getElementById('course-filter');
  const coursesGrid = document.getElementById('coursesGrid');

  const formTarefa = document.getElementById('formTarefa');
  const inputTarefa = document.getElementById('novaTarefa');
  const listaTarefas = document.getElementById('listaTarefas');

  let cursos = JSON.parse(localStorage.getItem(`cursos_${usuario}`)) || [];
  let tarefas = JSON.parse(localStorage.getItem(`tarefas_${usuario}`)) || [];

  loadTheme();
  renderCourses();
  updateGeneralProgress();
  updateChallengesProgress();
  renderizarTarefas();
  setupEventListeners();

  function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function setupEventListeners() {
    themeButtons.forEach(button => {
      button.addEventListener('click', function () {
        const theme = this.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        showToast(`Tema ${theme === 'dark' ? 'escuro' : theme === 'gamer' ? 'gamer' : 'claro'} ativado!`, 'info');
      });
    });

    progressSlider.addEventListener('input', function () {
      progressValue.textContent = `${this.value}%`;
    });

    challengeItems.forEach(item => {
      item.addEventListener('change', function () {
        const parent = this.parentElement;
        parent.classList.toggle('completed', this.checked);
        updateChallengesProgress();
      });
    });

    courseForm.addEventListener('submit', handleAddCourse);

    courseFilter.addEventListener('change', function () {
      renderCourses(this.value);
    });

    formTarefa.addEventListener('submit', function (e) {
      e.preventDefault();
      const texto = inputTarefa.value.trim();
      if (texto === '') {
        alert('Digite uma tarefa válida!');
        return;
      }
      tarefas.push({ texto, concluida: false });
      salvarTarefas();
      renderizarTarefas();
      inputTarefa.value = '';
    });
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'i'}</span>
      <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function renderCourses(filter = 'all') {
    coursesGrid.innerHTML = '';

    const cursosFiltrados =
      filter === 'all'
        ? cursos
        : cursos.filter(curso => curso.status === filter);

    if (cursosFiltrados.length === 0) {
      coursesGrid.innerHTML = '<div class="no-courses"><p>Nenhum curso encontrado</p></div>';
      return;
    }

    cursosFiltrados.forEach(curso => {
      const card = document.createElement('div');
      card.className = 'course-card';

      card.innerHTML = `
        <div class="course-header">
          <h3>${curso.nome}</h3>
          <span class="course-status status-${curso.status.replace(' ', '-')}">${formatStatus(curso.status)}</span>
        </div>
        <div class="course-details">
          <p><strong>Área:</strong> ${curso.area}</p>
          <p><strong>Carga horária:</strong> ${curso.carga}h</p>
          <p class="course-notes">${curso.anotacoes || ''}</p>
        </div>
        <div class="course-progress">
          <progress value="${curso.progresso}" max="100"></progress>
          <span>${curso.progresso}% concluído</span>
        </div>
        <div class="course-actions">
          <button class="btn edit-btn" data-id="${curso.id}">Editar</button>
          <button class="btn delete-btn" data-id="${curso.id}">Excluir</button>
        </div>
      `;

      coursesGrid.appendChild(card);

      card.querySelector('.edit-btn').addEventListener('click', () => editCourse(curso.id));
      card.querySelector('.delete-btn').addEventListener('click', () => deleteCourse(curso.id));
    });

    updateGeneralProgress();
  }

  function formatStatus(status) {
    switch (status) {
      case 'planned': return 'Planejado';
      case 'in-progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'paused': return 'Pausado';
      default: return status;
    }
  }

  function handleAddCourse(e) {
    e.preventDefault();

    const nome = document.getElementById('course-name').value.trim();
    const area = document.getElementById('course-area').value.trim();
    const carga = parseInt(document.getElementById('course-hours').value, 10);
    const status = document.getElementById('course-status').value;
    const progresso = parseInt(document.getElementById('course-progress').value, 10);
    const anotacoes = document.getElementById('course-notes').value.trim();

    if (!nome || !area || !carga || isNaN(carga)) {
      alert('Preencha os campos corretamente.');
      return;
    }

    if (courseForm.dataset.editId) {
      const editId = courseForm.dataset.editId;
      const cursoIndex = cursos.findIndex(c => c.id === editId);
      if (cursoIndex > -1) {
        cursos[cursoIndex] = {
          id: editId,
          nome,
          area,
          carga,
          status,
          progresso,
          anotacoes
        };
        delete courseForm.dataset.editId;
        courseForm.querySelector('.submit-btn').textContent = 'Adicionar Curso';
        showToast('Curso atualizado com sucesso!');
      }
    } else {
      const novoCurso = {
        id: gerarId(),
        nome,
        area,
        carga,
        status,
        progresso,
        anotacoes
      };
      cursos.push(novoCurso);
      showToast('Curso adicionado com sucesso!');
    }

    salvarCursos();
    renderCourses(courseFilter.value);
    courseForm.reset();
    progressValue.textContent = '0%';
    progressSlider.value = 0;
  }

  function gerarId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  function salvarCursos() {
    localStorage.setItem(`cursos_${usuario}`, JSON.stringify(cursos));
  }

  function deleteCourse(id) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    cursos = cursos.filter(c => c.id !== id);
    salvarCursos();
    renderCourses(courseFilter.value);
    showToast('Curso excluído.');
  }

  function editCourse(id) {
    const curso = cursos.find(c => c.id === id);
    if (!curso) return;
    document.getElementById('course-name').value = curso.nome;
    document.getElementById('course-area').value = curso.area;
    document.getElementById('course-hours').value = curso.carga;
    document.getElementById('course-status').value = curso.status;
    document.getElementById('course-progress').value = curso.progresso;
    document.querySelector('.progress-value').textContent = `${curso.progresso}%`;
    document.getElementById('course-notes').value = curso.anotacoes;
    courseForm.dataset.editId = id;
    courseForm.querySelector('.submit-btn').textContent = 'Salvar Alterações';
  }

  function updateGeneralProgress() {
    if (cursos.length === 0) {
      updateSummary(0, 0, 0);
      return;
    }

    const totalCarga = cursos.reduce((acc, c) => acc + c.carga, 0);
    const cargaConcluida = cursos.reduce((acc, c) => acc + (c.carga * (c.progresso / 100)), 0);
    const cursosConcluidos = cursos.filter(c => c.status === 'completed').length;

    const progressoPercent = totalCarga === 0 ? 0 : Math.round((cargaConcluida / totalCarga) * 100);

    updateSummary(progressoPercent, cursos.length, cursosConcluidos);
  }

  function updateSummary(progressPercent, totalCursos, concluidos) {
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentSpan = document.querySelector('.progress-percent');

    progressFill.style.width = progressPercent + '%';
    progressPercentSpan.textContent = progressPercent + '%';

    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3) {
      statCards[0].querySelector('.stat-value').textContent = totalCursos;
      statCards[1].querySelector('.stat-value').textContent = '0h';
      statCards[2].querySelector('.stat-value').textContent = concluidos;
    }
  }

  function updateChallengesProgress() {
    const total = challengeItems.length;
    const completos = Array.from(challengeItems).filter(i => i.checked).length;
    const badge = document.querySelector('.section-badge');
    if (badge) {
      badge.textContent = `${completos}/${total} completos`;
    }
  }

  function salvarTarefas() {
    localStorage.setItem(`tarefas_${usuario}`, JSON.stringify(tarefas));
  }

  function renderizarTarefas() {
    listaTarefas.innerHTML = '';

    if (tarefas.length === 0) {
      listaTarefas.innerHTML = '<li>Nenhuma tarefa cadastrada.</li>';
      return;
    }

    tarefas.forEach((tarefa, index) => {
      const li = document.createElement('li');
      li.className = tarefa.concluida ? 'concluida' : '';
      li.innerHTML = `
        <input type="checkbox" ${tarefa.concluida ? 'checked' : ''} data-index="${index}" />
        <span>${tarefa.texto}</span>
        <button data-index="${index}" aria-label="Excluir tarefa">&times;</button>
      `;

      listaTarefas.appendChild(li);
    });

    listaTarefas.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const idx = this.dataset.index;
        tarefas[idx].concluida = this.checked;
        salvarTarefas();
        renderizarTarefas();
      });
    });

    listaTarefas.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = this.dataset.index;
        tarefas.splice(idx, 1);
        salvarTarefas();
        renderizarTarefas();
      });
    });
  }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html'; 
  });
}
