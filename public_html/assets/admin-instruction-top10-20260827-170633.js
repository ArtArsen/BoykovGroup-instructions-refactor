(() => {

  "use strict";


  const ROOT_ID =
    "boykov-admin-instruction-top10";


  const TOKEN_KEY =
    "boykovgroup_admin_token";


  const PERIODS = [
    {
      id: "total",
      label: "За всё время"
    },
    {
      id: "today",
      label: "Сегодня"
    },
    {
      id: "7d",
      label: "7 дней"
    },
    {
      id: "30d",
      label: "30 дней"
    }
  ];


  let currentPeriod =
    "total";


  let loading =
    false;


  let refreshTimer =
    null;


  let verifiedToken =
    null;


  function formatNumber(
    value
  ) {

    return Number(
      value
      ||
      0
    )
    .toLocaleString(
      "ru-RU"
    );

  }


  async function getAdminToken() {

    const token =
      localStorage.getItem(
        TOKEN_KEY
      );


    if (!token) {

      verifiedToken =
        null;

      return null;

    }


    if (
      verifiedToken ===
      token
    ) {

      return token;

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
        return null;
      }


      const data =
        await response.json();


      if (
        data?.user?.role !==
        "admin"
      ) {

        return null;

      }


      verifiedToken =
        token;


      return token;

    }
    catch {

      return null;

    }

  }


  function findStatsBlock() {

    const heading =
      Array.from(
        document.querySelectorAll(
          "h2"
        )
      )
      .find(
        item =>
          item.textContent
            ?.trim() ===
          "Расходы на генерацию"
      );


    if (!heading) {
      return null;
    }


    /*
     * Структура:
     *
     * statsBlock
     *   statsHeader
     *     div
     *       h2
     */
    return (
      heading
        .parentElement
        ?.parentElement
        ?.parentElement
      ||
      null
    );

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


  function createRoot() {

    const section =
      createElement(
        "section",
        "boykovTop10"
      );


    section.id =
      ROOT_ID;


    const header =
      createElement(
        "div",
        "boykovTop10__header"
      );


    const headingBox =
      createElement(
        "div",
        "boykovTop10__heading"
      );


    const eyebrow =
      createElement(
        "div",
        "boykovTop10__eyebrow",
        "СТАТИСТИКА"
      );


    const title =
      createElement(
        "h2",
        "boykovTop10__title",
        "Топ-10 инструкций"
      );


    const description =
      createElement(
        "p",
        "boykovTop10__description",
        "Самые просматриваемые инструкции на сайте"
      );


    headingBox.append(
      eyebrow,
      title,
      description
    );


    const tabs =
      createElement(
        "div",
        "boykovTop10__tabs"
      );


    for (
      const period
      of PERIODS
    ) {

      const button =
        createElement(
          "button",
          "boykovTop10__tab",
          period.label
        );


      button.type =
        "button";


      button.dataset.period =
        period.id;


      if (
        period.id ===
        currentPeriod
      ) {

        button.classList.add(
          "boykovTop10__tab--active"
        );

      }


      button.addEventListener(
        "click",
        () => {

          if (
            currentPeriod ===
            period.id
          ) {
            return;
          }


          currentPeriod =
            period.id;


          section
            .querySelectorAll(
              ".boykovTop10__tab"
            )
            .forEach(
              item => {

                item.classList.toggle(
                  "boykovTop10__tab--active",
                  item.dataset.period ===
                  currentPeriod
                );

              }
            );


          loadStats();

        }
      );


      tabs.appendChild(
        button
      );

    }


    header.append(
      headingBox,
      tabs
    );


    const body =
      createElement(
        "div",
        "boykovTop10__body"
      );


    body.innerHTML =
      '<div class="boykovTop10__loading">Загрузка статистики...</div>';


    section.append(
      header,
      body
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


    root =
      createRoot();


    const statsBlock =
      findStatsBlock();


    if (
      statsBlock
      &&
      statsBlock.parentNode
    ) {

      statsBlock.parentNode
        .insertBefore(
          root,
          statsBlock
        );


      return root;

    }


    const main =
      document.querySelector(
        "main"
      );


    if (main) {

      main.appendChild(
        root
      );


      return root;

    }


    return null;

  }


  function createMetricCell(
    value,
    active
  ) {

    const cell =
      createElement(
        "td",
        active
          ? "boykovTop10__number boykovTop10__number--active"
          : "boykovTop10__number",
        formatNumber(
          value
        )
      );


    return cell;

  }


  function renderItems(
    data
  ) {

    const root =
      document.getElementById(
        ROOT_ID
      );


    if (!root) {
      return;
    }


    const body =
      root.querySelector(
        ".boykovTop10__body"
      );


    if (!body) {
      return;
    }


    body.replaceChildren();


    const items =
      Array.isArray(
        data?.items
      )
        ? data.items
        : [];


    if (
      items.length ===
      0
    ) {

      body.appendChild(
        createElement(
          "div",
          "boykovTop10__empty",
          "Пока недостаточно данных о просмотрах."
        )
      );


      return;

    }


    const wrapper =
      createElement(
        "div",
        "boykovTop10__tableWrap"
      );


    const table =
      createElement(
        "table",
        "boykovTop10__table"
      );


    const thead =
      document.createElement(
        "thead"
      );


    const headRow =
      document.createElement(
        "tr"
      );


    for (
      const title
      of [
        "№",
        "Инструкция",
        "Всего",
        "Сегодня",
        "7 дней",
        "30 дней"
      ]
    ) {

      headRow.appendChild(
        createElement(
          "th",
          "",
          title
        )
      );

    }


    thead.appendChild(
      headRow
    );


    const tbody =
      document.createElement(
        "tbody"
      );


    for (
      const item
      of items
    ) {

      const row =
        document.createElement(
          "tr"
        );


      const rank =
        createElement(
          "td",
          "boykovTop10__rank"
      );


      const rankBadge =
        createElement(
          "span",
          item.rank <= 3
            ? `boykovTop10__rankBadge boykovTop10__rankBadge--${item.rank}`
            : "boykovTop10__rankBadge",
          String(
            item.rank
          )
        );


      rank.appendChild(
        rankBadge
      );


      const instructionCell =
        createElement(
          "td",
          "boykovTop10__instruction"
        );


      const link =
        createElement(
          "a",
          "boykovTop10__link",
          item.title
        );


      link.href =
        `/instrukciya-po-ohrane-truda/${encodeURIComponent(item.id)}`;


      instructionCell.appendChild(
        link
      );


      row.append(
        rank,
        instructionCell,

        createMetricCell(
          item.total,
          currentPeriod ===
            "total"
        ),

        createMetricCell(
          item.today,
          currentPeriod ===
            "today"
        ),

        createMetricCell(
          item.last7Days,
          currentPeriod ===
            "7d"
        ),

        createMetricCell(
          item.last30Days,
          currentPeriod ===
            "30d"
        )
      );


      tbody.appendChild(
        row
      );

    }


    table.append(
      thead,
      tbody
    );


    wrapper.appendChild(
      table
    );


    body.appendChild(
      wrapper
    );

  }


  function renderError(
    message
  ) {

    const body =
      document.querySelector(
        `#${ROOT_ID} .boykovTop10__body`
      );


    if (!body) {
      return;
    }


    body.replaceChildren(
      createElement(
        "div",
        "boykovTop10__error",
        message
      )
    );

  }


  async function loadStats() {

    if (loading) {
      return;
    }


    const token =
      await getAdminToken();


    if (!token) {
      return;
    }


    const root =
      insertRoot();


    if (!root) {
      return;
    }


    loading =
      true;


    try {

      const response =
        await fetch(
          `/api/admin/instruction-popularity?period=${encodeURIComponent(currentPeriod)}`,
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


      renderItems(
        data
      );

    }
    catch (error) {

      console.error(
        "Top instructions error:",
        error
      );


      renderError(
        error?.message
        ||
        "Не удалось загрузить статистику."
      );

    }
    finally {

      loading =
        false;

    }

  }


  async function init() {

    /*
     * Админ-панель находится
     * на главной странице.
     */
    if (
      window.location.pathname !==
      "/"
    ) {

      document
        .getElementById(
          ROOT_ID
        )
        ?.remove();


      return;

    }


    const token =
      await getAdminToken();


    if (!token) {

      document
        .getElementById(
          ROOT_ID
        )
        ?.remove();


      return;

    }


    if (
      !findStatsBlock()
    ) {
      return;
    }


    insertRoot();

    loadStats();


    if (!refreshTimer) {

      refreshTimer =
        window.setInterval(
          () => {

            loadStats();

          },
          60000
        );

    }

  }


  let observerScheduled =
    false;


  const observer =
    new MutationObserver(
      () => {

        if (
          observerScheduled
        ) {
          return;
        }


        observerScheduled =
          true;


        requestAnimationFrame(
          () => {

            observerScheduled =
              false;

            init();

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


  init();

})();
