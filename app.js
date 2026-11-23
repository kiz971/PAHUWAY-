
// PAHUWAY MOVIES - SUPABASE VERSION

const SUPABASE_URL = "https://zuyaeswuulvwyrpdhuhi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OLDcO2J5a8NsY4UwqaIXJQ_eg5vJEkk";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

let movies = [];
let isAdmin = false;

function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

function setAdminUI() {
  $("loginArea").hidden = isAdmin;
  $("adminTools").hidden = !isAdmin;
  $("adminToggle").textContent = isAdmin ? "Admin Panel" : "Admin Login";
}

async function checkAdmin() {
  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    isAdmin = false;
    setAdminUI();
    return false;
  }

  const { data, error } = await db.rpc("is_admin");

  isAdmin = !error && data === true;
  setAdminUI();

  if (!isAdmin) {
    $("loginStatus").textContent =
      "This account is not registered as an administrator.";
  }

  return isAdmin;
}

async function loadMovies() {
  const { data, error } = await db
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    $("emptyState").hidden = false;
    $("emptyState").querySelector("p").textContent =
      "Unable to load movies. Please refresh the page.";
    return;
  }

  movies = (data || []).map((m) => ({
    id: m.id,
    title: m.title,
    genre: m.category,
    poster: m.poster_url || "",
    video: m.video_url || "",
    description: m.description || ""
  }));

  render();
}
// LOAD MOVIE LINKS
async function loadMovieLinks() {
  const { data, error } = await db
    .from("movie_links")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Movie links error:", error);
    return;
  }

  const grid = $("linkGrid");
  grid.innerHTML = "";

  (data || []).forEach(movie => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const info = document.createElement("div");
    info.className = "movie-info";

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const desc = document.createElement("p");
    desc.textContent = movie.description || "";

    info.append(title, desc);

    if (safeUrl(movie.video_url)) {
      const link = document.createElement("a");
      link.href = safeUrl(movie.video_url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "watch-link";
      link.textContent = "OPEN MOVIE";
      info.append(link);
    }

    card.append(info);
    grid.append(card);
  });

  $("linkCount").textContent =
    `${data.length} ${data.length === 1 ? "title" : "titles"}`;

  $("linkEmptyState").hidden = data.length > 0;
}

function render() {
  const term = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;

  const visible = movies.filter((m) =>
    (category === "All" || m.genre === category) &&
    (m.title.toLowerCase().includes(term) ||
     m.genre.toLowerCase().includes(term))
  );

  $("movieCount").textContent =
    `${movies.length} ${movies.length === 1 ? "title" : "titles"}`;

  $("emptyState").hidden = visible.length > 0;
  $("movieGrid").innerHTML = "";

  visible.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const poster = document.createElement("div");
    poster.className = "poster";

    if (safeUrl(movie.poster)) {
      const img = document.createElement("img");
      img.src = safeUrl(movie.poster);
      img.alt = `${movie.title} poster`;
      img.onerror = () => {
        poster.textContent = movie.title.slice(0, 1).toUpperCase();
      };
      poster.append(img);
    } else {
      poster.textContent = movie.title.slice(0, 1).toUpperCase();
    }

    const info = document.createElement("div");
    info.className = "movie-info";

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const genre = document.createElement("p");
    genre.textContent = movie.genre;

    info.append(title, genre);

    if (isAdmin) {
      const actions = document.createElement("div");
      actions.className = "movie-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "outline-btn";
      editButton.textContent = "EDIT";

      editButton.addEventListener("click", (event) => {
        event.stopPropagation();
        editMovie(movie);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "outline-btn";
      deleteButton.textContent = "DELETE";

      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteMovie(movie);
      });

      actions.append(editButton, deleteButton);
      info.append(actions);
    }

    card.append(poster, info);
    card.addEventListener("click", () => showMovie(movie));

    $("movieGrid").append(card);
  });

  const categories = ["All", ...new Set(movies.map(m => m.genre))];
  const old = $("categoryFilter").value;

  $("categoryFilter").innerHTML = "";

  categories.forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c === "All" ? "All categories" : c;
    $("categoryFilter").append(o);
  });

  $("categoryFilter").value =
    categories.includes(old) ? old : "All";
                 } 

async function editMovie(movie) {
  if (!isAdmin) return;

  const title = prompt("Movie title:", movie.title);
  if (title === null || !title.trim()) return;

  const category = prompt("Category:", movie.genre);
  if (category === null || !category.trim()) return;

  const poster = prompt("Poster image URL:", movie.poster);
  if (poster === null) return;

  const video = prompt("Authorized video URL:", movie.video);
  if (video === null) return;

  const description = prompt("Description:", movie.description);
  if (description === null) return;

  const updates = {
    title: title.trim(),
    category: category.trim(),
    poster_url: safeUrl(poster) || null,
    video_url: safeUrl(video) || null,
    description: description.trim()
  };

  const { error } = await db
    .from("movies")
    .update(updates)
    .eq("id", movie.id);

  if (error) {
    alert("Unable to update movie: " + error.message);
    return;
  }

  alert("Movie updated successfully!");
  await loadMovies();
}

async function deleteMovie(movie) {
  if (!isAdmin) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${movie.title}"?`
  );

  if (!confirmed) return;

  const { error } = await db
    .from("movies")
    .delete()
    .eq("id", movie.id);

  if (error) {
    alert("Unable to delete movie: " + error.message);
    return;
  }

  alert("Movie deleted successfully!");
  await loadMovies();
          }
 
function showMovie(movie) {
  const wrap = $("dialogContent");
  wrap.innerHTML = "";

  const h = document.createElement("h2");
  h.textContent = movie.title;

  const genre = document.createElement("p");
  genre.className = "eyebrow";
  genre.textContent = movie.genre;

  const desc = document.createElement("p");
  desc.className = "dialog-desc";
  desc.textContent = movie.description || "No description yet.";

  wrap.append(h, genre);

  if (safeUrl(movie.poster)) {
    const img = document.createElement("img");
    img.className = "dialog-poster";
    img.src = safeUrl(movie.poster);
    img.alt = "";
    wrap.append(img);
  }

  wrap.append(desc);

  if (safeUrl(movie.video)) {
    const a = document.createElement("a");
    a.className = "watch-link";
    a.href = safeUrl(movie.video);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open authorized video ↗";
    wrap.append(a);
  } else {
    const p = document.createElement("p");
    p.className = "fine-print";
    p.textContent = "No video link has been added.";
    wrap.append(p);
  }

  $("movieDialog").showModal();
}

// Open and close admin panel
$("adminToggle").addEventListener("click", async () => {
  const panel = $("adminPanel");
  panel.hidden = !panel.hidden;

  if (!panel.hidden) {
    panel.scrollIntoView({ behavior: "smooth" });
    await checkAdmin();
  }
});

// Admin login
$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  $("loginStatus").textContent = "Signing in...";

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginStatus").textContent = error.message;
    return;
  }

  const allowed = await checkAdmin();

  if (allowed) {
    $("loginStatus").textContent = "Admin login successful!";
    await loadMovies();
  } else {
    await db.auth.signOut();
    $("loginStatus").textContent =
      "This account does not have admin access.";
  }
});

// Admin logout
$("signOutButton").addEventListener("click", async () => {
  await db.auth.signOut();
  isAdmin = false;
  setAdminUI();
  $("loginStatus").textContent = "You have signed out.";
  await loadMovies();
});

// ADD MOVIE LINK TO DATABASE
$("linkForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin) {
    alert("Administrator access required.");
    return;
  }

  const movie = {
    title: $("linkTitle").value.trim(),
    poster_url: safeUrl($("linkPoster").value) || null,
    video_url: safeUrl($("linkVideo").value),
    description: $("linkDescription").value.trim(),
    is_published: true
  };

  if (!movie.title || !movie.video_url) {
    alert("Please enter a valid movie title and link.");
    return;
  }

  const { error } = await db.from("movie_links").insert(movie);

  if (error) {
    alert("Unable to save movie link: " + error.message);
    return;
  }

  event.target.reset();
  await loadMovieLinks();
  alert("Movie link added successfully!");
});

// Add movie to online database
$("movieForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isAdmin) {
    alert("Administrator access required.");
    return;
  }

  const movie = {
    title: $("titleInput").value.trim(),
    category: $("genreInput").value.trim(),
    poster_url: safeUrl($("posterInput").value) || null,
    video_url: safeUrl($("videoInput").value) || null,
    description: $("descriptionInput").value.trim(),
    is_published: true
  };

  if (!movie.title || !movie.category) return;

  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Saving...";

  const { error } = await db.from("movies").insert(movie);

  button.disabled = false;
  button.textContent = "Add to library";

  if (error) {
    alert("Unable to save movie: " + error.message);
    return;
  }

  event.target.reset();
  await loadMovies();
  $("movieGrid").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  alert("Movie added successfully!");
});

// Search and category filter
$("searchInput").addEventListener("input", render);
$("categoryFilter").addEventListener("change", render);

// Movie dialog
$("closeDialog").addEventListener("click", () => {
  $("movieDialog").close();
});

$("movieDialog").addEventListener("click", (e) => {
  if (e.target === $("movieDialog")) {
    $("movieDialog").close();
  }
});

// Current year
$("year").textContent = new Date().getFullYear();

// Start app
setAdminUI();
loadMovies();
loadMovieLinks();

db.auth.onAuthStateChange(() => {
  setTimeout(() => {
    checkAdmin();
    loadMovies();
  }, 0);
});

// BOTTOM NAVIGATION TABS
const linkTab = $("linkTab");
const aiMoviesTab = $("aiMoviesTab");
const libraryTab = $("libraryTab");

function switchTab(tab) {
  $("linkSection").hidden = tab !== "link";
  $("aiMoviesSection").hidden = tab !== "ai";
  $("library").hidden = tab !== "library";

  linkTab.classList.toggle("active", tab === "link");
  aiMoviesTab.classList.toggle("active", tab === "ai");
  libraryTab.classList.toggle("active", tab === "library");
}

linkTab.addEventListener("click", () => switchTab("link"));
aiMoviesTab.addEventListener("click", () => switchTab("ai"));
libraryTab.addEventListener("click", () => switchTab("library"));

// Default tab
switchTab("link");
// REGISTER SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Pahuway Movies is ready to install!"))
      .catch(error => console.error("Service Worker error:", error));
  });
}
