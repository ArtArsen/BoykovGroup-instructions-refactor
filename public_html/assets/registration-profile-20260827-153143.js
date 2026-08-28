(() => {
  "use strict";

  const NAME_ID =
    "boykov-registration-name";

  const PHONE_ID =
    "boykov-registration-phone";

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

    const headingText =
      String(
        form.parentElement
          ?.querySelector("h1,h2,h3")
          ?.textContent ||
        ""
      ).toLowerCase();

    return (
      submitText.includes("зарегистр") ||
      submitText.includes("создать аккаунт") ||
      headingText.includes("регистрац")
    );
  }

  function createField(
    id,
    title,
    type,
    name,
    autocomplete,
    placeholder
  ) {
    const label =
      document.createElement("label");

    label.className =
      "boykovProfileField";

    const caption =
      document.createElement("span");

    caption.className =
      "boykovProfileField__label";

    caption.textContent =
      title;

    const input =
      document.createElement("input");

    input.id =
      id;

    input.type =
      type;

    input.name =
      name;

    input.autocomplete =
      autocomplete;

    input.placeholder =
      placeholder;

    input.required =
      true;

    input.setAttribute(
      "aria-required",
      "true"
    );

    input.className =
      "boykovProfileField__input";

    label.append(
      caption,
      input
    );

    return label;
  }

  function cleanup() {
    document
      .querySelectorAll(
        'form[data-boykov-profile="1"]'
      )
      .forEach((form) => {
        if (!isRegistrationForm(form)) {
          form
            .querySelector(
              ".boykovProfileFields"
            )
            ?.remove();

          delete form.dataset
            .boykovProfile;
        }
      });
  }

  function install(form) {
    if (
      form.dataset.boykovProfile ===
      "1"
    ) {
      return;
    }

    const block =
      document.createElement("div");

    block.className =
      "boykovProfileFields";

    block.append(
      createField(
        NAME_ID,
        "Имя",
        "text",
        "name",
        "name",
        "Как к вам обращаться"
      ),

      createField(
        PHONE_ID,
        "Телефон",
        "tel",
        "phone",
        "tel",
        "+7 900 000-00-00"
      )
    );

    const emailInput =
      form.querySelector(
        'input[type="email"], input[name="email"], input[autocomplete="email"]'
      );

    const emailField =
      emailInput?.closest("label");

    const consents =
      form.querySelector(
        ".boykovRegistrationConsents"
      );

    const submit =
      form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );

    if (
      emailField &&
      emailField.parentElement === form
    ) {
      emailField.before(
        block
      );
    }
    else if (consents) {
      consents.before(
        block
      );
    }
    else if (submit) {
      submit.before(
        block
      );
    }
    else {
      form.prepend(
        block
      );
    }

    form.dataset.boykovProfile =
      "1";

    form.addEventListener(
      "submit",
      (event) => {

        const name =
          form.querySelector(
            "#" + NAME_ID
          );

        const phone =
          form.querySelector(
            "#" + PHONE_ID
          );

        if (
          !String(
            name?.value || ""
          ).trim()
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          name?.reportValidity();

          return;
        }

        if (
          !String(
            phone?.value || ""
          ).trim()
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          phone?.reportValidity();
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
        if (
          isRegistrationForm(form)
        ) {
          install(form);
        }
      });
  }


  /*
   * Добавляем name/phone в существующий
   * POST /api/auth/register.
   *
   * Предыдущая обёртка fetch,
   * которая добавляет чекбоксы согласий,
   * сохраняется.
   */

  const previousFetch =
    window.fetch.bind(window);

  window.fetch =
    async function(
      input,
      init = {}
    ) {

      const url =
        typeof input === "string"
          ? input
          : String(
              input?.url || ""
            );

      const options = {
        ...init
      };

      if (
        /\/api\/auth\/register(?:\?|$)/
          .test(url) &&
        typeof options.body ===
          "string"
      ) {
        try {
          const body =
            JSON.parse(
              options.body
            );

          const form =
            document.querySelector(
              'form[data-boykov-profile="1"]'
            );

          body.name =
            String(
              form
                ?.querySelector(
                  "#" + NAME_ID
                )
                ?.value ||
              ""
            ).trim();

          body.phone =
            String(
              form
                ?.querySelector(
                  "#" + PHONE_ID
                )
                ?.value ||
              ""
            ).trim();

          options.body =
            JSON.stringify(
              body
            );
        }
        catch {
        }
      }

      return previousFetch(
        input,
        options
      );
    };


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
  ).observe(
    document.documentElement,
    {
      subtree: true,
      childList: true
    }
  );

})();
