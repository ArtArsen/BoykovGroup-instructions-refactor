(() => {
  "use strict";

  const ROOT_ID =
    "boykovAdminDashboardTabs";

  const STORAGE_KEY =
    "boykov_admin_dashboard_tab_v1";

  const HIDDEN_CLASS =
    "boykovAdminDashboardSection--hidden";

  let scheduled = false;


  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function findHeading(text) {
    return [
      ...document.querySelectorAll(
        "h1, h2, h3"
      )
    ].find(
      element =>
        normalize(
          element.textContent
        ) ===
        text
    ) || null;
  }


  function findDirectChildContaining(
    parent,
    element
  ) {
    if (
      !parent ||
      !element
    ) {
      return null;
    }

    let current =
      element;

    while (
      current &&
      current.parentElement &&
      current.parentElement !== parent
    ) {
      current =
        current.parentElement;
    }

    return (
      current?.parentElement === parent
        ? current
        : null
    );
  }


  function getSections() {
    const visitor =
      document.getElementById(
        "boykovVisitorStats"
      );

    const top10 =
      document.getElementById(
        "boykovTop10"
      )
      ||
      document.querySelector(
        ".boykovTop10"
      );

    if (
      !visitor ||
      !top10
    ) {
      return null;
    }

    /*
     * visitor был вставлен рядом с top10,
     * поэтому их parent — контейнер
     * основных блоков админки.
     */
    const parent =
      top10.parentElement;

    if (
      !parent ||
      visitor.parentElement !== parent
    ) {
      return null;
    }

    const publicationHeading =
      findHeading(
        "Ящик инструкций"
      );

    const publications =
      findDirectChildContaining(
        parent,
        publicationHeading
      );

    if (!publications) {
      return null;
    }

    return {
      parent,

      items: [
        {
          id: "publications",
          label: "Публикации",
          element: publications
        },
        {
          id: "visitors",
          label: "Посетители",
          element: visitor
        },
        {
          id: "top10",
          label: "Топ-10",
          element: top10
        }
      ]
    };
  }


  function getSavedTab(
    validIds
  ) {
    try {
      const value =
        localStorage.getItem(
          STORAGE_KEY
        );

      return validIds.includes(
        value
      )
        ? value
        : "publications";
    }
    catch {
      return "publications";
    }
  }


  function saveTab(id) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        id
      );
    }
    catch {
      // Не мешаем работе админки.
    }
  }


  function activateTab(
    root,
    items,
    id
  ) {
    const valid =
      items.some(
        item =>
          item.id === id
      );

    const activeId =
      valid
        ? id
        : "publications";

    for (
      const item
      of items
    ) {
      const active =
        item.id ===
        activeId;

      item.element.classList.toggle(
        HIDDEN_CLASS,
        !active
      );

      item.element.setAttribute(
        "data-boykov-admin-tab-section",
        item.id
      );

      const button =
        root.querySelector(
          `[data-boykov-admin-tab="${item.id}"]`
        );

      if (button) {
        button.classList.toggle(
          "boykovAdminDashboardTabs__button--active",
          active
        );

        button.setAttribute(
          "aria-selected",
          active
            ? "true"
            : "false"
        );

        button.tabIndex =
          active
            ? 0
            : -1;
      }
    }

    root.dataset.activeTab =
      activeId;

    saveTab(
      activeId
    );
  }


  function createTabs(
    items
  ) {
    const root =
      document.createElement(
        "nav"
      );

    root.id =
      ROOT_ID;

    root.className =
      "boykovAdminDashboardTabs";

    root.setAttribute(
      "aria-label",
      "Разделы административной панели"
    );

    const inner =
      document.createElement(
        "div"
      );

    inner.className =
      "boykovAdminDashboardTabs__inner";

    inner.setAttribute(
      "role",
      "tablist"
    );

    for (
      const item
      of items
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "boykovAdminDashboardTabs__button";

      button.dataset
        .boykovAdminTab =
          item.id;

      button.setAttribute(
        "role",
        "tab"
      );

      button.setAttribute(
        "aria-selected",
        "false"
      );

      button.textContent =
        item.label;

      button.addEventListener(
        "click",
        () => {
          activateTab(
            root,
            items,
            item.id
          );
        }
      );

      inner.appendChild(
        button
      );
    }

    root.appendChild(
      inner
    );

    return root;
  }


  function install() {
    const data =
      getSections();

    if (!data) {
      return;
    }

    const {
      parent,
      items
    } = data;

    let root =
      document.getElementById(
        ROOT_ID
      );

    /*
     * Если React полностью перестроил
     * административный контейнер,
     * создаём вкладки заново.
     */
    if (
      root &&
      root.parentElement !== parent
    ) {
      root.remove();
      root = null;
    }

    if (!root) {
      root =
        createTabs(
          items
        );

      /*
       * Вкладки ставим непосредственно
       * перед первым административным
       * разделом.
       */
      const firstElement =
        items
          .map(
            item =>
              item.element
          )
          .find(
            element =>
              element.parentElement ===
              parent
          );

      if (!firstElement) {
        return;
      }

      parent.insertBefore(
        root,
        firstElement
      );
    }

    const ids =
      items.map(
        item =>
          item.id
      );

    const active =
      root.dataset.activeTab
      ||
      getSavedTab(
        ids
      );

    activateTab(
      root,
      items,
      active
    );
  }


  function scheduleInstall() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    requestAnimationFrame(
      () => {
        scheduled = false;
        install();
      }
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      scheduleInstall,
      {
        once: true
      }
    );
  }
  else {
    scheduleInstall();
  }


  /*
   * Админские блоки создаются динамически,
   * поэтому ждём их появления.
   */
  new MutationObserver(
    scheduleInstall
  )
    .observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
})();
