(() => {

  "use strict";


  const ADMIN_TOKEN =
    "boykovgroup_admin_token";

  const COUNTER_ID =
    "boykov-instruction-view-counter";


  let lastCountedPath =
    null;

  let lastStatsPath =
    null;

  let authCacheToken =
    undefined;

  let authCachePromise =
    null;


  function getInstructionId() {

    const match =
      window.location.pathname
        .match(
          /^\/instrukciya-po-ohrane-truda\/([^/]+)\/?$/
        );


    if (!match) {
      return null;
    }


    try {

      return decodeURIComponent(
        match[1]
      );

    }
    catch {

      return match[1];

    }

  }


  async function getAdminState() {

    const token =
      localStorage.getItem(
        ADMIN_TOKEN
      );


    if (!token) {

      authCacheToken =
        null;

      authCachePromise =
        null;

      return {
        isAdmin: false,
        token: null
      };

    }


    if (
      token !==
      authCacheToken
    ) {

      authCacheToken =
        token;

      authCachePromise =
        null;

    }


    if (!authCachePromise) {

      authCachePromise =
        fetch(
          "/api/auth/me",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            },

            cache:
              "no-store"
          }
        )
        .then(
          async response => {

            if (!response.ok) {

              return {
                isAdmin: false,
                token: null
              };

            }


            const data =
              await response.json();


            return {
              isAdmin:
                data?.user?.role ===
                "admin",

              token
            };

          }
        )
        .catch(
          () => ({
            isAdmin: false,
            token: null
          })
        );

    }


    return authCachePromise;

  }


  async function registerView() {

    const id =
      getInstructionId();


    if (!id) {

      lastCountedPath =
        null;

      return;

    }


    const path =
      window.location.pathname;


    /*
     * Один просмотр
     * на одно открытие маршрута.
     *
     * React-перерисовки
     * повторно его не увеличивают.
     */
    if (
      lastCountedPath ===
      path
    ) {

      return;

    }


    const auth =
      await getAdminState();


    /*
     * Просмотры администратора
     * не учитываем.
     */
    if (
      auth.isAdmin
    ) {

      lastCountedPath =
        path;

      return;

    }


    lastCountedPath =
      path;


    fetch(
      `/api/instructions/${encodeURIComponent(id)}/view`,
      {
        method:
          "POST",

        keepalive:
          true
      }
    )
    .catch(
      () => {}
    );

  }


  function findEditButton() {

    return (
      Array
        .from(
          document.querySelectorAll(
            "button"
          )
        )
        .find(
          button =>
            button.textContent
              ?.trim() ===
            "Редактировать статью"
        )
      ||
      null
    );

  }


  async function renderAdminStats() {

    const id =
      getInstructionId();


    if (!id) {

      document
        .getElementById(
          COUNTER_ID
        )
        ?.remove();


      lastStatsPath =
        null;

      return;

    }


    const auth =
      await getAdminState();


    if (
      !auth.isAdmin ||
      !auth.token
    ) {

      document
        .getElementById(
          COUNTER_ID
        )
        ?.remove();

      return;

    }


    const editButton =
      findEditButton();


    if (!editButton) {
      return;
    }


    if (
      document.getElementById(
        COUNTER_ID
      )
      &&
      lastStatsPath ===
      window.location.pathname
    ) {

      return;

    }


    const response =
      await fetch(
        `/api/instructions/${encodeURIComponent(id)}/views`,
        {
          headers: {
            Authorization:
              `Bearer ${auth.token}`
          },

          cache:
            "no-store"
        }
      );


    if (!response.ok) {
      return;
    }


    const stats =
      await response.json();


    document
      .getElementById(
        COUNTER_ID
      )
      ?.remove();


    const counter =
      document.createElement(
        "div"
      );


    counter.id =
      COUNTER_ID;

    counter.className =
      "boykovInstructionViews";


    counter.innerHTML = `
      <span class="boykovInstructionViews__label">
        Просмотры
      </span>

      <strong class="boykovInstructionViews__total">
        ${Number(stats.total || 0).toLocaleString("ru-RU")}
      </strong>

      <span class="boykovInstructionViews__meta">
        сегодня:
        ${Number(stats.today || 0).toLocaleString("ru-RU")}
        · 7 дней:
        ${Number(stats.last7Days || 0).toLocaleString("ru-RU")}
      </span>
    `;


    editButton
      .parentNode
      ?.insertBefore(
        counter,
        editButton
      );


    lastStatsPath =
      window.location.pathname;

  }


  function handleRouteChange() {

    lastStatsPath =
      null;


    requestAnimationFrame(
      () => {

        registerView();

        renderAdminStats();

      }
    );

  }


  /*
   * React Router меняет URL
   * без перезагрузки страницы.
   */
  const originalPushState =
    history.pushState;


  history.pushState =
    function(...args) {

      const result =
        originalPushState.apply(
          this,
          args
        );


      window.dispatchEvent(
        new Event(
          "boykov-route-change"
        )
      );


      return result;

    };


  const originalReplaceState =
    history.replaceState;


  history.replaceState =
    function(...args) {

      const result =
        originalReplaceState.apply(
          this,
          args
        );


      window.dispatchEvent(
        new Event(
          "boykov-route-change"
        )
      );


      return result;

    };


  window.addEventListener(
    "popstate",
    handleRouteChange
  );


  window.addEventListener(
    "boykov-route-change",
    handleRouteChange
  );


  let scheduled =
    false;


  const observer =
    new MutationObserver(
      () => {

        if (scheduled) {
          return;
        }


        scheduled =
          true;


        requestAnimationFrame(
          () => {

            scheduled =
              false;

            renderAdminStats();

          }
        );

      }
    );


  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );


  registerView();

  renderAdminStats();

})();
