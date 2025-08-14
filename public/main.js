(function() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const select = document.getElementById('postSelect');
  const btn = document.getElementById('readPostBtn');
  if (!select || !btn) return;

  fetch('/api/posts')
    .then(r => r.json())
    .then(posts => {
      select.innerHTML = '<option value="" selected disabled>Select a post…</option>';
      posts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.slug;
        opt.textContent = p.title || p.slug.replace(/-/g, ' ');
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        btn.disabled = !select.value;
      });
      btn.addEventListener('click', () => {
        if (select.value) window.location.href = '/blog/' + select.value;
      });
    })
    .catch(() => {
      select.innerHTML = '<option value="" disabled>Could not load posts</option>';
      btn.disabled = true;
    });
})();
