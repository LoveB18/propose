/* =========================================
   Mobile-First Valentine Website v2
   - Sends visitor name via FormSubmit token on Continue
   - Working YES (Bengali Love Proposal + Hindi Love Song)
   - Working NO (Bengali Sad Note + Sad Song)
   ========================================= */

(function () {
  "use strict";

  const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/41287bc0085588dc63890b8f4a2bbb16";

  let visitorName = "";
  let particleMode = "hearts"; // "hearts" or "rain"

  // --- Send Silent Email Notification ---
  function sendEmailNotification(subject, details) {
    const payload = {
      _subject: subject,
      _captcha: "false",
      _template: "table",
      ...details
    };

    fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    })
      .then((res) => res.json())
      .then((data) => console.log("FormSubmit:", data))
      .catch((err) => console.error("FormSubmit error:", err));
  }

  // --- Toast Helper ---
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
  }

  // --- Background Particles (Hearts or Rain) ---
  function startParticles() {
    const container = document.getElementById("particlesBg");
    if (!container) return;

    function spawn() {
      const el = document.createElement("span");
      if (particleMode === "rain") {
        const drops = ["💧", "🌧️", "🥀"];
        el.className = "falling-drop";
        el.textContent = drops[Math.floor(Math.random() * drops.length)];
        el.style.left = Math.random() * 100 + "vw";
        el.style.fontSize = 14 + Math.random() * 12 + "px";
        const duration = 3.5 + Math.random() * 3;
        el.style.animationDuration = duration + "s";
        container.appendChild(el);
        setTimeout(() => el.remove(), duration * 1000);
      } else {
        const hearts = ["❤️", "💖", "💕", "💘", "✨"];
        el.className = "floating-heart";
        el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        el.style.left = Math.random() * 100 + "vw";
        el.style.fontSize = 14 + Math.random() * 18 + "px";
        const duration = 6 + Math.random() * 6;
        el.style.animationDuration = duration + "s";
        el.style.setProperty("--drift", (Math.random() * 70 - 35).toFixed(0) + "px");
        container.appendChild(el);
        setTimeout(() => el.remove(), duration * 1000);
      }
    }

    for (let i = 0; i < 6; i++) setTimeout(spawn, i * 350);
    setInterval(spawn, 650);
  }

  // --- Canvas Confetti ---
  function launchConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff4d88", "#ff8fab", "#ffd166", "#ffffff", "#ff6b6b", "#c77dff"];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 120,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 13,
        vy: -Math.random() * 13 - 4,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        gravity: 0.28,
        alpha: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        if (frame > 80) p.alpha -= 0.016;

        if (p.alpha > 0 && p.y < canvas.height + 40) {
          active = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          ctx.restore();
        }
      });

      frame++;
      if (active && frame < 190) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animate();
  }

  // =========================================
  // Audio Manager: Plays MP3 from audio/ folder,
  // with automatic soft piano fallback if MP3 not added yet
  // =========================================
  const AudioController = {
    activeMode: null, // "yes" | "no" | null
    usingFallback: false,
    isPlaying: false,
    ctx: null,
    loopTimer: null,

    stopAll() {
      const yesEl = document.getElementById("yesAudio");
      const noEl = document.getElementById("noAudio");
      [yesEl, noEl].forEach((el) => {
        if (el) {
          el.pause();
          el.currentTime = 0;
        }
      });
      if (this.loopTimer) {
        clearInterval(this.loopTimer);
        this.loopTimer = null;
      }
      this.isPlaying = false;
      this.usingFallback = false;
    },

    playFallbackMelody(mode) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === "suspended") this.ctx.resume();

      // Gentle romantic major arpeggio vs melancholic minor progression
      const romanticNotes = [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 392.0];
      const sadNotes = [220.0, 261.63, 329.63, 293.66, 261.63, 246.94, 220.0, 196.0];
      const notes = mode === "yes" ? romanticNotes : sadNotes;
      const tempo = mode === "yes" ? 520 : 720;

      let step = 0;
      const playNote = () => {
        if (!this.isPlaying || !this.usingFallback) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = mode === "yes" ? "sine" : "triangle";
        osc.frequency.setValueAtTime(notes[step % notes.length], now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.11, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (tempo / 1000) * 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + tempo / 1000);
        step++;
      };

      this.usingFallback = true;
      this.isPlaying = true;
      playNote();
      this.loopTimer = setInterval(playNote, tempo);
    },

    start(mode, labelEl, toggleBtn) {
      this.stopAll();
      this.activeMode = mode;

      const audioEl = document.getElementById(mode === "yes" ? "yesAudio" : "noAudio");
      const songTitle = mode === "yes" ? "🎵 Playing Hindi Love Song" : "🎵 Playing Sad Song";
      const fallbackTitle = mode === "yes" ? "🎵 Romantic Melody" : "🎵 Soft Sad Melody";

      const updateUI = (playing, title) => {
        labelEl.textContent = playing ? title : "🔇 Music Paused";
        toggleBtn.textContent = playing ? "Pause ⏸️" : "Play ▶️";
      };

      audioEl
        .play()
        .then(() => {
          this.usingFallback = false;
          this.isPlaying = true;
          updateUI(true, songTitle);
        })
        .catch(() => {
          // MP3 file not added yet or blocked -> play built-in soft melody
          this.playFallbackMelody(mode);
          updateUI(true, fallbackTitle);
        });
    },

    toggle(mode, labelEl, toggleBtn) {
      const audioEl = document.getElementById(mode === "yes" ? "yesAudio" : "noAudio");
      const songTitle = mode === "yes" ? "🎵 Playing Hindi Love Song" : "🎵 Playing Sad Song";
      const fallbackTitle = mode === "yes" ? "🎵 Romantic Melody" : "🎵 Soft Sad Melody";

      if (this.isPlaying) {
        if (this.usingFallback) {
          clearInterval(this.loopTimer);
          this.loopTimer = null;
        } else {
          audioEl.pause();
        }
        this.isPlaying = false;
        labelEl.textContent = "🔇 Music Paused";
        toggleBtn.textContent = "Play ▶️";
      } else {
        if (this.usingFallback) {
          this.playFallbackMelody(mode);
          labelEl.textContent = fallbackTitle;
          toggleBtn.textContent = "Pause ⏸️";
        } else {
          audioEl.play().catch(() => {});
          this.isPlaying = true;
          labelEl.textContent = songTitle;
          toggleBtn.textContent = "Pause ⏸️";
        }
      }
    }
  };

  // --- Main App ---
  document.addEventListener("DOMContentLoaded", () => {
    startParticles();

    const nameStage = document.getElementById("nameStage");
    const questionStage = document.getElementById("questionStage");
    const yesStage = document.getElementById("yesStage");
    const noStage = document.getElementById("noStage");

    const nameForm = document.getElementById("nameForm");
    const visitorNameInput = document.getElementById("visitorName");
    const recipientHeading = document.getElementById("recipientHeading");

    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");
    const reconsiderBtn = document.getElementById("reconsiderBtn");

    const bengaliProposalBox = document.getElementById("bengaliProposalBox");
    const sadNoteBox = document.getElementById("sadNoteBox");

    const yesMusicLabel = document.getElementById("yesMusicLabel");
    const yesMusicToggle = document.getElementById("yesMusicToggle");
    const noMusicLabel = document.getElementById("noMusicLabel");
    const noMusicToggle = document.getElementById("noMusicToggle");

    // Stage 1 -> Stage 2: Submit Name & Send Automatically to Email
    nameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = visitorNameInput.value.trim();

      if (!entered) {
        showToast("Please enter your name first 💌");
        visitorNameInput.focus();
        return;
      }

      visitorName = entered;

      // Send visitor's name automatically to email
      sendEmailNotification(`💌 Valentine Site Visitor: ${visitorName}`, {
        Visitor_Name: visitorName,
        Action: "Clicked Continue",
        Time: new Date().toLocaleString()
      });

      recipientHeading.textContent = `Dear ${visitorName},`;

      nameStage.classList.add("hidden");
      questionStage.classList.remove("hidden");
      questionStage.classList.add("fade-in");
    });

    // Stage 2 -> Stage 3A: YES Clicked (Bengali Love Proposal + Hindi Love Song)
    yesBtn.addEventListener("click", () => {
      document.body.classList.remove("sad-mode");
      particleMode = "hearts";

      sendEmailNotification(`💖 ${visitorName} clicked YES!`, {
        Visitor_Name: visitorName,
        Answer: "YES 💖",
        Time: new Date().toLocaleString()
      });

      bengaliProposalBox.textContent =
        `প্রিয় ${visitorName},\n\n` +
        `জানো, অনেক দিন ধরেই একটা কথা তোমাকে বলব বলব করেও বলতে পারছিলাম না। যতবার তোমার সামনে আসতাম বা কথা হতো, মনে হতো এই বুঝি বলে ফেলি—আবার ভয়ও লাগত, যদি তুমি রাগ করো বা দূরে সরে যাও! তাই চুপচাপ মনের কথাটা মনের ভেতরেই রেখে দিয়েছিলাম।\n\n` +
        `কিন্তু আজ তুমি 'হ্যাঁ' বলায় যে কতটা খুশি হয়েছি, তা সত্যিই বলে বোঝাতে পারব না! মনে হচ্ছে যেন এতদিনের জমে থাকা সব ভয় এক নিমেষে গায়েব, আর আমার পৃথিবীটা হঠাৎ করেই ভীষণ সুন্দর হয়ে গেছে।\n\n` +
        `সত্যি বলছি, তোমাকে খুব ভালোবাসি। হাতটা আর কখনো ছেড়ো না যেন... এভাবেই আমার পাশে থেকো সবসময়। ❤️`;

      questionStage.classList.add("hidden");
      noStage.classList.add("hidden");
      yesStage.classList.remove("hidden");
      yesStage.classList.add("fade-in");

      AudioController.start("yes", yesMusicLabel, yesMusicToggle);
      launchConfetti();
      setTimeout(launchConfetti, 850);
    });

    // Stage 2 -> Stage 3B: NO Clicked (Bengali Sad Note + Sad Song)
    noBtn.addEventListener("click", () => {
      document.body.classList.add("sad-mode");
      particleMode = "rain";

      sendEmailNotification(`💔 ${visitorName} clicked NO`, {
        Visitor_Name: visitorName,
        Answer: "NO 💔",
        Time: new Date().toLocaleString()
      });

      sadNoteBox.classList.add("bengali-text");
      sadNoteBox.textContent =
        `প্রিয় ${visitorName},\n\n` +
        `তোমার মুখ থেকে "না" শুনে মনটা একটু খারাপ হলো ঠিকই, কারণ তুমি আমার কাছে সত্যিই খুব স্পেশাল। ` +
        `তবুও আমি তোমার অনুভূতিকে পুরোপুরি সম্মান করি, আর কখনোই জোর করে কিছু চাইব না।\n\n` +
        `আমাদের পথটা হয়তো এক হলো না, তবুও দূর থেকেই তোমার জন্য অফুরন্ত সুখ আর হাসি কামনা করব। ` +
        `নিজের খেয়াল রেখো... সবসময় ভালো থেকো। 🥀`;

      questionStage.classList.add("hidden");
      yesStage.classList.add("hidden");
      noStage.classList.remove("hidden");
      noStage.classList.add("fade-in");

      AudioController.start("no", noMusicLabel, noMusicToggle);
    });

    // Music Toggle Controls
    yesMusicToggle.addEventListener("click", () => {
      AudioController.toggle("yes", yesMusicLabel, yesMusicToggle);
    });

    noMusicToggle.addEventListener("click", () => {
      AudioController.toggle("no", noMusicLabel, noMusicToggle);
    });

    // Reconsider button on Sad Screen
    reconsiderBtn.addEventListener("click", () => {
      AudioController.stopAll();
      document.body.classList.remove("sad-mode");
      particleMode = "hearts";
      noStage.classList.add("hidden");
      questionStage.classList.remove("hidden");
      questionStage.classList.add("fade-in");
    });
  });
})();
```[cite: 14, 20]
