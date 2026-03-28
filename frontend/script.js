const API_BASE = '/api';

const state = {
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null')
};

const appLoader = document.getElementById('loader');
const toast = document.getElementById('toast');

const setLoader = (isLoading) => {
  if (!appLoader) {
    return;
  }
  appLoader.classList.toggle('show', isLoading);
};

const notify = (message, type = 'success') => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 2200);
};

const authHeader = () => {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
};

const apiFetch = async (url, options = {}) => {
  setLoader(true);
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && state.token) {
      notify('Session invalide. Veuillez vous reconnecter.', 'error');
      logout();
      throw new Error(data.message || 'Session invalide.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Erreur API');
    }

    return data;
  } finally {
    setLoader(false);
  }
};

const saveAuth = (payload) => {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem('token', payload.token);
  localStorage.setItem('user', JSON.stringify(payload.user));
};

const logout = () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};

const updateNavbar = () => {
  const authSpot = document.getElementById('authSpot');
  if (!authSpot) {
    return;
  }

  if (!state.user) {
    authSpot.innerHTML = '<a href="/login.html">Connexion</a><a href="/register.html">Inscription</a>';
    return;
  }

  authSpot.innerHTML = `
    <a href="/dashboard.html">Dashboard</a>
    <a href="#" id="logoutLink">Deconnexion</a>
  `;

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  }
};

const renderEmpty = (container, message = 'Aucun element.') => {
  container.innerHTML = `<p class="empty">${message}</p>`;
};

const levelLabel = {
  debutant: 'Debutant',
  intermediaire: 'Intermediaire',
  avance: 'Avance'
};

const initHome = async () => {
  const container = document.getElementById('homeCourses');
  const searchInput = document.getElementById('homeSearchInput');
  const searchBtn = document.getElementById('homeSearchBtn');

  if (!container) {
    return;
  }

  const render = (courses) => {
    if (!courses.length) {
      renderEmpty(container, 'Aucun cours trouve');
      return;
    }

    container.innerHTML = courses
      .map(
        (course) => `
          <article class="card">
            <span class="pill">${course.category?.name || 'Categorie'}</span>
            <h3>${course.title}</h3>
            <p>${course.description.slice(0, 120)}...</p>
            <div class="card-footer">
              <small>${levelLabel[course.level] || course.level}</small>
              <a class="btn" href="/lesson.html?courseId=${course._id}">Voir lecons</a>
            </div>
          </article>
        `
      )
      .join('');
  };

  const loadCourses = async () => {
    try {
      const courses = await apiFetch('/courses');
      render(courses);
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  await loadCourses();

  const doSearch = async () => {
    try {
      const q = searchInput.value.trim();
      const url = q ? `/courses/search?q=${encodeURIComponent(q)}` : '/courses';
      const courses = await apiFetch(url);
      render(courses);
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  if (searchBtn) {
    searchBtn.addEventListener('click', doSearch);
  }
  if (searchInput) {
    searchInput.addEventListener('input', doSearch);
  }
};

const initCategories = async () => {
  const container = document.getElementById('categoriesList');
  if (!container) {
    return;
  }

  try {
    const categories = await apiFetch('/categories');
    if (!categories.length) {
      renderEmpty(container, 'Aucune categorie disponible.');
      return;
    }

    container.innerHTML = categories
      .map(
        (category) => `
          <article class="card">
            <h3>${category.name}</h3>
            <p>${category.description || 'Sans description.'}</p>
            <div class="card-footer">
              <a class="btn" href="/courses.html?category=${category._id}">Voir les cours</a>
            </div>
          </article>
        `
      )
      .join('');
  } catch (error) {
    notify(error.message, 'error');
  }
};

const initCourses = async () => {
  const container = document.getElementById('coursesList');
  const searchInput = document.getElementById('courseSearchInput');
  const levelFilter = document.getElementById('levelFilter');
  const categoryFilter = document.getElementById('categoryFilter');

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const preCategory = params.get('category');

  const categories = await apiFetch('/categories').catch(() => []);
  categoryFilter.innerHTML = '<option value="">Toutes les categories</option>';
  categories.forEach((category) => {
    categoryFilter.innerHTML += `<option value="${category._id}">${category.name}</option>`;
  });

  if (preCategory) {
    categoryFilter.value = preCategory;
  }

  const render = (courses) => {
    if (!courses.length) {
      renderEmpty(container, 'Aucun cours trouve');
      return;
    }

    container.innerHTML = courses
      .map(
        (course) => `
          <article class="card">
            <span class="pill">${course.category?.name || 'Categorie'}</span>
            <h3>${course.title}</h3>
            <p>${course.description.slice(0, 140)}...</p>
            <div class="card-footer">
              <small>${levelLabel[course.level] || course.level}</small>
              <a class="btn" href="/lesson.html?courseId=${course._id}">Continuer</a>
            </div>
          </article>
        `
      )
      .join('');
  };

  const load = async () => {
    try {
      const q = searchInput.value.trim();
      const level = levelFilter.value;
      const category = categoryFilter.value;

      if (q) {
        const found = await apiFetch(`/courses/search?q=${encodeURIComponent(q)}`);
        const filtered = found.filter((course) => {
          const byLevel = level ? course.level === level : true;
          const byCategory = category ? course.category?._id === category : true;
          return byLevel && byCategory;
        });
        render(filtered);
        return;
      }

      const urlParams = new URLSearchParams();
      if (level) {
        urlParams.set('level', level);
      }
      if (category) {
        urlParams.set('category', category);
      }

      const suffix = urlParams.toString() ? `?${urlParams.toString()}` : '';
      const courses = await apiFetch(`/courses${suffix}`);
      render(courses);
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  searchInput.addEventListener('input', load);
  levelFilter.addEventListener('change', load);
  categoryFilter.addEventListener('change', load);

  await load();
};

const initLessons = async () => {
  const listContainer = document.getElementById('lessonList');
  const detailsContainer = document.getElementById('lessonDetails');
  if (!listContainer || !detailsContainer) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('courseId');

  if (!courseId) {
    renderEmpty(listContainer, 'Cours non specifie.');
    return;
  }

  const renderDetails = (lesson) => {
    detailsContainer.innerHTML = `
      <article class="content-block">
        <h2>${lesson.title}</h2>
        <p style="margin-top:0.6rem">${lesson.content}</p>
        <h3 style="margin-top:1rem">Code exemple</h3>
        <pre>${lesson.codeExample || 'Aucun exemple de code.'}</pre>
        <h3 style="margin-top:1rem">Exercice</h3>
        <p>${lesson.exercise || 'Aucun exercice pour le moment.'}</p>
      </article>
    `;
  };

  try {
    const lessons = await apiFetch(`/lessons/course/${courseId}`);
    if (!lessons.length) {
      renderEmpty(listContainer, 'Aucune lecon disponible pour ce cours.');
      return;
    }

    listContainer.innerHTML = lessons
      .map(
        (lesson, index) => `
          <button class="btn btn-outline lesson-item" data-id="${lesson._id}" style="width:100%;text-align:left;${
          index > 0 ? 'margin-top:0.5rem' : ''
        }">
            ${index + 1}. ${lesson.title}
          </button>
        `
      )
      .join('');

    renderDetails(lessons[0]);

    listContainer.querySelectorAll('.lesson-item').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const lesson = await apiFetch(`/lessons/${btn.dataset.id}`);
          renderDetails(lesson);
        } catch (error) {
          notify(error.message, 'error');
        }
      });
    });
  } catch (error) {
    notify(error.message, 'error');
  }
};

const initLogin = () => {
  const form = document.getElementById('loginForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      email: form.email.value,
      password: form.password.value
    };

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveAuth(data);
      notify('Connexion reussie');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 700);
    } catch (error) {
      notify(error.message, 'error');
    }
  });
};

const initRegister = () => {
  const form = document.getElementById('registerForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
      adminSecret: form.adminSecret.value
    };

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveAuth(data);
      notify('Inscription reussie');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 700);
    } catch (error) {
      notify(error.message, 'error');
    }
  });
};

const initDashboard = async () => {
  const dashRoot = document.getElementById('dashboardRoot');
  if (!dashRoot) {
    return;
  }

  if (!state.token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const me = await apiFetch('/auth/me');
    if (!me.isAdmin) {
      dashRoot.innerHTML = '<p class="empty">Acces refuse. Compte administrateur requis.</p>';
      return;
    }
  } catch (error) {
    notify('Session invalide. Veuillez vous reconnecter.', 'error');
    logout();
    return;
  }

  const categoryForm = document.getElementById('categoryForm');
  const courseForm = document.getElementById('courseForm');
  const lessonForm = document.getElementById('lessonForm');
  const categoriesAdminList = document.getElementById('categoriesAdminList');
  const coursesAdminList = document.getElementById('coursesAdminList');
  const lessonsAdminList = document.getElementById('lessonsAdminList');

  const categoryCourseSelect = document.getElementById('courseCategory');
  const lessonCourseSelect = document.getElementById('lessonCourse');

  const loadCategories = async () => {
    const categories = await apiFetch('/categories');

    if (!categories.length) {
      categoriesAdminList.innerHTML = '<p class="empty">Aucune categorie.</p>';
    } else {
      categoriesAdminList.innerHTML = categories
        .map(
          (category) => `
            <div class="list-item">
              <div>
                <strong>${category.name}</strong>
                <p>${category.description || ''}</p>
              </div>
              <div class="list-item-actions">
                <button class="btn btn-danger" data-delete-category="${category._id}">Supprimer</button>
              </div>
            </div>
          `
        )
        .join('');
    }

    categoryCourseSelect.innerHTML = '<option value="">Categorie</option>';
    categories.forEach((category) => {
      categoryCourseSelect.innerHTML += `<option value="${category._id}">${category.name}</option>`;
    });

    categoriesAdminList.querySelectorAll('[data-delete-category]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!window.confirm('Supprimer cette categorie ?')) {
          return;
        }
        try {
          await apiFetch(`/categories/${btn.dataset.deleteCategory}`, { method: 'DELETE' });
          notify('Categorie supprimee');
          await Promise.all([loadCategories(), loadCourses()]);
        } catch (error) {
          notify(error.message, 'error');
        }
      });
    });

    return categories;
  };

  const loadCourses = async () => {
    const courses = await apiFetch('/courses');

    if (!courses.length) {
      coursesAdminList.innerHTML = '<p class="empty">Aucun cours.</p>';
    } else {
      coursesAdminList.innerHTML = courses
        .map(
          (course) => `
            <div class="list-item">
              <div>
                <strong>${course.title}</strong>
                <p>${course.category?.name || 'Sans categorie'} - ${levelLabel[course.level] || course.level}</p>
              </div>
              <div class="list-item-actions">
                <button class="btn btn-danger" data-delete-course="${course._id}">Supprimer</button>
              </div>
            </div>
          `
        )
        .join('');
    }

    lessonCourseSelect.innerHTML = '<option value="">Cours</option>';
    courses.forEach((course) => {
      lessonCourseSelect.innerHTML += `<option value="${course._id}">${course.title}</option>`;
    });

    coursesAdminList.querySelectorAll('[data-delete-course]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!window.confirm('Supprimer ce cours ?')) {
          return;
        }
        try {
          await apiFetch(`/courses/${btn.dataset.deleteCourse}`, { method: 'DELETE' });
          notify('Cours supprime');
          await Promise.all([loadCourses(), loadLessons()]);
        } catch (error) {
          notify(error.message, 'error');
        }
      });
    });

    return courses;
  };

  const loadLessons = async () => {
    const courses = await apiFetch('/courses');
    let allLessons = [];

    for (const course of courses) {
      const lessons = await apiFetch(`/lessons/course/${course._id}`).catch(() => []);
      allLessons = allLessons.concat(
        lessons.map((lesson) => ({
          ...lesson,
          courseTitle: course.title
        }))
      );
    }

    if (!allLessons.length) {
      lessonsAdminList.innerHTML = '<p class="empty">Aucune lecon.</p>';
    } else {
      lessonsAdminList.innerHTML = allLessons
        .map(
          (lesson) => `
            <div class="list-item">
              <div>
                <strong>${lesson.title}</strong>
                <p>${lesson.courseTitle}</p>
              </div>
              <div class="list-item-actions">
                <button class="btn btn-danger" data-delete-lesson="${lesson._id}">Supprimer</button>
              </div>
            </div>
          `
        )
        .join('');
    }

    lessonsAdminList.querySelectorAll('[data-delete-lesson]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!window.confirm('Supprimer cette lecon ?')) {
          return;
        }
        try {
          await apiFetch(`/lessons/${btn.dataset.deleteLesson}`, { method: 'DELETE' });
          notify('Lecon supprimee');
          await loadLessons();
        } catch (error) {
          notify(error.message, 'error');
        }
      });
    });
  };

  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: categoryForm.name.value,
          description: categoryForm.description.value
        })
      });
      categoryForm.reset();
      notify('Categorie ajoutee');
      await loadCategories();
    } catch (error) {
      notify(error.message, 'error');
    }
  });

  courseForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!courseForm.category.value) {
      notify('Veuillez selectionner une categorie.', 'error');
      return;
    }

    try {
      await apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: courseForm.title.value,
          description: courseForm.description.value,
          category: courseForm.category.value,
          level: courseForm.level.value
        })
      });
      courseForm.reset();
      notify('Cours ajoute');
      await loadCourses();
    } catch (error) {
      notify(error.message, 'error');
    }
  });

  lessonForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!lessonForm.course.value) {
      notify('Veuillez selectionner un cours.', 'error');
      return;
    }

    try {
      await apiFetch('/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: lessonForm.title.value,
          content: lessonForm.content.value,
          codeExample: lessonForm.codeExample.value,
          exercise: lessonForm.exercise.value,
          course: lessonForm.course.value
        })
      });
      lessonForm.reset();
      notify('Lecon ajoutee');
      await loadLessons();
    } catch (error) {
      notify(error.message, 'error');
    }
  });

  await loadCategories();
  await loadCourses();
  await loadLessons();
};

document.addEventListener('DOMContentLoaded', async () => {
  updateNavbar();

  const page = document.body.dataset.page;

  if (page === 'home') {
    await initHome();
  }
  if (page === 'categories') {
    await initCategories();
  }
  if (page === 'courses') {
    await initCourses();
  }
  if (page === 'lesson') {
    await initLessons();
  }
  if (page === 'login') {
    initLogin();
  }
  if (page === 'register') {
    initRegister();
  }
  if (page === 'dashboard') {
    await initDashboard();
  }
});
