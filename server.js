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

function serveBlogList(res) {
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading posts');
      return;
    }
    let list = '<h1>Blog Posts</h1><ul>';
    files.forEach(file => {
      const postName = file.replace(/\.md$/, '');
      list += `<li><a href="/blog/${postName}">${postName.replace(/-/g, ' ')}</a></li>`;
    });
    list += '</ul><a href="/">Back to Home</a>';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><title>Blog</title><link rel="stylesheet" href="/public/styles.css"></head><body><nav><a href="/">Home</a> | <a href="/blog">Blog</a></nav><main>${list}</main></body></html>`);
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
    res.end(`<!DOCTYPE html><html><head><title>${postName.replace(/-/g, ' ')}</title><link rel="stylesheet" href="/public/styles.css"></head><body><nav><a href="/">Home</a> | <a href="/blog">Blog</a></nav><main>${html}<p><a href="/blog">Back to Blog</a></p></main></body></html>`);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    serveHome(res);
  } else if (req.url === '/public/styles.css') {
    serveStyles(res);
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
