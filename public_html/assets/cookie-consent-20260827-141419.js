(() => {
  "use strict";

  const COOKIE_NAME =
    "boykov_cookie_consent";

  const COOKIE_DAYS =
    365;

  function getConsent() {
    const prefix =
      `${COOKIE_NAME}=`;

    const cookies =
      document.cookie
        .split(";")
        .map(item => item.trim());

    const item =
      cookies.find(cookie =>
        cookie.startsWith(prefix)
      );

    if (!item) {
      return null;
    }

    return decodeURIComponent(
      item.slice(prefix.length)
    );
  }

  function setConsent(value) {
    const maxAge =
      COOKIE_DAYS * 24 * 60 * 60;

    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(value)}; ` +
      `Max-Age=${maxAge}; ` +
      `Path=/; ` +
      `SameSite=Lax; ` +
      `Secure`;

    window.BOYKOV_COOKIE_CONSENT =
      value;

    document.documentElement
      .setAttribute(
        "data-cookie-consent",
        value
      );

    window.dispatchEvent(
      new CustomEvent(
        "boykov:cookie-consent",
        {
          detail: {
            value
          }
        }
      )
    );
  }

  function removeBanner() {
    document
      .getElementById(
        "boykov-cookie-banner"
      )
      ?.remove();
  }

  function accept(value) {
    setConsent(value);
    removeBanner();
  }

  function createBanner() {
    if (
      document.getElementById(
        "boykov-cookie-banner"
      )
    ) {
      return;
    }

    const banner =
      document.createElement("section");

    banner.id =
      "boykov-cookie-banner";

    banner.className =
      "boykovCookieBanner";

    banner.setAttribute(
      "role",
      "dialog"
    );

    banner.setAttribute(
      "aria-label",
      "Настройки cookie"
    );

    banner.innerHTML = `
      <div class="boykovCookieBanner__eyebrow">
        Cookie
      </div>

      <h2 class="boykovCookieBanner__title">
        Мы используем cookie
      </h2>

      <p class="boykovCookieBanner__text">
        Необходимые cookie используются для корректной работы сайта.
        Аналитические cookie помогают нам понимать, как посетители
        пользуются сайтом. Вы можете разрешить все cookie или оставить
        только необходимые.
      </p>

      <div class="boykovCookieBanner__actions">
        <button
          type="button"
          class="
            boykovCookieBanner__button
            boykovCookieBanner__button--secondary
          "
          data-cookie-action="necessary"
        >
          Только необходимые
        </button>

        <button
          type="button"
          class="
            boykovCookieBanner__button
            boykovCookieBanner__button--primary
          "
          data-cookie-action="all"
        >
          Принять все
        </button>
      </div>
    `;

    banner
      .querySelector(
        '[data-cookie-action="necessary"]'
      )
      .addEventListener(
        "click",
        () => accept("necessary")
      );

    banner
      .querySelector(
        '[data-cookie-action="all"]'
      )
      .addEventListener(
        "click",
        () => accept("all")
      );

    document.body.appendChild(
      banner
    );
  }

  const existingConsent =
    getConsent();

  if (
    existingConsent === "all" ||
    existingConsent === "necessary"
  ) {
    window.BOYKOV_COOKIE_CONSENT =
      existingConsent;

    document.documentElement
      .setAttribute(
        "data-cookie-consent",
        existingConsent
      );

    return;
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      createBanner,
      {
        once: true
      }
    );
  }
  else {
    createBanner();
  }

  /*
   * Для тестирования из DevTools:
   *
   * window.resetBoykovCookieConsent()
   */
  window.resetBoykovCookieConsent =
    () => {
      document.cookie =
        `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;

      window.BOYKOV_COOKIE_CONSENT =
        null;

      document.documentElement
        .removeAttribute(
          "data-cookie-consent"
        );

      createBanner();
    };
})();
