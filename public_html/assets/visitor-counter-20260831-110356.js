(() => {
  "use strict";

  const STORAGE_KEY =
    "boykovdocs_visitor_id_v1";

  const ADMIN_TOKEN_KEY =
    "boykovgroup_admin_token";

  let lastLocation =
    null;

  function hasAdminSession() {
    try {
      if (
        localStorage.getItem(
          ADMIN_TOKEN_KEY
        )
      ) {
        return true;
      }

      return (
        sessionStorage.getItem(
          "boykovgroup_active_auth_role"
        )
        ===
        "admin"
      );
    }
    catch {
      return false;
    }
  }

  function createVisitorId() {
    if (
      window.crypto
      &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return crypto
        .randomUUID()
        .replace(
          /-/g,
          "_"
        );
    }

    return (
      Date.now()
        .toString(36)
      +
      "_"
      +
      Math.random()
        .toString(36)
        .slice(2)
      +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }

  function getVisitorId() {
    try {
      let id =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!id) {
        id =
          createVisitorId();

        localStorage.setItem(
          STORAGE_KEY,
          id
        );
      }

      return id;
    }
    catch {
      return null;
    }
  }

  function currentLocationKey() {
    return (
      window.location.pathname
      +
      window.location.search
    );
  }

  function sendPageView() {
    if (
      hasAdminSession()
    ) {
      return;
    }

    const visitorId =
      getVisitorId();

    if (!visitorId) {
      return;
    }

    const locationKey =
      currentLocationKey();

    /*
     * Один и тот же route не считаем
     * повторно из-за технических
     * React-render событий.
     */
    if (
      locationKey ===
      lastLocation
    ) {
      return;
    }

    lastLocation =
      locationKey;

    fetch(
      "/api/visitor-stats/visit",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            visitorId
          }),

        keepalive:
          true,

        cache:
          "no-store"
      }
    )
      .catch(
        () => {
          /*
           * Аналитика не должна
           * влиять на работу сайта.
           */
        }
      );
  }

  function installHistoryTracking() {
    for (
      const method
      of [
        "pushState",
        "replaceState"
      ]
    ) {
      const original =
        history[method];

      if (
        typeof original !==
        "function"
      ) {
        continue;
      }

      history[method] =
        function(...args) {
          const result =
            original.apply(
              this,
              args
            );

          setTimeout(
            sendPageView,
            0
          );

          return result;
        };
    }

    window.addEventListener(
      "popstate",
      () => {
        setTimeout(
          sendPageView,
          0
        );
      }
    );
  }

  installHistoryTracking();

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      sendPageView,
      {
        once: true
      }
    );
  }
  else {
    sendPageView();
  }
})();
