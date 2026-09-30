(() => {
  "use strict";

  const ROOT_ID =
    "boykovPromoAdmin";

  const TOKEN_KEY =
    "boykovgroup_admin_token";

  const API_ROOT =
    "/api/promo-codes/admin";

  let scheduled =
    false;

  let items =
    [];


  function getToken() {
    try {
      return (
        localStorage.getItem(
          TOKEN_KEY
        ) || ""
      );
    }
    catch {
      return "";
    }
  }


  async function api(
    url,
    options = {}
  ) {
    const token =
      getToken();

    if (!token) {
      throw new Error(
        "Нет административной сессии."
      );
    }

    const headers =
      new Headers(
        options.headers || {}
      );

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

    if (
      options.body &&
      !headers.has(
        "Content-Type"
      )
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response =
      await fetch(
        url,
        {
          ...options,
          headers,
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
        data?.error ||
        `Ошибка запроса (${response.status})`
      );
    }

    return data;
  }


  function findParent() {
    const visitor =
      document.getElementById(
        "boykovVisitorStats"
      );

    const top10 =
      document.getElementById(
        "boykovTop10"
      ) ||
      document.querySelector(
        ".boykovTop10"
      );

    if (
      !visitor ||
      !top10 ||
      visitor.parentElement !==
        top10.parentElement
    ) {
      return null;
    }

    return top10.parentElement;
  }


  function escapeHtml(
    value
  ) {
    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      );
  }


  function toLocalInput(
    value
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const local =
      new Date(
        date.getTime() -
        date.getTimezoneOffset() *
          60000
      );

    return local
      .toISOString()
      .slice(
        0,
        16
      );
  }


  function fromLocalInput(
    value
  ) {
    if (!value) {
      return null;
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date
      .toISOString();
  }


  function formatDate(
    value
  ) {
    if (!value) {
      return "без срока";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date
      .toLocaleString(
        "ru-RU"
      );
  }


  function formatNumber(
    value
  ) {
    return new Intl.NumberFormat(
      "ru-RU",
      {
        maximumFractionDigits:
          2
      }
    ).format(
      Number(value) || 0
    );
  }


  function typeLabel(
    promo
  ) {
    if (
      promo.type ===
        "percent"
    ) {
      return (
        `Скидка ${formatNumber(
          promo.value
        )}%`
      );
    }

    return (
      `Цена ${formatNumber(
        promo.value
      )} ₽`
    );
  }


  function showMessage(
    root,
    text,
    type = ""
  ) {
    const message =
      root.querySelector(
        ".boykovPromoAdmin__message"
      );

    if (!message) {
      return;
    }

    message.textContent =
      text || "";

    message.className =
      "boykovPromoAdmin__message";

    if (text) {
      message.classList.add(
        "boykovPromoAdmin__message--visible"
      );
    }

    if (type) {
      message.classList.add(
        `boykovPromoAdmin__message--${type}`
      );
    }
  }


  function createShell() {
    const root =
      document.createElement(
        "section"
      );

    root.id =
      ROOT_ID;

    root.className =
      "boykovPromoAdmin";

    root.innerHTML = `
      <div class="boykovPromoAdmin__header">
        <div>
          <div class="boykovPromoAdmin__eyebrow">
            Оплата
          </div>

          <h2 class="boykovPromoAdmin__title">
            Промокоды
          </h2>

          <p class="boykovPromoAdmin__description">
            Создание и управление скидками для срочной генерации инструкций.
            Использование засчитывается только после подтверждённой оплаты.
          </p>
        </div>

        <div
          class="boykovPromoAdmin__count"
          data-promo-count
        >
          0
        </div>
      </div>

      <div
        class="boykovPromoAdmin__message"
        aria-live="polite"
      ></div>

      <form
        class="boykovPromoAdmin__create"
        data-promo-create-form
      >
        <h3 class="boykovPromoAdmin__createTitle">
          Новый промокод
        </h3>

        <div class="boykovPromoAdmin__grid">

          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Код
            </span>

            <input
              class="boykovPromoAdmin__input"
              name="code"
              maxlength="40"
              placeholder="Например: TEST10"
              required
            >
          </label>

          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Тип
            </span>

            <select
              class="boykovPromoAdmin__select"
              name="type"
            >
              <option value="fixed_price">
                Итоговая цена
              </option>

              <option value="percent">
                Скидка в процентах
              </option>
            </select>
          </label>

          <label class="boykovPromoAdmin__field">
            <span
              class="boykovPromoAdmin__label"
              data-create-value-label
            >
              Цена, ₽
            </span>

            <input
              class="boykovPromoAdmin__input"
              name="value"
              type="number"
              min="0.01"
              step="0.01"
              value="10"
              required
            >
          </label>

          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Лимит использований
            </span>

            <input
              class="boykovPromoAdmin__input"
              name="maxUses"
              type="number"
              min="1"
              step="1"
              placeholder="Без лимита"
            >
          </label>

          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Действует до
            </span>

            <input
              class="boykovPromoAdmin__input"
              name="expiresAt"
              type="datetime-local"
            >
          </label>

        </div>

        <div class="boykovPromoAdmin__createActions">

          <label class="boykovPromoAdmin__checkbox">
            <input
              type="checkbox"
              name="active"
              checked
            >

            Активировать сразу
          </label>

          <button
            class="boykovPromoAdmin__button boykovPromoAdmin__button--primary"
            type="submit"
          >
            Создать промокод
          </button>

        </div>
      </form>

      <div
        class="boykovPromoAdmin__list"
        data-promo-list
      ></div>
    `;

    const form =
      root.querySelector(
        "[data-promo-create-form]"
      );

    const type =
      form.querySelector(
        '[name="type"]'
      );

    const valueLabel =
      form.querySelector(
        "[data-create-value-label]"
      );


    type.addEventListener(
      "change",
      () => {

        valueLabel.textContent =
          type.value ===
            "percent"
            ? "Скидка, %"
            : "Цена, ₽";

      }
    );


    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const button =
          form.querySelector(
            'button[type="submit"]'
          );

        const data =
          new FormData(
            form
          );

        const maxUsesRaw =
          String(
            data.get(
              "maxUses"
            ) || ""
          ).trim();

        const expiresRaw =
          String(
            data.get(
              "expiresAt"
            ) || ""
          ).trim();

        const payload = {
          code:
            String(
              data.get(
                "code"
              ) || ""
            )
              .trim()
              .toUpperCase(),

          type:
            String(
              data.get(
                "type"
              ) ||
              "fixed_price"
            ),

          value:
            Number(
              data.get(
                "value"
              )
            ),

          maxUses:
            maxUsesRaw
              ? Number(
                  maxUsesRaw
                )
              : null,

          expiresAt:
            fromLocalInput(
              expiresRaw
            ),

          active:
            data.get(
              "active"
            ) ===
              "on"
        };


        button.disabled =
          true;

        button.textContent =
          "Создаём...";

        showMessage(
          root,
          ""
        );


        try {

          await api(
            API_ROOT,
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

          form.reset();

          form.querySelector(
            '[name="type"]'
          ).value =
            "fixed_price";

          form.querySelector(
            '[name="value"]'
          ).value =
            "10";

          form.querySelector(
            '[name="active"]'
          ).checked =
            true;

          valueLabel.textContent =
            "Цена, ₽";

          showMessage(
            root,
            "Промокод создан.",
            "success"
          );

          await loadItems(
            root
          );

        }
        catch(error) {

          showMessage(
            root,
            error?.message ||
            "Не удалось создать промокод.",
            "error"
          );

        }
        finally {

          button.disabled =
            false;

          button.textContent =
            "Создать промокод";

        }

      }
    );

    return root;
  }


  function promoCardHtml(
    promo
  ) {
    const active =
      promo.active ===
        true;

    const usage =
      promo.maxUses
        ? `${promo.usedCount} / ${promo.maxUses}`
        : `${promo.usedCount} / ∞`;

    return `
      <article
        class="boykovPromoCard"
        data-promo-id="${escapeHtml(
          promo.id
        )}"
      >

        <div class="boykovPromoCard__top">

          <div>
            <div class="boykovPromoCard__name">

              <span class="boykovPromoCard__code">
                ${escapeHtml(
                  promo.code
                )}
              </span>

              <span class="boykovPromoCard__badge">
                ${escapeHtml(
                  typeLabel(
                    promo
                  )
                )}
              </span>

              <span
                class="boykovPromoCard__badge ${
                  active
                    ? "boykovPromoCard__badge--active"
                    : "boykovPromoCard__badge--disabled"
                }"
              >
                ${
                  active
                    ? "Активен"
                    : "Выключен"
                }
              </span>

            </div>

            <div class="boykovPromoCard__meta">
              Создан:
              ${escapeHtml(
                formatDate(
                  promo.createdAt
                )
              )}
              ·
              Срок:
              ${escapeHtml(
                formatDate(
                  promo.expiresAt
                )
              )}
            </div>
          </div>

          <div class="boykovPromoCard__usage">

            <div class="boykovPromoCard__usageValue">
              ${escapeHtml(
                usage
              )}
            </div>

            <div class="boykovPromoCard__usageLabel">
              использовано
            </div>

          </div>

        </div>


        <div class="boykovPromoCard__grid">

          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Код
            </span>

            <input
              class="boykovPromoAdmin__input"
              data-field="code"
              maxlength="40"
              value="${escapeHtml(
                promo.code
              )}"
            >
          </label>


          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Тип
            </span>

            <select
              class="boykovPromoAdmin__select"
              data-field="type"
            >
              <option
                value="fixed_price"
                ${
                  promo.type ===
                    "fixed_price"
                    ? "selected"
                    : ""
                }
              >
                Итоговая цена
              </option>

              <option
                value="percent"
                ${
                  promo.type ===
                    "percent"
                    ? "selected"
                    : ""
                }
              >
                Скидка %
              </option>
            </select>
          </label>


          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Значение
            </span>

            <input
              class="boykovPromoAdmin__input"
              data-field="value"
              type="number"
              min="0.01"
              step="0.01"
              value="${escapeHtml(
                promo.value
              )}"
            >
          </label>


          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Лимит
            </span>

            <input
              class="boykovPromoAdmin__input"
              data-field="maxUses"
              type="number"
              min="1"
              step="1"
              placeholder="Без лимита"
              value="${
                promo.maxUses ??
                ""
              }"
            >
          </label>


          <label class="boykovPromoAdmin__field">
            <span class="boykovPromoAdmin__label">
              Действует до
            </span>

            <input
              class="boykovPromoAdmin__input"
              data-field="expiresAt"
              type="datetime-local"
              value="${escapeHtml(
                toLocalInput(
                  promo.expiresAt
                )
              )}"
            >
          </label>

        </div>


        <div class="boykovPromoCard__footer">

          <label class="boykovPromoAdmin__checkbox">

            <input
              type="checkbox"
              data-field="active"
              ${
                active
                  ? "checked"
                  : ""
              }
            >

            Промокод активен
          </label>


          <div class="boykovPromoCard__actions">

            <button
              type="button"
              class="boykovPromoAdmin__button"
              data-action="save"
            >
              Сохранить
            </button>

            <button
              type="button"
              class="boykovPromoAdmin__button"
              data-action="toggle"
            >
              ${
                active
                  ? "Выключить"
                  : "Включить"
              }
            </button>

            <button
              type="button"
              class="boykovPromoAdmin__button boykovPromoAdmin__button--danger"
              data-action="delete"
            >
              Удалить
            </button>

          </div>

        </div>

      </article>
    `;
  }


  function readCardPayload(
    card
  ) {
    const get =
      name =>
        card.querySelector(
          `[data-field="${name}"]`
        );

    const maxUsesRaw =
      String(
        get("maxUses")
          ?.value || ""
      )
        .trim();

    const expiresRaw =
      String(
        get("expiresAt")
          ?.value || ""
      )
        .trim();

    return {
      code:
        String(
          get("code")
            ?.value || ""
        )
          .trim()
          .toUpperCase(),

      type:
        String(
          get("type")
            ?.value ||
          "fixed_price"
        ),

      value:
        Number(
          get("value")
            ?.value
        ),

      maxUses:
        maxUsesRaw
          ? Number(
              maxUsesRaw
            )
          : null,

      expiresAt:
        fromLocalInput(
          expiresRaw
        ),

      active:
        get("active")
          ?.checked ===
          true
    };
  }


  function bindCard(
    root,
    card,
    promo
  ) {
    const buttons =
      card.querySelectorAll(
        "button[data-action]"
      );


    function busy(
      value
    ) {
      for (
        const button
        of buttons
      ) {
        button.disabled =
          value;
      }
    }


    card
      .querySelector(
        '[data-action="save"]'
      )
      .addEventListener(
        "click",
        async () => {

          busy(
            true
          );

          showMessage(
            root,
            ""
          );


          try {

            await api(
              `${API_ROOT}/${encodeURIComponent(
                promo.id
              )}`,
              {
                method:
                  "PATCH",

                body:
                  JSON.stringify(
                    readCardPayload(
                      card
                    )
                  )
              }
            );


            showMessage(
              root,
              `Промокод ${promo.code} сохранён.`,
              "success"
            );


            await loadItems(
              root
            );

          }
          catch(error) {

            showMessage(
              root,
              error?.message ||
              "Не удалось сохранить промокод.",
              "error"
            );

          }
          finally {

            busy(
              false
            );

          }

        }
      );


    card
      .querySelector(
        '[data-action="toggle"]'
      )
      .addEventListener(
        "click",
        async () => {

          busy(
            true
          );

          showMessage(
            root,
            ""
          );


          try {

            await api(
              `${API_ROOT}/${encodeURIComponent(
                promo.id
              )}`,
              {
                method:
                  "PATCH",

                body:
                  JSON.stringify({
                    active:
                      promo.active !==
                      true
                  })
              }
            );


            await loadItems(
              root
            );

          }
          catch(error) {

            showMessage(
              root,
              error?.message ||
              "Не удалось изменить состояние промокода.",
              "error"
            );

          }
          finally {

            busy(
              false
            );

          }

        }
      );


    card
      .querySelector(
        '[data-action="delete"]'
      )
      .addEventListener(
        "click",
        async () => {

          const confirmed =
            window.confirm(
              `Удалить промокод ${promo.code}?`
            );

          if (!confirmed) {
            return;
          }


          busy(
            true
          );

          showMessage(
            root,
            ""
          );


          try {

            await api(
              `${API_ROOT}/${encodeURIComponent(
                promo.id
              )}`,
              {
                method:
                  "DELETE"
              }
            );


            showMessage(
              root,
              `Промокод ${promo.code} удалён.`,
              "success"
            );


            await loadItems(
              root
            );

          }
          catch(error) {

            showMessage(
              root,
              error?.message ||
              "Не удалось удалить промокод.",
              "error"
            );

          }
          finally {

            busy(
              false
            );

          }

        }
      );
  }


  function renderItems(
    root
  ) {
    const list =
      root.querySelector(
        "[data-promo-list]"
      );

    const count =
      root.querySelector(
        "[data-promo-count]"
      );


    if (count) {
      count.textContent =
        String(
          items.length
        );
    }


    if (!items.length) {

      list.innerHTML = `
        <div class="boykovPromoAdmin__empty">
          Промокодов пока нет.
        </div>
      `;

      return;
    }


    list.innerHTML =
      items
        .map(
          promo =>
            promoCardHtml(
              promo
            )
        )
        .join("");


    for (
      const promo
      of items
    ) {

      const card =
        list.querySelector(
          `[data-promo-id="${CSS.escape(
            promo.id
          )}"]`
        );


      if (card) {

        bindCard(
          root,
          card,
          promo
        );

      }

    }
  }


  async function loadItems(
    root
  ) {
    try {

      const data =
        await api(
          API_ROOT
        );


      items =
        Array.isArray(
          data?.items
        )
          ? data.items
          : [];


      renderItems(
        root
      );

    }
    catch(error) {

      if (
        /авторизац|сесси/u
          .test(
            String(
              error?.message || ""
            )
          )
      ) {

        root.remove();

        return;

      }


      showMessage(
        root,
        error?.message ||
        "Не удалось загрузить промокоды.",
        "error"
      );

    }
  }


  function install() {
    const parent =
      findParent();


    if (
      !parent ||
      !getToken()
    ) {
      return;
    }


    let root =
      document.getElementById(
        ROOT_ID
      );


    if (
      root &&
      root.parentElement !==
        parent
    ) {

      root.remove();
      root =
        null;

    }


    if (!root) {

      root =
        createShell();


      parent.appendChild(
        root
      );


      loadItems(
        root
      );

    }
  }


  function scheduleInstall() {
    if (scheduled) {
      return;
    }

    scheduled =
      true;


    requestAnimationFrame(
      () => {

        scheduled =
          false;

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
        once:
          true
      }
    );

  }
  else {

    scheduleInstall();

  }


  new MutationObserver(
    scheduleInstall
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

})();
