(() => {

  "use strict";


  const TOKEN_KEY =
    "boykovgroup_admin_token";

  const BUTTON_ID =
    "boykov-instruction-rollback";


  let creating =
    false;


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


  function findSaveButton() {

    return (
      Array.from(
        document.querySelectorAll(
          "button"
        )
      )
      .find(
        button =>
          button.textContent
            ?.trim() ===
          "Сохранить изменения"
      )
      ||
      null
    );

  }


  async function getHistory(
    id,
    token
  ) {

    const response =
      await fetch(
        `/api/instructions/${encodeURIComponent(id)}/history`,
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


    return response.json();

  }


  async function doRollback(
    button
  ) {

    const id =
      getInstructionId();


    const token =
      localStorage.getItem(
        TOKEN_KEY
      );


    if (
      !id ||
      !token
    ) {

      window.alert(
        "Не найдена авторизация администратора."
      );

      return;

    }


    if (
      !window.confirm(
        "Вернуть инструкцию к состоянию до последнего сохранения?"
      )
    ) {

      return;

    }


    const oldText =
      button.textContent;


    button.disabled =
      true;

    button.textContent =
      "Откатываем...";


    try {

      const response =
        await fetch(
          `/api/instructions/${encodeURIComponent(id)}/rollback`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
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
          `Ошибка отката (${response.status})`
        );

      }


      window.alert(
        "Предыдущая версия восстановлена."
      );


      window.location.reload();

    }
    catch (error) {

      console.error(
        "Rollback error:",
        error
      );


      window.alert(
        error?.message ||
        "Не удалось выполнить откат."
      );


      button.disabled =
        false;

      button.textContent =
        oldText;

    }

  }


  async function ensureRollbackButton() {

    if (creating) {
      return;
    }


    if (
      document.getElementById(
        BUTTON_ID
      )
    ) {
      return;
    }


    const id =
      getInstructionId();


    const saveButton =
      findSaveButton();


    const token =
      localStorage.getItem(
        TOKEN_KEY
      );


    if (
      !id ||
      !saveButton ||
      !token
    ) {
      return;
    }


    creating =
      true;


    try {

      const history =
        await getHistory(
          id,
          token
        );


      /*
       * Пока запрос выполнялся,
       * React мог перерисовать окно.
       */
      const currentSaveButton =
        findSaveButton();


      if (
        !currentSaveButton ||
        document.getElementById(
          BUTTON_ID
        )
      ) {
        return;
      }


      const button =
        document.createElement(
          "button"
        );


      button.id =
        BUTTON_ID;

      button.type =
        "button";

      button.className =
        "boykovRollbackButton";


      if (
        history?.available
      ) {

        button.disabled =
          false;


        button.textContent =
          history.count > 1
            ? `Откатить последнее сохранение · ${history.count} версий`
            : "Откатить последнее сохранение";

      }
      else {

        button.disabled =
          true;

        button.textContent =
          "Нет предыдущей версии";

      }


      button.addEventListener(
        "click",
        () =>
          doRollback(
            button
          )
      );


      currentSaveButton
        .parentNode
        ?.insertBefore(
          button,
          currentSaveButton
        );

    }

    finally {

      creating =
        false;

    }

  }


  const observer =
    new MutationObserver(
      () => {

        requestAnimationFrame(
          ensureRollbackButton
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


  ensureRollbackButton();

})();
