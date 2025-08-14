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

function serveHome(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html');
}

function serveStyles(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css');
}

function serveScript(res) {
  serveFile(res, path.join(PUBLIC_DIR, 'main.js'), 'application/javascript');
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
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading posts');
      return;
    }
    let list = '<h1>Blog Posts</h1><ul>';
    files.forEach(file => {
      if (!file.endsWith('.md')) return;
      const postName = file.replace(/\.md$/, '');
      list += `<li><a href="/blog/${postName}">${postName.replace(/-/g, ' ')}</a></li>`;
    });
    list += '</ul><a href="/">Back to Home</a>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><title>Blog</title><link rel="stylesheet" href="/public/styles.css"></head><body><header class="site-header"><div class="container"><div class="brand">C2C Blog</div><nav><a href="/">Home</a> <a href="/blog">Blog</a></nav></div></header><main class="container">${list}</main></body></html>`);
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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><title>${postName.replace(/-/g, ' ')}</title><link rel="stylesheet" href="/public/styles.css"></head><body><header class="site-header"><div class="container"><div class="brand">C2C Blog</div><nav><a href="/">Home</a> <a href="/blog">Blog</a></nav></div></header><main class="container">${html}<p><a href="/blog">Back to Blog</a></p></main></body></html>`);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    serveHome(res);
  } else if (req.url === '/public/styles.css') {
    serveStyles(res);
  } else if (req.url === '/public/main.js') {
    serveScript(res);
  } else if (req.url === '/api/posts') {
    servePostsApi(res);
  } else if (req.url === '/blog') {
    serveBlogList(res);
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
