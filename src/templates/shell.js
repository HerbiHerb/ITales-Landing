export function header(page) {
  return `<a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header"><nav class="container site-nav" aria-label="Main navigation">
      <a class="brand" href="index.html" aria-label="ITales home"><img src="assets/media/logo.webp" width="180" height="64" alt="ITales"></a>
      <div class="nav-links"><a href="game.html" ${page === 'game' ? 'aria-current="page"' : ''}>Game</a>
      <a href="editor.html" ${page === 'editor' ? 'aria-current="page"' : ''}>Editor</a></div>
    </nav></header>`;
}

export function footer() {
  return `<footer class="site-footer"><div class="container footer-inner">
    <p>© ${new Date().getFullYear()} ITales <span class="footer-tagline">Stories shaped by you.</span></p>
    <nav aria-label="Footer"><a href="impressum.html">Impressum</a><a href="privacy.html">Privacy</a>
    <button type="button" class="text-button" data-consent-settings>Analytics settings</button></nav>
    </div></footer>`;
}

export function consentPanel() {
  return `<section class="consent-panel" aria-labelledby="consent-title" hidden data-consent-panel>
    <div class="consent-copy"><h2 id="consent-title">A little insight helps us grow</h2>
    <p>May we use Google Analytics to understand which parts of ITales interest you? It's optional. Your feedback works either way. <a href="privacy.html">Privacy details</a></p></div>
    <div class="consent-actions"><button class="btn btn-outline-light" type="button" data-consent-decline>Decline</button>
    <button class="btn btn-primary" type="button" data-consent-allow>Allow analytics</button></div></section>`;
}
