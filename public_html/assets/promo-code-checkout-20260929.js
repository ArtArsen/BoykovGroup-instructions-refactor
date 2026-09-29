(() => {
  "use strict";

  const ROOT_CLASS =
    "boykovPromoCheckout";

  const ORDERS_PATH =
    "/api/public-generation/orders";

  let appliedPromo =
    null;

  let baseAmount =
    null;

  let scheduled =
    false;


  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function normalizeCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }


  function formatAmount(value) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    return new Intl.NumberFormat(
      "ru-RU",
      {
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  function parseAmount(value) {
    const match =
      String(value || "")
        .replace(/\u00a0/g, " ")
        .match(
          /(\d+(?:[.,]\d+)?)\s*₽/u
        );

    if (!match) {
      return null;
    }

    const result =
      Number(
        match[1]
          .replace(",", ".")
      );

    return Number.isFinite(result)
      ? result
      : null;
  }


  /*
   * ==========================================================
   * PRICE ELEMENTS
   * ==========================================================
   */

  function getForm() {
    return document
      .getElementById(
        "urgent-profession"
      )
      ?.closest(
        "form"
      ) || null;
  }


  function findSummaryPrice(
    form
  ) {
    if (!form) {
      return null;
    }

    return [
      ...form.querySelectorAll(
        "strong"
      )
    ].find(
      element => {
        const parentText =
          normalize(
            element.parentElement
              ?.textContent
          );

        return (
          parentText.includes(
            "Срочная инструкция"
          ) &&
          parseAmount(
            element.textContent
          ) !== null
        );
      }
    ) || null;
  }


  function findPaymentNotePrice(
    form
  ) {
    if (!form) {
      return null;
    }

    return [
      ...form.querySelectorAll(
        "p"
      )
    ]
      .find(
        element =>
          normalize(
            element.textContent
          )
          .includes(
            "Сумма оплаты"
          )
      )
      ?.querySelector(
        "strong"
      ) || null;
  }


  function findHeroPrice() {
    const label =
      [
        ...document.querySelectorAll(
          "div"
        )
      ]
      .find(
        element =>
          element.children.length === 0 &&
          normalize(
            element.textContent
          ) ===
            "Стоимость"
      );

    if (!label) {
      return null;
    }

    const card =
      label.parentElement;

    if (!card) {
      return null;
    }

    return [
      ...card.children
    ].find(
      element =>
        parseAmount(
          element.textContent
        ) !== null
    ) || null;
  }


  function detectBaseAmount() {
    if (
      Number.isFinite(
        baseAmount
      )
    ) {
      return baseAmount;
    }

    const form =
      getForm();

    const candidates = [
      findSummaryPrice(form),
      findHeroPrice(),
      findPaymentNotePrice(form)
    ];

    for (
      const element
      of candidates
    ) {
      const amount =
        parseAmount(
          element?.textContent
        );

      if (
        Number.isFinite(amount) &&
        amount > 0
      ) {
        baseAmount =
          amount;

        return amount;
      }
    }

    /*
     * Production price at the time
     * this feature was introduced.
     *
     * The server remains the source
     * of truth for the actual charge.
     */
    baseAmount = 500;

    return baseAmount;
  }


  function renderPrice(
    originalAmount,
    amount
  ) {
    const form =
      getForm();

    const summary =
      findSummaryPrice(
        form
      );

    const note =
      findPaymentNotePrice(
        form
      );

    const hero =
      findHeroPrice();


    const originalText =
      `${formatAmount(
        originalAmount
      )} ₽`;

    const amountText =
      `${formatAmount(
        amount
      )} ₽`;


    const discounted =
      Number(amount) <
      Number(originalAmount);


    const html =
      discounted
        ? `
          <span class="boykovPromoPrice">
            <span class="boykovPromoPrice__old">${originalText}</span>
            <span class="boykovPromoPrice__new">${amountText}</span>
          </span>
        `
        : amountText;


    if (summary) {
      summary.innerHTML =
        html;
    }


    if (hero) {
      hero.innerHTML =
        html;
    }


    if (note) {
      note.textContent =
        amountText;
    }
  }


  function restoreBasePrice() {
    const amount =
      detectBaseAmount();

    renderPrice(
      amount,
      amount
    );
  }


  /*
   * ==========================================================
   * FETCH INTEGRATION
   * ==========================================================
   *
   * Не передаём amount с клиента.
   *
   * Передаём только promoCode.
   * Итоговую стоимость рассчитывает SERVER.
   */

  const previousFetch =
    window.fetch.bind(
      window
    );


  window.fetch =
    async function(
      input,
      init
    ) {

      let pathname =
        "";

      try {

        const rawUrl =
          typeof input ===
            "string"
            ? input
            : input?.url;

        pathname =
          new URL(
            rawUrl,
            window.location.origin
          )
          .pathname;

      }
      catch {
        pathname = "";
      }


      const method =
        String(
          init?.method ||
          (
            typeof Request !==
              "undefined" &&
            input instanceof Request
              ? input.method
              : "GET"
          )
        )
        .toUpperCase();


      if (
        pathname ===
          ORDERS_PATH &&
        method ===
          "POST" &&
        appliedPromo?.code &&
        typeof init?.body ===
          "string"
      ) {

        try {

          const body =
            JSON.parse(
              init.body
            );


          body.promoCode =
            appliedPromo.code;


          init = {
            ...init,

            body:
              JSON.stringify(
                body
              )
          };

        }
        catch {
          /*
           * Если тело запроса имеет неожиданный
           * формат — не ломаем существующую оплату.
           */
        }

      }


      return previousFetch(
        input,
        init
      );

    };


  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  function setMessage(
    root,
    text,
    type = ""
  ) {
    const element =
      root.querySelector(
        ".boykovPromoCheckout__message"
      );

    if (!element) {
      return;
    }

    element.textContent =
      text || "";

    element.classList.remove(
      "boykovPromoCheckout__message--success",
      "boykovPromoCheckout__message--error"
    );

    if (type) {
      element.classList.add(
        `boykovPromoCheckout__message--${type}`
      );
    }
  }


  function clearAppliedPromo(
    root
  ) {
    appliedPromo =
      null;

    restoreBasePrice();

    if (root) {
      setMessage(
        root,
        ""
      );
    }
  }


  async function applyPromo(
    root
  ) {
    const input =
      root.querySelector(
        ".boykovPromoCheckout__input"
      );

    const button =
      root.querySelector(
        ".boykovPromoCheckout__button"
      );


    const code =
      normalizeCode(
        input?.value
      );


    if (!code) {

      clearAppliedPromo(
        root
      );

      setMessage(
        root,
        "Введите промокод.",
        "error"
      );

      return;
    }


    button.disabled =
      true;

    button.textContent =
      "Проверяем...";

    setMessage(
      root,
      ""
    );


    try {

      const response =
        await previousFetch(
          "/api/promo-codes/validate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                code
              })
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (
        !response.ok ||
        data?.ok !== true
      ) {

        appliedPromo =
          null;

        restoreBasePrice();

        setMessage(
          root,
          data?.error ||
          "Промокод не подходит.",
          "error"
        );

        return;
      }


      appliedPromo = {
        code:
          normalizeCode(
            data?.promo?.code ||
            code
          ),

        originalAmount:
          Number(
            data.originalAmount
          ),

        amount:
          Number(
            data.amount
          ),

        discountAmount:
          Number(
            data.discountAmount
          )
      };


      if (
        Number.isFinite(
          appliedPromo.originalAmount
        )
      ) {
        baseAmount =
          appliedPromo
            .originalAmount;
      }


      renderPrice(
        appliedPromo.originalAmount,
        appliedPromo.amount
      );


      input.value =
        appliedPromo.code;


      setMessage(
        root,
        `Промокод ${appliedPromo.code} применён. Скидка ${formatAmount(
          appliedPromo.discountAmount
        )} ₽.`,
        "success"
      );

    }
    catch {

      appliedPromo =
        null;

      restoreBasePrice();

      setMessage(
        root,
        "Не удалось проверить промокод. Попробуйте ещё раз.",
        "error"
      );

    }
    finally {

      button.disabled =
        false;

      button.textContent =
        "Применить";

    }

  }


  function createRoot() {
    const root =
      document.createElement(
        "div"
      );

    root.className =
      ROOT_CLASS;

    root.innerHTML = `
      <label
        class="boykovPromoCheckout__label"
        for="boykov-promo-code"
      >
        Промокод
      </label>

      <div class="boykovPromoCheckout__row">
        <input
          id="boykov-promo-code"
          class="boykovPromoCheckout__input"
          type="text"
          placeholder="Введите промокод"
          autocomplete="off"
          maxlength="40"
          spellcheck="false"
        >

        <button
          class="boykovPromoCheckout__button"
          type="button"
        >
          Применить
        </button>
      </div>

      <div
        class="boykovPromoCheckout__message"
        aria-live="polite"
      ></div>
    `;


    const input =
      root.querySelector(
        ".boykovPromoCheckout__input"
      );

    const button =
      root.querySelector(
        ".boykovPromoCheckout__button"
      );


    button.addEventListener(
      "click",
      () => {
        applyPromo(
          root
        );
      }
    );


    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter"
        ) {

          event.preventDefault();

          applyPromo(
            root
          );

        }

      }
    );


    input.addEventListener(
      "input",
      () => {

        const current =
          normalizeCode(
            input.value
          );


        if (
          appliedPromo &&
          current !==
            appliedPromo.code
        ) {

          clearAppliedPromo(
            root
          );

        }

      }
    );


    if (appliedPromo) {

      input.value =
        appliedPromo.code;

      setMessage(
        root,
        `Промокод ${appliedPromo.code} применён.`,
        "success"
      );

    }


    return root;
  }


  function install() {
    const professionInput =
      document.getElementById(
        "urgent-profession"
      );

    if (!professionInput) {
      return;
    }


    const form =
      professionInput.closest(
        "form"
      );

    if (!form) {
      return;
    }


    detectBaseAmount();


    let root =
      form.querySelector(
        `.${ROOT_CLASS}`
      );


    if (!root) {

      root =
        createRoot();

      professionInput
        .insertAdjacentElement(
          "afterend",
          root
        );

    }


    /*
     * React может вернуть свои 500 ₽
     * при очередном render.
     * Возвращаем применённую скидку.
     */
    if (appliedPromo) {

      renderPrice(
        appliedPromo.originalAmount,
        appliedPromo.amount
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
