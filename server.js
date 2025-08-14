const http = require('http');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const POSTS_DIR = path.join(__dirname, 'posts');

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    case '.json': return 'application/json; charset=utf-8';
    case '.txt': return 'text/plain; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

function servePublicAsset(req, res) {
  const rel = req.url.replace('/public/', '');
  const resolvedPath = path.resolve(PUBLIC_DIR, rel);
  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(resolvedPath) });
    res.end(data);
  });
}

function serveHome(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
}

function serveStyles(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css; charset=utf-8');
}

function serveScript(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'main.js'), 'application/javascript; charset=utf-8');
}

function serveStaticHtml(res, filename) {
  const filePath = path.join(PUBLIC_DIR, filename);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

function readPostTitle(markdownContent) {
  const lines = markdownContent.split(/\r?\n/);
  for (const line of lines) {
    const m = /^#\s+(.+)$/.exec(line.trim());
    if (m) return m[1].trim();
  }
  return '';
}

function servePostsApi(res) {
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error reading posts' }));
      return;
    }
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const results = [];
    let pending = mdFiles.length;
    if (pending === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }
    mdFiles.forEach(file => {
      fs.readFile(path.join(POSTS_DIR, file), 'utf8', (readErr, content) => {
        const slug = file.replace(/\.md$/, '');
        const title = readErr ? '' : readPostTitle(content) || slug.replace(/-/g, ' ');
        results.push({ slug, title });
        pending -= 1;
        if (pending === 0) {
          results.sort((a, b) => a.slug.localeCompare(b.slug));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(results));
        }
      });
    });
  });
}

function serveBlogList(res) {
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error reading posts');
      return;
    }
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const results = [];
    let pending = mdFiles.length;
    if (pending === 0) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blog</title><link rel="stylesheet" href="/public/styles.css"></head><body><header class="site-header"><div class="container"><div class="brand">Haris Mumtaz</div><nav><a href="/">Home</a> <a href="/blog">Blog</a> <a href="/about">About</a> <a href="/newsletter">Newsletter</a> <select id=\"headerPostSelect\" class=\"header-post-select\" aria-label=\"Go to a blog post\"><option value=\"\" selected>Posts…</option></select></nav></div></header><main class="container"><h1 class="page-title">Blog Posts</h1><p class="lead">Latest articles and notes.</p><ul class="blog-list"></ul><a class="back-link" href="/">Back to Home</a></main></body></html>`);
      return;
    }
    mdFiles.forEach(file => {
      fs.readFile(path.join(POSTS_DIR, file), 'utf8', (readErr, content) => {
        const slug = file.replace(/\.md$/, '');
        const title = readErr ? '' : readPostTitle(content) || slug.replace(/-/g, ' ');
        results.push({ slug, title });
        pending -= 1;
        if (pending === 0) {
          results.sort((a, b) => a.slug.localeCompare(b.slug));
          let list = '<h1 class="page-title">Blog Posts</h1><p class="lead">Latest articles and notes.</p><ul class="blog-list">';
          results.forEach(p => {
            list += `<li><a href="/blog/${p.slug}">${p.title}</a></li>`;
          });
          list += '</ul><a class="back-link" href="/">Back to Home</a>';
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Blog</title><link rel="stylesheet" href="/public/styles.css"></head><body><header class="site-header"><div class="container"><div class="brand">Haris Mumtaz</div><nav><a href="/">Home</a> <a href="/blog">Blog</a> <a href="/about">About</a> <a href="/newsletter">Newsletter</a> <select id=\"headerPostSelect\" class=\"header-post-select\" aria-label=\"Go to a blog post\"><option value=\"\" selected>Posts…</option></select></nav></div></header><main class="container">${list}</main></body></html>`);
        }
      });
    });
  });
}

function serveBlogPost(res, postName) {
  const filePath = path.join(POSTS_DIR, postName + '.md');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Post not found');
      return;
    }
    const html = marked.parse(data);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${postName.replace(/-/g, ' ')}</title><link rel="stylesheet" href="/public/styles.css"></head><body><header class="site-header"><div class="container"><div class="brand">Haris Mumtaz</div><nav><a href="/">Home</a> <a href="/blog">Blog</a> <a href="/about">About</a> <a href="/newsletter">Newsletter</a> <select id="headerPostSelect" class="header-post-select" aria-label="Go to a blog post"><option value="" selected>Posts…</option></select></nav></div></header><main class="container">${html}<p><a href="/blog">Back to Blog</a></p></main></body></html>`);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    serveHome(res);
  } else if (req.url.startsWith('/public/')) {
    servePublicAsset(req, res);
  } else if (req.url === '/api/posts') {
    servePostsApi(res);
  } else if (req.url === '/blog') {
    serveBlogList(res);
  } else if (req.url === '/about') {
    serveStaticHtml(res, 'about.html');
  } else if (req.url === '/newsletter') {
    serveStaticHtml(res, 'newsletter.html');
  } else if (req.url.startsWith('/blog/')) {
    const postName = req.url.replace('/blog/', '');
    serveBlogPost(res, postName);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
