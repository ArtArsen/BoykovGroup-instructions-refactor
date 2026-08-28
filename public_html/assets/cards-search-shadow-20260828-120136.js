(() => {

  "use strict";


  const TARGET_CLASS =
    "boykovCardSearchShadow";


  /*
   * Ищем поле поиска.
   */
  function findSearchInput() {

    return (
      document.querySelector(
        'input[placeholder*="Поиск инструкций"]'
      )
      ||
      document.querySelector(
        'input[placeholder*="поиск инструкций"]'
      )
      ||
      document.querySelector(
        'input[placeholder*="Поиск"]'
      )
    );

  }


  /*
   * Тень может находиться не на input,
   * а на его внешней оболочке.
   *
   * Поднимаемся вверх и берём первый
   * элемент с реальным box-shadow.
   */
  function findSearchShadowSource() {

    const input =
      findSearchInput();


    if (!input) {
      return null;
    }


    let current =
      input;


    for (
      let level = 0;
      level < 6 && current;
      level += 1
    ) {

      const style =
        window.getComputedStyle(
          current
        );


      if (
        style.boxShadow
        &&
        style.boxShadow !==
          "none"
      ) {

        return current;

      }


      current =
        current.parentElement;

    }


    return null;

  }


  /*
   * У CTA-карточки уже известен
   * реальный hashed-класс обычной карточки:
   *
   * class="<hash> generationListCard"
   *
   * Поэтому не гадаем имя класса из bundle,
   * а определяем его прямо из DOM.
   */
  function getListCardClass() {

    const special =
      document.querySelector(
        ".generationListCard"
      );


    if (!special) {
      return null;
    }


    return Array
      .from(
        special.classList
      )
      .find(
        className =>
          className !==
            "generationListCard"
        &&
          !className.startsWith(
            "boykov"
          )
      )
      ??
      null;

  }


  /*
   * Аналогично для отдельного
   * каталожного вида, если он присутствует.
   */
  function getCatalogCardClass() {

    const special =
      document.querySelector(
        ".generationCatalogCard"
      );


    if (!special) {
      return null;
    }


    return Array
      .from(
        special.classList
      )
      .find(
        className =>
          className !==
            "generationCatalogCard"
        &&
          className !==
            "generationCatalogStandalone"
        &&
          !className.startsWith(
            "boykov"
          )
      )
      ??
      null;

  }


  function markCards() {

    const classes =
      new Set([
        getListCardClass(),
        getCatalogCardClass()
      ]);


    classes.delete(
      null
    );


    classes.delete(
      undefined
    );


    for (
      const className
      of classes
    ) {

      let elements;


      try {

        elements =
          document.querySelectorAll(
            "." +
            CSS.escape(
              className
            )
          );

      }
      catch {

        continue;

      }


      for (
        const element
        of elements
      ) {

        element.classList.add(
          TARGET_CLASS
        );

      }

    }


    return classes.size >
      0;

  }


  function syncShadow() {

    const source =
      findSearchShadowSource();


    if (!source) {
      return false;
    }


    const sourceStyle =
      window.getComputedStyle(
        source
      );


    const shadow =
      sourceStyle.boxShadow;


    if (
      !shadow
      ||
      shadow ===
        "none"
    ) {

      return false;

    }


    /*
     * Передаём реальное значение
     * search shadow в CSS variable.
     */
    document.documentElement.style.setProperty(
      "--boykov-search-shadow",
      shadow
    );


    /*
     * Радиус тоже берём у поиска,
     * но используем только как fallback.
     */
    if (
      sourceStyle.borderRadius
    ) {

      document.documentElement.style.setProperty(
        "--boykov-search-radius",
        sourceStyle.borderRadius
      );

    }


    markCards();


    return true;

  }


  function run() {

    syncShadow();
    markCards();

  }


  let scheduled =
    false;


  const observer =
    new MutationObserver(
      () => {

        if (scheduled) {
          return;
        }


        scheduled =
          true;


        requestAnimationFrame(
          () => {

            scheduled =
              false;

            run();

          }
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


  window.addEventListener(
    "load",
    run,
    {
      once: true
    }
  );


  run();

})();
