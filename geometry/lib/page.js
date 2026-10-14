// Page — small things every geometry page does after Apparatus.mount: the faint analytics dot points to geometry/analytics.html
// (the shared analytics.html loads only exercises/ definitions).
window.Geo = { page(id) { const c = document.querySelector('.corner'); if (c) c.setAttribute('href', `analytics.html#${id}`); } };
