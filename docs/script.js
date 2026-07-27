// Pull the latest release from the live server so the download button always
// points at whatever APK was most recently published from the admin
// dashboard, without needing to hand-edit this static page on GitHub Pages.
// sslip.io gives the VPS's bare IP a real HTTPS certificate, which this page
// (served over HTTPS via GitHub Pages) needs - a plain http:// API_BASE gets
// silently blocked as mixed content, always falling back to the static
// GitHub Releases link below instead of ever reaching this fetch.
const API_BASE = 'https://147-79-100-48.sslip.io';

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
