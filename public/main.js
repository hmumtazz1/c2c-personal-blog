(function() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Newsletter placeholder UX
  const nlEmail = document.getElementById('nlEmail');
  const nlSubmit = document.getElementById('nlSubmit');
  const nlNote = document.getElementById('nlNote');
  if (nlEmail && nlSubmit && nlNote) {
    nlSubmit.addEventListener('click', () => {
      const email = (nlEmail.value || '').trim();
      if (!email) {
        nlNote.textContent = 'Please enter your email address.';
        return;
      }
      nlNote.textContent = 'Thanks! This is a visual placeholder. We will connect this soon.';
      nlEmail.value = '';
    });
  }

  // Header post dropdown (navigates on change)
  const headerSelect = document.getElementById('headerPostSelect');
  if (!headerSelect) return;

  fetch('/api/posts')
    .then(r => r.json())
    .then(posts => {
      headerSelect.innerHTML = '<option value="" selected>Posts…</option>';
      posts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.slug;
        opt.textContent = p.title || p.slug.replace(/-/g, ' ');
        headerSelect.appendChild(opt);
      });
      headerSelect.addEventListener('change', () => {
        if (headerSelect.value) window.location.href = '/blog/' + headerSelect.value;
      });
    })
    .catch(() => {
      headerSelect.innerHTML = '<option value="" disabled>Posts unavailable</option>';
    });
})();
