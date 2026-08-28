(() => {
  "use strict";

  const AGREEMENT_TITLE = "Пользовательское соглашение";
  const PERSONAL_DATA_TITLE = "Согласие на обработку персональных данных";
  const ADVERTISING_TITLE = "Согласие на получение рекламных и информационных сообщений";
  const ADVERTISING_NOTE = "Предоставление настоящего Согласия является добровольным и не является обязательным условием регистрации на Сайте, использования личного кабинета, оформления Заказа, оплаты или получения услуг.";

  const IDS = {
    agreement: "boykov-registration-user-agreement",
    personalData: "boykov-registration-personal-data",
    advertising: "boykov-registration-advertising"
  };

  function makeConsent(id, href, text, required) {
    const label = document.createElement("label");
    label.className =
      "boykovRegistrationConsent" +
      (required ? " boykovRegistrationConsent--required" : "");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.className = "boykovRegistrationConsent__checkbox";
    input.required = required;
    input.checked = false;

    const content = document.createElement("span");
    content.className = "boykovRegistrationConsent__content";

    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "boykovRegistrationConsent__link";
    link.textContent = text;

    content.appendChild(link);
    label.append(input, content);

    return label;
  }

  function isRegistrationForm(form) {
    const submit =
      form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );

    const submitText =
      String(
        submit?.textContent ||
        submit?.value ||
        ""
      ).toLowerCase();

    if (
      submitText.includes("зарегистр") ||
      submitText.includes("создать аккаунт")
    ) {
      return true;
    }

    const heading =
      form.parentElement?.querySelector(
        "h1, h2, h3"
      );

    const headingText =
      String(
        heading?.textContent ||
        ""
      ).toLowerCase();

    return headingText.includes("регистрац");
  }

  function cleanup() {
    document
      .querySelectorAll(
        'form[data-boykov-registration-consents="1"]'
      )
      .forEach((form) => {
        if (!isRegistrationForm(form)) {
          form
            .querySelector(
              ".boykovRegistrationConsents"
            )
            ?.remove();

          delete form.dataset
            .boykovRegistrationConsents;
        }
      });
  }

  function install(form) {
    if (
      form.dataset
        .boykovRegistrationConsents === "1"
    ) {
      return;
    }

    const submit =
      form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );

    if (!submit) {
      return;
    }

    const block =
      document.createElement("div");

    block.className =
      "boykovRegistrationConsents";

    const agreement =
      makeConsent(
        IDS.agreement,
        "/user-agreement/",
        AGREEMENT_TITLE,
        true
      );

    const personalData =
      makeConsent(
        IDS.personalData,
        "/personal-data-consent/",
        PERSONAL_DATA_TITLE,
        true
      );

    const advertising =
      makeConsent(
        IDS.advertising,
        "/advertising-consent/",
        ADVERTISING_TITLE,
        false
      );

    const advertisingWrap =
      document.createElement("div");

    advertisingWrap.className =
      "boykovRegistrationConsentOptional";

    const note =
      document.createElement("div");

    note.className =
      "boykovRegistrationConsent__note";

    note.textContent =
      ADVERTISING_NOTE;

    advertisingWrap.append(
      advertising,
      note
    );

    block.append(
      agreement,
      personalData,
      advertisingWrap
    );

    submit.before(block);

    form.dataset
      .boykovRegistrationConsents = "1";

    form.addEventListener(
      "submit",
      (event) => {
        const agreementInput =
          form.querySelector(
            "#" + IDS.agreement
          );

        const personalDataInput =
          form.querySelector(
            "#" + IDS.personalData
          );

        if (
          !agreementInput?.checked ||
          !personalDataInput?.checked
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          (
            !agreementInput?.checked
              ? agreementInput
              : personalDataInput
          )?.reportValidity();
        }
      },
      true
    );
  }

  function scan() {
    cleanup();

    document
      .querySelectorAll("form")
      .forEach((form) => {
        if (isRegistrationForm(form)) {
          install(form);
        }
      });
  }

  const originalFetch =
    window.fetch.bind(window);

  window.fetch = async function(
    input,
    init = {}
  ) {
    const url =
      typeof input === "string"
        ? input
        : String(input?.url || "");

    const nextInit = {
      ...init
    };

    if (
      /\/api\/auth\/register(?:\?|$)/.test(url) &&
      typeof nextInit.body === "string"
    ) {
      try {
        const body =
          JSON.parse(nextInit.body);

        const form =
          document.querySelector(
            'form[data-boykov-registration-consents="1"]'
          );

        body.userAgreementAccepted =
          form
            ?.querySelector(
              "#" + IDS.agreement
            )
            ?.checked === true;

        body.personalDataConsentAccepted =
          form
            ?.querySelector(
              "#" + IDS.personalData
            )
            ?.checked === true;

        body.advertisingConsentAccepted =
          form
            ?.querySelector(
              "#" + IDS.advertising
            )
            ?.checked === true;

        nextInit.body =
          JSON.stringify(body);
      } catch {
      }
    }

    return originalFetch(
      input,
      nextInit
    );
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      scan,
      { once: true }
    );
  } else {
    scan();
  }

  new MutationObserver(scan)
    .observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
})();
