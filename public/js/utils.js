/* ===========================================
   UTILITY FUNCTIONS
   =========================================== */

// Helper: shorthand for document.getElementById
const $ = (id) => document.getElementById(id);

// Helper: Bootstrap Modal
function bsModal(id) {
  return new bootstrap.Modal(document.getElementById(id));
}

// Format money with Philippine Peso symbol
function fmtMoney(val) {
  return '₱' + parseFloat(val).toFixed(2);
}

// Format date to readable string
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

// Show/hide elements (accepts ID string or element object)
function show(idOrElement) { 
  const el = typeof idOrElement === 'string' ? $(idOrElement) : idOrElement;
  if (el) el.classList.remove('d-none'); 
}

function hide(idOrElement) { 
  const el = typeof idOrElement === 'string' ? $(idOrElement) : idOrElement;
  if (el) el.classList.add('d-none'); 
}

// Show element with specific display type
function showAs(id, display) {
  $(id).style.display = display;
}

// HTTP Helper: GET
async function httpGet(url) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'GET', headers });
  return res.json();
}

// HTTP Helper: POST
async function httpPost(url, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

// HTTP Helper: PUT
async function httpPut(url, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  return res.json();
}

// HTTP Helper: DELETE
async function httpDelete(url) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'DELETE', headers });
  return res.json();
}
