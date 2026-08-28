(() => {
  "use strict";


  const TOKEN_KEYS = [
    "boykovgroup_admin_token",
    "boykovgroup_auth_token"
  ];


  const ROOT_ID =
    "boykov-instruction-pdf-download";


  let lastToken =
    undefined;


  let authPromise =
    null;


  function getToken() {

    for (
      const key
      of TOKEN_KEYS
    ) {

      const value =
        localStorage.getItem(
          key
        );

      if (value) {
        return value;
      }

    }

    return null;
  }


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


  function removeControl() {

    document
      .getElementById(
        ROOT_ID
      )
      ?.remove();

  }


  async function getAuth(
    token
  ) {

    if (
      token !==
      lastToken
    ) {

      lastToken =
        token;

      authPromise =
        null;

    }


    if (!token) {
      return null;
    }


    if (!authPromise) {

      authPromise =
        fetch(
          "/api/auth/me",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        )
          .then(
            async response => {

              if (
                !response.ok
              ) {
                return null;
              }

              const data =
                await response.json();

              return (
                data?.user ??
                null
              );
            }
          )
          .catch(
            () => null
          );

    }


    return authPromise;
  }


  function createControl() {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.id =
      ROOT_ID;


    wrapper.className =
      "boykovPdfDownload";


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "boykovPdfDownload__button";


    const badge =
      document.createElement(
        "span"
      );


    badge.className =
      "boykovPdfDownload__badge";


    badge.textContent =
      "PDF";


    const text =
      document.createElement(
        "span"
      );


    text.className =
      "boykovPdfDownload__text";


    button.append(
      badge,
      text
    );


    const status =
      document.createElement(
        "span"
      );


    status.className =
      "boykovPdfDownload__status";


    wrapper.append(
      button,
      status
    );


    return {
      wrapper,
      button,
      text,
      status
    };
  }


  function downloadNameFromHeaders(
    response,
    fallback
  ) {

    const disposition =
      response.headers.get(
        "Content-Disposition"
      ) || "";


    const utf8 =
      disposition.match(
        /filename\*=UTF-8''([^;]+)/i
      );


    if (
      utf8?.[1]
    ) {

      try {

        return decodeURIComponent(
          utf8[1]
        );

      }

      catch {
      }

    }


    return fallback;
  }


  /*
   * GUEST_REGISTRATION_MODAL_V1
   *
   * Используем уже существующую
   * React-модалку авторизации/регистрации.
   * Новую форму регистрации здесь
   * НЕ создаём.
   */

  function isVisible(
    element
  ) {

    if (!element) {
      return false;
    }


    const style =
      window.getComputedStyle(
        element
      );


    if (
      style.display ===
        "none" ||
      style.visibility ===
        "hidden"
    ) {
      return false;
    }


    return (
      element.getClientRects()
        .length > 0
    );
  }


  function findActionByText(
    pattern,
    root = document
  ) {

    const elements =
      Array.from(
        root.querySelectorAll(
          "button, a, [role='button']"
        )
      );


    return (
      elements.find(
        element => {

          if (
            element.closest(
              "#boykov-instruction-pdf-download"
            )
          ) {
            return false;
          }


          if (
            !isVisible(
              element
            )
          ) {
            return false;
          }


          const text =
            String(
              element.textContent ||
              ""
            )
              .trim()
              .replace(
                /\s+/g,
                " "
              );


          return pattern.test(
            text
          );
        }
      ) ??
      null
    );
  }


  function findRegistrationAction() {

    const dialog =
      document.querySelector(
        '[role="dialog"]'
      );


    const root =
      dialog ||
      document;


    return (
      findActionByText(
        /зарегистрироваться|регистрация|создать аккаунт/i,
        root
      )
    );
  }


  /*
   * PDF_GUEST_DIRECT_REGISTRATION_MODAL_V2
   *
   * Гость получает самостоятельную
   * модалку регистрации.
   *
   * Имя, телефон и согласия
   * автоматически добавляются уже
   * подключёнными registration scripts.
   */

  const GUEST_MODAL_ID =
    "boykov-pdf-registration-modal";


  function closeRegistrationModal(
    reloadAfter = false
  ) {

    const modal =
      document.getElementById(
        GUEST_MODAL_ID
      );


    if (!modal) {
      return;
    }


    modal.remove();


    document.body.style.overflow =
      modal.dataset.previousOverflow ||
      "";


    if (reloadAfter) {

      window.location.reload();

    }

  }


  function createModalField({
    label,
    type,
    name,
    autocomplete,
    placeholder,
    minLength
  }) {

    const wrapper =
      document.createElement(
        "label"
      );


    wrapper.className =
      "boykovPdfRegistration__field";


    const caption =
      document.createElement(
        "span"
      );


    caption.className =
      "boykovPdfRegistration__label";


    caption.textContent =
      label;


    const input =
      document.createElement(
        "input"
      );


    input.className =
      "boykovPdfRegistration__input";


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


    if (minLength) {

      input.minLength =
        minLength;

    }


    wrapper.append(
      caption,
      input
    );


    return wrapper;

  }


  function waitForRegistrationFields(
    form,
    submit,
    status
  ) {

    let attempts =
      0;


    const check =
      () => {

        attempts +=
          1;


        const name =
          form.querySelector(
            "#boykov-registration-name"
          );


        const phone =
          form.querySelector(
            "#boykov-registration-phone"
          );


        const consents =
          form.querySelector(
            ".boykovRegistrationConsents"
          );


        if (
          name &&
          phone &&
          consents
        ) {

          submit.disabled =
            false;


          submit.textContent =
            "Зарегистрироваться";


          return;

        }


        if (
          attempts >=
          40
        ) {

          submit.disabled =
            false;


          submit.textContent =
            "Зарегистрироваться";


          status.textContent =
            "";


          return;

        }


        window.setTimeout(
          check,
          50
        );

      };


    check();

  }


  function openRegistrationModal() {

    const existing =
      document.getElementById(
        GUEST_MODAL_ID
      );


    if (existing) {

      existing
        .querySelector(
          'input[name="email"]'
        )
        ?.focus();


      return;

    }


    const overlay =
      document.createElement(
        "div"
      );


    overlay.id =
      GUEST_MODAL_ID;


    overlay.className =
      "boykovPdfRegistration";


    overlay.dataset.previousOverflow =
      document.body.style.overflow ||
      "";


    const modal =
      document.createElement(
        "div"
      );


    modal.className =
      "boykovPdfRegistration__modal";


    modal.setAttribute(
      "role",
      "dialog"
    );


    modal.setAttribute(
      "aria-modal",
      "true"
    );


    modal.setAttribute(
      "aria-labelledby",
      "boykov-pdf-registration-title"
    );


    const close =
      document.createElement(
        "button"
      );


    close.type =
      "button";


    close.className =
      "boykovPdfRegistration__close";


    close.setAttribute(
      "aria-label",
      "Закрыть"
    );


    close.textContent =
      "×";


    const eyebrow =
      document.createElement(
        "div"
      );


    eyebrow.className =
      "boykovPdfRegistration__eyebrow";


    eyebrow.textContent =
      "PDF";


    const title =
      document.createElement(
        "h2"
      );


    title.id =
      "boykov-pdf-registration-title";


    title.className =
      "boykovPdfRegistration__title";


    title.textContent =
      "Регистрация";


    const description =
      document.createElement(
        "p"
      );


    description.className =
      "boykovPdfRegistration__description";


    description.textContent =
      "Зарегистрируйтесь, чтобы скачать инструкцию в PDF.";


    const form =
      document.createElement(
        "form"
      );


    form.className =
      "boykovPdfRegistration__form";


    form.noValidate =
      false;


    /*
     * Имя и телефон сюда намеренно
     * не вставляем.
     *
     * Их добавит уже работающий
     * registration-profile script.
     */
    const emailField =
      createModalField({

        label:
          "Email",

        type:
          "email",

        name:
          "email",

        autocomplete:
          "email",

        placeholder:
          "name@example.ru"

      });


    const passwordField =
      createModalField({

        label:
          "Пароль",

        type:
          "password",

        name:
          "password",

        autocomplete:
          "new-password",

        placeholder:
          "Введите пароль",

        minLength:
          8

      });


    const submit =
      document.createElement(
        "button"
      );


    submit.type =
      "submit";


    submit.className =
      "boykovPdfRegistration__submit";


    submit.disabled =
      true;


    submit.textContent =
      "Подготовка...";


    const status =
      document.createElement(
        "div"
      );


    status.className =
      "boykovPdfRegistration__status";


    status.setAttribute(
      "role",
      "status"
    );


    form.append(
      emailField,
      passwordField,
      submit,
      status
    );


    modal.append(
      close,
      eyebrow,
      title,
      description,
      form
    );


    overlay.appendChild(
      modal
    );


    document.body.appendChild(
      overlay
    );


    document.body.style.overflow =
      "hidden";


    /*
     * Существующие MutationObserver:
     *
     * registration-profile
     * -> добавит Имя и Телефон.
     *
     * registration-consents
     * -> добавит все 3 согласия.
     */
    waitForRegistrationFields(
      form,
      submit,
      status
    );


    close.addEventListener(
      "click",
      () => {

        closeRegistrationModal(
          overlay.dataset.registered ===
            "1"
        );

      }
    );


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {

          closeRegistrationModal(
            overlay.dataset.registered ===
              "1"
          );

        }

      }
    );


    const escapeHandler =
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          document.removeEventListener(
            "keydown",
            escapeHandler
          );


          closeRegistrationModal(
            overlay.dataset.registered ===
              "1"
          );

        }

      };


    document.addEventListener(
      "keydown",
      escapeHandler
    );


    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (
          !form.reportValidity()
        ) {
          return;
        }


        submit.disabled =
          true;


        submit.textContent =
          "Регистрируем...";


        status.className =
          "boykovPdfRegistration__status";


        status.textContent =
          "";


        const email =
          String(
            form.elements.email?.value ||
            ""
          ).trim();


        const password =
          String(
            form.elements.password?.value ||
            ""
          );


        try {

          /*
           * registration-profile и
           * registration-consents уже
           * оборачивают window.fetch.
           *
           * Поэтому к этому body
           * автоматически добавятся:
           *
           * name
           * phone
           * userAgreementAccepted
           * personalDataConsentAccepted
           * advertisingConsentAccepted
           */
          const response =
            await fetch(
              "/api/auth/register",
              {

                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    email,
                    password
                  })

              }
            );


          let data =
            null;


          try {

            data =
              await response.json();

          }

          catch {
          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.error ||
              "Не удалось зарегистрироваться"
            );

          }


          if (
            data?.token
          ) {

            localStorage.setItem(
              "boykovgroup_auth_token",
              data.token
            );

          }


          overlay.dataset.registered =
            "1";


          submit.textContent =
            "Готово";


          submit.disabled =
            true;


          status.className =
            "boykovPdfRegistration__status boykovPdfRegistration__status--success";


          status.textContent =
            data?.verificationEmailSent ===
              false
              ?
                "Регистрация завершена."
              :
                "Регистрация завершена. Подтвердите e-mail по ссылке из письма.";


          window.setTimeout(
            () => {

              closeRegistrationModal(
                true
              );

            },
            1800
          );

        }

        catch (error) {

          submit.disabled =
            false;


          submit.textContent =
            "Зарегистрироваться";


          status.className =
            "boykovPdfRegistration__status boykovPdfRegistration__status--error";


          status.textContent =
            error?.message ||
            "Не удалось зарегистрироваться";

        }

      }
    );


    window.setTimeout(
      () => {

        form
          .querySelector(
            "#boykov-registration-name"
          )
          ?.focus();

      },
      120
    );

  }


  async function downloadPdf(
    instructionId,
    token,
    control
  ) {

    if (
      control.button.disabled
    ) {
      return;
    }


    control.button.disabled =
      true;


    control.wrapper.classList.add(
      "boykovPdfDownload--loading"
    );


    control.text.textContent =
      "Формируем PDF...";


    control.status.textContent =
      "";


    try {

      const response =
        await fetch(
          `/api/instructions/${encodeURIComponent(
            instructionId
          )}/pdf`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      if (!response.ok) {

        let message =
          "Не удалось скачать PDF";


        try {

          const data =
            await response.json();


          if (
            data?.error
          ) {
            message =
              data.error;
          }

        }

        catch {
        }


        throw new Error(
          message
        );
      }


      const blob =
        await response.blob();


      const objectUrl =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        objectUrl;


      link.download =
        downloadNameFromHeaders(
          response,
          `instruction-${instructionId}.pdf`
        );


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.setTimeout(
        () => {

          URL.revokeObjectURL(
            objectUrl
          );

        },
        1500
      );


      control.text.textContent =
        "Скачать PDF";


      control.status.textContent =
        "Файл готов";

    }

    catch (error) {

      control.text.textContent =
        "Скачать PDF";


      control.status.textContent =
        error?.message ||
        "Не удалось скачать PDF";

    }

    finally {

      control.wrapper
        .classList.remove(
          "boykovPdfDownload--loading"
        );


      control.button.disabled =
        false;

    }
  }


  async function render() {

    const instructionId =
      getInstructionId();


    if (!instructionId) {

      removeControl();

      return;
    }


    const token =
      getToken();


    /*
     * У гостя token отсутствует.
     * Кнопку всё равно отображаем.
     */
    const user =
      token
        ? await getAuth(
            token
          )
        : null;


    const title =
      document.querySelector(
        "main article h1"
      );


    if (!title) {
      return;
    }


    let wrapper =
      document.getElementById(
        ROOT_ID
      );


    let control;


    if (!wrapper) {

      control =
        createControl();


      wrapper =
        control.wrapper;


      title.insertAdjacentElement(
        "afterend",
        wrapper
      );

    }

    else {

      control = {
        wrapper,

        button:
          wrapper.querySelector(
            ".boykovPdfDownload__button"
          ),

        text:
          wrapper.querySelector(
            ".boykovPdfDownload__text"
          ),

        status:
          wrapper.querySelector(
            ".boykovPdfDownload__status"
          )
      };

    }


    if (
      !control.button ||
      !control.text ||
      !control.status
    ) {

      wrapper.remove();

      return;
    }


    /*
     * Гость:
     * кнопку показываем как обычную,
     * но вместо запроса PDF
     * открываем регистрацию.
     */
    if (!user) {

      control.wrapper.classList.remove(
        "boykovPdfDownload--locked",
        "boykovPdfDownload--loading"
      );


      control.wrapper.classList.add(
        "boykovPdfDownload--guest"
      );


      control.button.disabled =
        false;


      control.text.textContent =
        "Скачать PDF";


      control.status.textContent =
        "";


      control.button.onclick =
        () => {

          openRegistrationModal();

        };


      return;
    }


    control.wrapper.classList.remove(
      "boykovPdfDownload--guest"
    );


    const allowed =
      user.role ===
        "admin" ||
      (
        user.role ===
          "user" &&
        user.emailVerified ===
          true
      );


    control.button.onclick =
      null;


    if (!allowed) {

      control.wrapper.classList.add(
        "boykovPdfDownload--locked"
      );


      control.button.disabled =
        true;


      control.text.textContent =
        "Подтвердите e-mail для PDF";


      control.status.textContent =
        "";


      return;
    }


    control.wrapper.classList.remove(
      "boykovPdfDownload--locked"
    );


    control.button.disabled =
      false;


    control.text.textContent =
      "Скачать PDF";


    control.status.textContent =
      "";


    control.button.onclick =
      () => {

        void downloadPdf(
          instructionId,
          token,
          control
        );

      };

  }


  let scheduled =
    false;


  function scheduleRender() {

    if (scheduled) {
      return;
    }


    scheduled =
      true;


    requestAnimationFrame(
      () => {

        scheduled =
          false;

        void render();

      }
    );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      scheduleRender,
      {
        once: true
      }
    );

  }

  else {

    scheduleRender();

  }


  new MutationObserver(
    scheduleRender
  ).observe(
    document.documentElement,
    {
      childList:
        true,

      subtree:
        true
    }
  );


  window.addEventListener(
    "popstate",
    scheduleRender
  );


  window.addEventListener(
    "storage",
    scheduleRender
  );

})();
