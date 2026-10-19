(() => {
  const scenes = [...document.querySelectorAll(".scene")];
  const connection = document.getElementById("connection");
  const audio = new Audio();
  audio.preload = "auto";
  let introTimer = null;
  let currentIndex = -1;

  function showScene(id) {
    scenes.forEach(scene => scene.classList.toggle("active", scene.id === id));
  }
  function setConnected(ok) {
    connection.classList.toggle("ok", ok);
    connection.classList.toggle("error", !ok);
    connection.lastChild.textContent = ok ? " Conectado a la controladora" : " Sin conexión con la controladora";
  }
  function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }
  function startRound(data) {
    clearTimeout(introTimer);
    stopAudio();
    currentIndex = data.index;
    const q = window.QUIZ_QUESTIONS[currentIndex];
    if (!q) return;
    document.getElementById("roundNumber").textContent = `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")}`;
    document.getElementById("movieTitle").textContent = q.movie;
    document.getElementById("movieArt").innerHTML = `<span>${q.art || "♫"}</span>`;
    document.getElementById("questionCounter").textContent = `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")} / ${window.QUIZ_QUESTIONS.length}`;
    document.getElementById("questionText").textContent = q.question;
    document.getElementById("questionMovie").textContent = q.movie.toUpperCase();
    showScene("roundIntro");
    if (q.audio) {
      audio.src = q.audio;
      audio.play().catch(() => {});
    }
    const seconds = Math.max(1, Number(data.introSeconds) || 8);
    introTimer = setTimeout(() => showScene("questionScene"), seconds * 1000);
  }
  function receive(data) {
    if (!data || !data.type) return;
    if (data.type === "startRound") startRound(data);
    if (data.type === "showQuestion") { clearTimeout(introTimer); showScene("questionScene"); }
    if (data.type === "welcome") { clearTimeout(introTimer); stopAudio(); currentIndex = -1; showScene("welcome"); }
    if (data.type === "reset") { clearTimeout(introTimer); stopAudio(); currentIndex = -1; showScene("welcome"); }
    if (data.type === "stopAudio") stopAudio();
  }
  function connect() {
    const es = new EventSource("/events");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = event => {
      try { receive(JSON.parse(event.data)); } catch (e) { console.error("Evento inválido", e); }
    };
  }
  connect();
})();
