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


    if (!token) {

      removeControl();

      return;
    }


    const user =
      await getAuth(
        token
      );


    if (!user) {

      removeControl();

      return;
    }


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
