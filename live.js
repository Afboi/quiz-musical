
(() => {
  const scenes = [...document.querySelectorAll(".scene")];
  const connection = document.getElementById("connection");
  const audio = new Audio();
  audio.preload = "auto";

  const youtubeLayer = document.getElementById("youtubeLayer");
  const stage = document.getElementById("stage");

  let introTimer = null;
  let currentIndex = -1;
  let ytPlayer = null;
  let youtubeApiReady = false;
  let pendingVideoId = null;
  let youtubeActive = false;

  const NORMAL_VOLUME = 100;
  const QUESTION_VOLUME = 15;

  // Cargar la API oficial de YouTube.
  const ytScript = document.createElement("script");
  ytScript.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(ytScript);

  window.onYouTubeIframeAPIReady = () => {
    youtubeApiReady = true;

    if (pendingVideoId) {
      playYouTube(pendingVideoId);
    }
  };

  // Mostrar escena y ajustar volumen y oscurecimiento.
  function showScene(id) {
    scenes.forEach(scene => {
      scene.classList.toggle("active", scene.id === id);
    });

    const isQuestion = id === "questionScene";

    stage.classList.toggle("question-active", isQuestion);

    if (isQuestion) {
      setPlaybackVolume(QUESTION_VOLUME);
    } else {
      setPlaybackVolume(NORMAL_VOLUME);
    }
  }

  // Ajustar el volumen del MP3 y del reproductor de YouTube.
  function setPlaybackVolume(percent) {
    const level = Math.max(0, Math.min(100, Number(percent)));

    audio.volume = level / 100;

    if (ytPlayer && typeof ytPlayer.setVolume === "function") {
      try {
        ytPlayer.setVolume(level);
      } catch (error) {
        console.warn("No se pudo ajustar el volumen de YouTube.", error);
      }
    }
  }

  function setConnected(ok) {
    connection.classList.toggle("ok", ok);
    connection.classList.toggle("error", !ok);

    connection.lastChild.textContent = ok
      ? " Conectado a la controladora"
      : " Sin conexión con la controladora";
  }

  function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }

  function stopYouTube() {
    pendingVideoId = null;
    youtubeActive = false;

    youtubeLayer.classList.remove("visible");
    stage.classList.remove("video-playing");

    if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
      try {
        ytPlayer.stopVideo();
      } catch (error) {
        console.warn("No se pudo detener YouTube.", error);
      }
    }
  }

  function playYouTube(videoId) {
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.warn("ID de YouTube inválido o vacío:", videoId);
      return false;
    }

    pendingVideoId = videoId;

    if (!youtubeApiReady) {
      return false;
    }

    if (!ytPlayer) {
      ytPlayer = new YT.Player("youtubePlayer", {
        videoId,

        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1
        },

        events: {
          onReady: event => {
            youtubeActive = true;

            youtubeLayer.classList.add("visible");
            stage.classList.add("video-playing");

            event.target.setVolume(
              stage.classList.contains("question-active")
                ? QUESTION_VOLUME
                : NORMAL_VOLUME
            );

            event.target.playVideo();
          },

          onStateChange: event => {
            if (event.data === YT.PlayerState.PLAYING) {
              youtubeActive = true;

              youtubeLayer.classList.add("visible");
              stage.classList.add("video-playing");

              // Si la pregunta ya está visible, mantener volumen bajo.
              setPlaybackVolume(
                stage.classList.contains("question-active")
                  ? QUESTION_VOLUME
                  : NORMAL_VOLUME
              );
            }
          },

          onError: event => {
            console.warn(
              "YouTube no pudo reproducir el video. Código:",
              event.data
            );

            youtubeActive = false;
            youtubeLayer.classList.remove("visible");
            stage.classList.remove("video-playing");
          }
        }
      });
    } else {
      youtubeActive = true;

      youtubeLayer.classList.add("visible");
      stage.classList.add("video-playing");

      ytPlayer.loadVideoById(videoId);
    }

    return true;
  }

  function startRound(data) {
    clearTimeout(introTimer);

    stopAudio();
    stopYouTube();

    setPlaybackVolume(NORMAL_VOLUME);

    currentIndex = data.index;

    const q = window.QUIZ_QUESTIONS[currentIndex];

    if (!q) {
      console.warn("No existe la pregunta en el índice:", currentIndex);
      return;
    }

    document.getElementById("roundNumber").textContent =
      `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")}`;

    document.getElementById("movieTitle").textContent = q.movie;

    document.getElementById("movieArt").innerHTML =
      `<span>${q.art || "♫"}</span>`;

    document.getElementById("questionCounter").textContent =
      `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")} / ${window.QUIZ_QUESTIONS.length}`;

    document.getElementById("questionText").textContent = q.question;
    document.getElementById("questionMovie").textContent =
      q.movie.toUpperCase();

    showScene("roundIntro");

    // Reproducir video de YouTube o, si no hay ID, el MP3 local.
    if (q.youtubeId && q.youtubeId.trim()) {
      const started = playYouTube(q.youtubeId.trim());

      if (!started && q.audio) {
        audio.src = q.audio;

        audio.play().catch(error => {
          console.warn("No se pudo reproducir el audio local:", error);
        });
      }
    } else if (q.audio) {
      audio.src = q.audio;

      audio.play().catch(error => {
        console.warn("No se pudo reproducir el audio local:", error);
      });
    }

    const seconds = Math.max(1, Number(data.introSeconds) || 8);

    introTimer = setTimeout(() => {
      showScene("questionScene");
    }, seconds * 1000);
  }

  function receive(data) {
    if (!data || !data.type) return;

    if (data.type === "startRound") {
      startRound(data);
    }

    if (data.type === "showQuestion") {
      clearTimeout(introTimer);
      showScene("questionScene");
    }

    if (data.type === "welcome" || data.type === "reset") {
      clearTimeout(introTimer);

      stopAudio();
      stopYouTube();

      currentIndex = -1;

      showScene("welcome");
    }

    if (data.type === "stopAudio") {
      stopAudio();
      stopYouTube();
    }
  }

  function connect() {
    const es = new EventSource("/events");

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = event => {
      try {
        receive(JSON.parse(event.data));
      } catch (error) {
        console.error("Evento inválido", error);
      }
    };
  }

  connect();
})();
