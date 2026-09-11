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


  function openRegistrationModal() {

    /*
     * Если регистрационная модалка
     * или переключатель уже открыт —
     * нажимаем сразу.
     */
    const alreadyAvailable =
      findRegistrationAction();


    if (alreadyAvailable) {

      alreadyAvailable.click();

      return;
    }


    /*
     * Иначе открываем штатную
     * модалку по кнопке "Войти".
     */
    const loginButton =
      findActionByText(
        /^(войти|вход)$/i,
        document
      );


    if (!loginButton) {

      console.warn(
        "PDF: auth button not found"
      );

      return;
    }


    loginButton.click();


    /*
     * React отрисовывает модалку
     * асинхронно. Несколько коротких
     * попыток нужны только для того,
     * чтобы нажать штатный переключатель
     * на регистрацию после появления DOM.
     */
    const delays = [
      0,
      50,
      120,
      220,
      350
    ];


    for (
      const delay
      of delays
    ) {

      window.setTimeout(
        () => {

          const registrationButton =
            findRegistrationAction();


          if (
            registrationButton
          ) {

            registrationButton.click();

          }

        },
        delay
      );

    }

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
