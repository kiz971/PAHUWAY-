const STORAGE_KEY = "pahuway-movies-demo-v1";
const starterMovies = [];
const $ = (id) => document.getElementById(id);
let movies = loadMovies();

function loadMovies() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || starterMovies; }
  catch { return starterMovies; }
}
function saveMovies() { localStorage.setItem(STORAGE_KEY, JSON.stringify(movies)); }
function safeUrl(value) {
  try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; }
  catch { return ""; }
}
function render() {
  const term = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const visible = movies.filter(m =>
    (category === "All" || m.genre === category) &&
    (m.title.toLowerCase().includes(term) || m.genre.toLowerCase().includes(term))
  );
  $("movieCount").textContent = `${movies.length} ${movies.length === 1 ? "title" : "titles"}`;
  $("emptyState").hidden = visible.length > 0;
  $("movieGrid").innerHTML = "";
  visible.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";
    const poster = document.createElement("div");
    poster.className = "poster";
    if (safeUrl(movie.poster)) {
      const img = document.createElement("img");
      img.src = safeUrl(movie.poster); img.alt = `${movie.title} poster`;
      img.onerror = () => { poster.textContent = movie.title.slice(0,1).toUpperCase(); };
      poster.append(img);
    } else poster.textContent = movie.title.slice(0,1).toUpperCase();
    const info = document.createElement("div"); info.className = "movie-info";
    const title = document.createElement("h3"); title.textContent = movie.title;
    const genre = document.createElement("p"); genre.textContent = movie.genre;
    info.append(title, genre); card.append(poster, info);
    card.addEventListener("click", () => showMovie(movie));
    $("movieGrid").append(card);
  });
  const categories = ["All", ...new Set(movies.map(m => m.genre))];
  const old = $("categoryFilter").value;
  $("categoryFilter").innerHTML = "";
  categories.forEach(c => { const o=document.createElement("option"); o.value=c; o.textContent=c==="All"?"All categories":c; $("categoryFilter").append(o); });
  $("categoryFilter").value = categories.includes(old) ? old : "All";
}
function showMovie(movie) {
  const wrap = $("dialogContent"); wrap.innerHTML = "";
  const h = document.createElement("h2"); h.textContent = movie.title;
  const genre = document.createElement("p"); genre.className="eyebrow"; genre.textContent=movie.genre;
  const desc = document.createElement("p"); desc.className="dialog-desc"; desc.textContent=movie.description || "No description yet.";
  wrap.append(h, genre);
  if (safeUrl(movie.poster)) { const img=document.createElement("img"); img.className="dialog-poster"; img.src=safeUrl(movie.poster); img.alt=""; wrap.append(img); }
  wrap.append(desc);
  if (safeUrl(movie.video)) { const a=document.createElement("a"); a.className="watch-link"; a.href=safeUrl(movie.video); a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="Open authorized video ↗"; wrap.append(a); }
  else { const p=document.createElement("p"); p.className="fine-print"; p.textContent="No video link has been added."; wrap.append(p); }
  $("movieDialog").showModal();
}
$("adminToggle").addEventListener("click", () => {
  const panel=$("adminPanel"); panel.hidden=!panel.hidden;
  if (!panel.hidden) panel.scrollIntoView({behavior:"smooth"});
});
$("movieForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const movie = {
    title: $("titleInput").value.trim(),
    genre: $("genreInput").value.trim(),
    poster: safeUrl($("posterInput").value),
    video: safeUrl($("videoInput").value),
    description: $("descriptionInput").value.trim()
  };
  if (!movie.title || !movie.genre) return;
  movies.unshift(movie); saveMovies(); event.target.reset(); render();
  $("movieGrid").scrollIntoView({behavior:"smooth",block:"start"});
});
$("searchInput").addEventListener("input", render);
$("categoryFilter").addEventListener("change", render);
$("closeDialog").addEventListener("click", () => $("movieDialog").close());
$("movieDialog").addEventListener("click", (e) => { if (e.target === $("movieDialog")) $("movieDialog").close(); });
$("year").textContent = new Date().getFullYear();
render();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}