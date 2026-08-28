(() => {
  "use strict";

  function createFooter() {
    if (document.getElementById("boykov-site-footer")) {
      return;
    }

    const footer = document.createElement("footer");
    footer.id = "boykov-site-footer";
    footer.className = "boykovSiteFooter";

    footer.innerHTML = `
      <div class="boykovSiteFooter__inner">
        <nav
          class="boykovSiteFooter__links"
          aria-label="Правовая информация"
        >
          <a
            class="boykovSiteFooter__link"
            href="/privacy/"
          >Политика в отношении обработки персональных данных</a>

          <a
            class="boykovSiteFooter__link"
            href="/user-agreement/"
          >Пользовательское соглашение</a>

          <a
            class="boykovSiteFooter__link"
            href="/offer/"
          >Публичная оферта</a>
        </nav>
      </div>
    `;

    document.body.appendChild(footer);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createFooter,
      { once: true }
    );
  } else {
    createFooter();
  }
})();
