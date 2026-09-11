(() => {
  "use strict";

  const ROOT_ID =
    "boykovVisitorStats";

  const ADMIN_TOKEN_KEY =
    "boykovgroup_admin_token";

  let loading = false;

  function formatNumber(
    value
  ) {
    return new Intl.NumberFormat(
      "ru-RU"
    ).format(
      Number(value) || 0
    );
  }

  function getAdminToken() {
    try {
      return (
        localStorage.getItem(
          ADMIN_TOKEN_KEY
        )
        ||
        ""
      );
    }
    catch {
      return "";
    }
  }

  function createElement(
    tag,
    className,
    text
  ) {
    const element =
      document.createElement(
        tag
      );

    if (className) {
      element.className =
        className;
    }

    if (
      text !== undefined
    ) {
      element.textContent =
        text;
    }

    return element;
  }

  function findTop10() {
    return (
      document.querySelector(
        ".boykovTop10"
      )
      ||
      document.getElementById(
        "boykovTop10"
      )
    );
  }

  function createRoot() {
    const section =
      createElement(
        "section",
        "boykovVisitorStats"
      );

    section.id =
      ROOT_ID;

    const header =
      createElement(
        "div",
        "boykovVisitorStats__header"
      );

    const eyebrow =
      createElement(
        "div",
        "boykovVisitorStats__eyebrow",
        "СТАТИСТИКА"
      );

    const title =
      createElement(
        "h2",
        "boykovVisitorStats__title",
        "Посетители сайта"
      );

    const description =
      createElement(
        "p",
        "boykovVisitorStats__description",
        "Уникальные посетители и просмотры страниц"
      );

    header.append(
      eyebrow,
      title,
      description
    );

    const content =
      createElement(
        "div",
        "boykovVisitorStats__content"
      );

    content.innerHTML = `
      <div class="boykovVisitorStats__loading">
        Загружаем статистику…
      </div>
    `;

    section.append(
      header,
      content
    );

    return section;
  }

  function insertRoot() {
    let root =
      document.getElementById(
        ROOT_ID
      );

    if (root) {
      return root;
    }

    const top10 =
      findTop10();

    if (!top10) {
      return null;
    }

    root =
      createRoot();

    top10.parentNode
      ?.insertBefore(
        root,
        top10
      );

    return root;
  }

  function statCard(
    label,
    value
  ) {
    return `
      <div class="boykovVisitorStats__card">
        <div class="boykovVisitorStats__label">
          ${label}
        </div>

        <div class="boykovVisitorStats__value">
          ${formatNumber(value)}
        </div>
      </div>
    `;
  }

  function render(
    data
  ) {
    const root =
      insertRoot();

    if (!root) {
      return;
    }

    const content =
      root.querySelector(
        ".boykovVisitorStats__content"
      );

    if (!content) {
      return;
    }

    content.innerHTML = `
      <div class="boykovVisitorStats__grid">
        ${statCard(
          "Сегодня",
          data?.today?.visitors
        )}

        ${statCard(
          "Вчера",
          data?.yesterday?.visitors
        )}

        ${statCard(
          "7 дней",
          data?.last7Days?.visitors
        )}

        ${statCard(
          "30 дней",
          data?.last30Days?.visitors
        )}

        ${statCard(
          "Всего",
          data?.total?.visitors
        )}
      </div>

      <div class="boykovVisitorStats__pageviews">
        Просмотров страниц сегодня:
        <strong>
          ${formatNumber(
            data?.today?.pageViews
          )}
        </strong>
      </div>

      <div class="boykovVisitorStats__note">
        Уникальные посетители считаются с момента установки счётчика.
      </div>
    `;
  }

  async function loadStats() {
    if (loading) {
      return;
    }

    const token =
      getAdminToken();

    if (!token) {
      return;
    }

    const root =
      insertRoot();

    if (!root) {
      return;
    }

    loading = true;

    try {
      const response =
        await fetch(
          "/api/visitor-stats/admin",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            },

            cache:
              "no-store"
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data?.error
          ||
          `Ошибка статистики (${response.status})`
        );
      }

      render(data);
    }
    catch (error) {
      console.error(
        "Visitor stats admin error:",
        error
      );

      const content =
        root.querySelector(
          ".boykovVisitorStats__content"
        );

      if (content) {
        content.textContent =
          "Не удалось загрузить статистику посетителей.";
      }
    }
    finally {
      loading = false;
    }
  }

  function scan() {
    if (
      !getAdminToken()
    ) {
      return;
    }

    if (
      findTop10()
    ) {
      insertRoot();
      loadStats();
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      scan,
      {
        once: true
      }
    );
  }
  else {
    scan();
  }

  new MutationObserver(
    scan
  )
    .observe(
      document.documentElement,
      {
        childList:
          true,

        subtree:
          true
      }
    );

  window.addEventListener(
    "focus",
    () => {
      if (
        document.getElementById(
          ROOT_ID
        )
      ) {
        loadStats();
      }
    }
  );
})();
