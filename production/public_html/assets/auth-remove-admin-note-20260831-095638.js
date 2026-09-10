(() => {
  const TARGET =
    "Администратор также входит через эту форму по своему логину.";

  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  function removeNote() {
    const elements =
      document.querySelectorAll(
        "p, span, div, small"
      );

    for (const element of elements) {
      /*
       * Удаляем только элемент,
       * содержащий именно эту подпись,
       * чтобы не затронуть контейнер формы.
       */
      if (
        element.childElementCount === 0
        &&
        normalize(element.textContent) === TARGET
      ) {
        /*
         * Не удаляем React-элемент из DOM.
         * Только визуально скрываем его,
         * чтобы не ломать reconciliation
         * при переключении Вход/Регистрация.
         */
        element.style.display = "none";
        element.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }
  }

  removeNote();

  /*
   * Окно авторизации создаётся React динамически,
   * поэтому отслеживаем его появление.
   */
  const observer =
    new MutationObserver(
      () => {
        removeNote();
      }
    );

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );
})();
