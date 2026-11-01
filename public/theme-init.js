/* Tema, sayfa çizilmeden önce uygulanır (yanıp sönme olmasın).
   Ayrı dosya olarak tutulur: böylece katı Content-Security-Policy (satır içi betik yok) ile uyumludur. */
(function () {
  try {
    var t = localStorage.getItem("effeyc-theme");
    if (t !== "light" && t !== "dark" && t !== "dim") t = "dark";
    document.documentElement.dataset.theme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? "#f6f6f4" : t === "dim" ? "#1b1d23" : "#0b0b0d");
  // oxlint-disable-next-line no-unused-vars
  } catch (e) {}
})();
