// Pull the latest release from the live server so the download button always
// points at whatever APK was most recently published from the admin
// dashboard, without needing to hand-edit this static page on GitHub Pages.
// NOTE: this page is served over HTTPS (GitHub Pages) but the VPS below is
// still plain HTTP - browsers block that as mixed content, so this fetch
// will fail silently until the VPS has a domain + SSL. The static GitHub
// Releases link on the download button is the fallback in the meantime.
const API_BASE = 'http://147.79.100.48:3001';

fetch(`${API_BASE}/api/app-version/latest`)
  .then((response) => (response.ok ? response.json() : null))
  .then((release) => {
    if (!release?.apkUrl) return;
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.href = release.apkUrl;
    const apkMeta = document.getElementById('apk-meta');
    if (apkMeta && release.version) {
      apkMeta.textContent = `Android 8.0+ · v${release.version}`;
    }
  })
  .catch(() => {
    // Server unreachable (cold start, offline) — keep the static fallback link.
  });

// Fade in feature cards as they scroll into view.
const revealTargets = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 },
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('in-view'));
}
