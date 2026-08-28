(() => {

  "use strict";


  const ADMIN_TOKEN_KEY =
    "boykovgroup_admin_token";


  const BADGE_CLASS =
    "boykovGeneratedBadge";


  const checkedInstructions =
    new Map();


  const inFlight =
    new Map();


  let verifiedToken =
    null;

  let verifiedAdmin =
    false;

  let scheduled =
    false;


  function normalizeText(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /\s+/gu,
        " "
      )
      .trim();

  }


  /*
   * ==========================================================
   * ADMIN CHECK
   * ==========================================================
   */

  async function isAdmin() {

    const token =
      localStorage.getItem(
        ADMIN_TOKEN_KEY
      );


    if (!token) {

      verifiedToken =
        null;

      verifiedAdmin =
        false;

      return false;

    }


    if (
      verifiedToken === token
      &&
      verifiedAdmin
    ) {

      return true;

    }


    try {

      const response =
        await fetch(
          "/api/auth/me",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            },

            cache:
              "no-store"
          }
        );


      if (!response.ok) {

        verifiedToken =
          null;

        verifiedAdmin =
          false;

        return false;

      }


      const data =
        await response.json();


      const admin =
        data?.user?.role ===
        "admin";


      verifiedToken =
        admin
          ? token
          : null;


      verifiedAdmin =
        admin;


      return admin;

    }
    catch {

      return false;

    }

  }


  /*
   * ==========================================================
   * INSTRUCTION ID
   * ==========================================================
   */

  function getInstructionId(
    link
  ) {

    try {

      const url =
        new URL(
          link.href,
          window.location.origin
        );


      const match =
        url.pathname.match(
          /^\/instrukciya-po-ohrane-truda\/([^/]+)\/?$/u
        );


      if (!match) {
        return null;
      }


      return decodeURIComponent(
        match[1]
      );

    }
    catch {

      return null;

    }

  }


  /*
   * ==========================================================
   * DETECT REAL INSTRUCTION CARDS
   * ==========================================================
   */

  function getCardInfo(
    link
  ) {

    const id =
      getInstructionId(
        link
      );


    if (!id) {
      return null;
    }


    const parent =
      link.parentElement;


    if (!parent) {
      return null;
    }


    /*
     * Основные карточки на главной.
     *
     * У админа рядом есть:
     * [ редактировать ]
     * [ удалить ]
     */
    const buttons =
      Array.from(
        parent.querySelectorAll(
          "button"
        )
      );


    const hasAdminControls =
      buttons.some(
        button =>
          normalizeText(
            button.textContent
          )
          .includes(
            "редактировать"
          )
      );


    if (hasAdminControls) {

      return {
        id,
        link,
        card:
          parent,

        mode:
          "main"
      };

    }


    /*
     * Карточки страницы каталога:
     *
     * <a>
     *   <h2>...</h2>
     *   <span>Открыть инструкцию →</span>
     * </a>
     */
    const heading =
      link.querySelector(
        "h2"
      );


    const linkText =
      normalizeText(
        link.textContent
      );


    if (
      heading
      &&
      linkText.includes(
        "Открыть инструкцию"
      )
    ) {

      return {
        id,
        link,
        card:
          link,

        mode:
          "catalog"
      };

    }


    return null;

  }


  /*
   * ==========================================================
   * CHECK SOURCE
   * ==========================================================
   */

  async function isGeneratedInstruction(
    id
  ) {

    if (
      checkedInstructions.has(
        id
      )
    ) {

      return checkedInstructions.get(
        id
      );

    }


    if (
      inFlight.has(
        id
      )
    ) {

      return inFlight.get(
        id
      );

    }


    const promise =
      fetch(
        `/api/instructions/${encodeURIComponent(id)}`,
        {
          cache:
            "no-store"
        }
      )
      .then(
        async response => {

          if (!response.ok) {
            return false;
          }


          const instruction =
            await response.json();


          /*
           * Сейчас все инструкции,
           * созданные YandexGPT,
           * имеют source = "generated".
           */
          return (
            instruction?.source ===
            "generated"
          );

        }
      )
      .catch(
        () => false
      )
      .then(
        generated => {

          checkedInstructions.set(
            id,
            generated
          );


          return generated;

        }
      )
      .finally(
        () => {

          inFlight.delete(
            id
          );

        }
      );


    inFlight.set(
      id,
      promise
    );


    return promise;

  }


  /*
   * ==========================================================
   * BADGE
   * ==========================================================
   */

  function createBadge(
    id
  ) {

    const badge =
      document.createElement(
        "div"
      );


    badge.className =
      BADGE_CLASS;


    badge.dataset
      .generatedInstructionId =
      id;


    const dot =
      document.createElement(
        "span"
      );


    dot.className =
      `${BADGE_CLASS}__dot`;


    dot.setAttribute(
      "aria-hidden",
      "true"
    );


    const text =
      document.createElement(
        "span"
      );


    text.textContent =
      "Сгенерировано YandexGPT";


    badge.append(
      dot,
      text
    );


    return badge;

  }


  function removeBadges() {

    document
      .querySelectorAll(
        `.${BADGE_CLASS}`
      )
      .forEach(
        badge =>
          badge.remove()
      );

  }


  function addBadge(
    info
  ) {

    if (
      info.card.querySelector(
        `.${BADGE_CLASS}[data-generated-instruction-id="${CSS.escape(info.id)}"]`
      )
    ) {

      return;

    }


    const badge =
      createBadge(
        info.id
      );


    if (
      info.mode ===
      "catalog"
    ) {

      const heading =
        info.link.querySelector(
          "h2"
        );


      if (heading) {

        heading.insertAdjacentElement(
          "afterend",
          badge
        );


        return;

      }

    }


    /*
     * Основная карточка:
     * ставим пометку между самой ссылкой
     * и административными кнопками.
     */
    const adminBar =
      Array.from(
        info.card.children
      )
      .find(
        element =>
          element.querySelector?.(
            "button"
          )
      );


    if (adminBar) {

      info.card.insertBefore(
        badge,
        adminBar
      );

      return;

    }


    info.card.appendChild(
      badge
    );

  }


  /*
   * ==========================================================
   * PROCESS CARDS
   * ==========================================================
   */

  async function processCards() {

    const admin =
      await isAdmin();


    if (!admin) {

      removeBadges();

      return;

    }


    const links =
      Array.from(
        document.querySelectorAll(
          'a[href^="/instrukciya-po-ohrane-truda/"],' +
          'a[href*="boykovdocs.ru/instrukciya-po-ohrane-truda/"]'
        )
      );


    for (
      const link
      of links
    ) {

      const info =
        getCardInfo(
          link
        );


      if (!info) {
        continue;
      }


      const generated =
        await isGeneratedInstruction(
          info.id
        );


      /*
       * Пока шёл запрос, пользователь
       * мог выйти из админки.
       */
      if (
        !localStorage.getItem(
          ADMIN_TOKEN_KEY
        )
      ) {

        removeBadges();

        return;

      }


      if (generated) {

        addBadge(
          info
        );

      }

    }

  }


  /*
   * React и infinite scroll могут
   * добавлять карточки позже.
   */
  function scheduleProcessing() {

    if (scheduled) {
      return;
    }


    scheduled =
      true;


    requestAnimationFrame(
      () => {

        scheduled =
          false;

        processCards();

      }
    );

  }


  const observer =
    new MutationObserver(
      scheduleProcessing
    );


  observer.observe(
    document.documentElement,
    {
      childList:
        true,

      subtree:
        true
    }
  );


  /*
   * Если статус авторизации поменялся
   * в другой вкладке.
   */
  window.addEventListener(
    "storage",
    event => {

      if (
        event.key ===
        ADMIN_TOKEN_KEY
      ) {

        verifiedToken =
          null;

        verifiedAdmin =
          false;


        if (!event.newValue) {

          removeBadges();

        }
        else {

          scheduleProcessing();

        }

      }

    }
  );


  /*
   * Дополнительная страховка после logout.
   */
  window.setInterval(
    () => {

      if (
        !localStorage.getItem(
          ADMIN_TOKEN_KEY
        )
      ) {

        removeBadges();

      }

    },
    5000
  );


  scheduleProcessing();

})();
