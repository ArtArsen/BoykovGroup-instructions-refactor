(() => {

  "use strict";


  const LINKS = new Map([
    [
      "Охрана труда",
      "https://boykovgroup.ru/ohrana-truda"
    ],

    [
      "Пожарная безопасность",
      "https://boykovgroup.ru/pozharnaya-bezopasnost"
    ],

    [
      "Роспотребнадзор",
      "https://boykovgroup.ru/rospotrebnadzor"
    ],

    [
      "ГО и ЧС",
      "https://boykovgroup.ru/go-chs"
    ],

    [
      "ГО И ЧС",
      "https://boykovgroup.ru/go-chs"
    ],

    [
      "Антитеррористическая безопасность",
      "https://boykovgroup.ru/antiterror"
    ]
  ]);


  const REMOVE_ITEMS =
    new Set([
      "Иные услуги"
    ]);


  function normalizeText(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /\s+/gu,
        " "
      )
      .trim();

  }


  function updateNavigation() {

    const navs =
      document.querySelectorAll(
        "nav"
      );


    for (
      const nav
      of navs
    ) {

      const items =
        nav.querySelectorAll(
          "a, button"
        );


      for (
        const item
        of items
      ) {

        const label =
          normalizeText(
            item.textContent
          );


        /*
         * ===============================================
         * УДАЛЯЕМ "ИНЫЕ УСЛУГИ"
         * ===============================================
         */
        if (
          REMOVE_ITEMS.has(
            label
          )
        ) {

          item.remove();

          continue;

        }


        /*
         * ===============================================
         * РЕАЛЬНЫЕ ССЫЛКИ
         * ===============================================
         */
        const href =
          LINKS.get(
            label
          );


        if (!href) {
          continue;
        }


        /*
         * Текущая Navigation использует <a>,
         * поэтому обычно попадаем сюда.
         */
        if (
          item.tagName ===
          "A"
        ) {

          item.href =
            href;

          item.removeAttribute(
            "target"
          );

          item.removeAttribute(
            "aria-disabled"
          );

          item.dataset
            .boykovRealNavigation =
            "1";

          continue;

        }


        /*
         * Страховка на случай будущей версии,
         * где пункт станет <button>.
         *
         * Сохраняем существующие CSS-классы.
         */
        if (
          item.tagName ===
          "BUTTON"
        ) {

          const link =
            document.createElement(
              "a"
            );


          link.href =
            href;

          link.className =
            item.className;

          link.textContent =
            label;

          link.dataset
            .boykovRealNavigation =
            "1";


          item.replaceWith(
            link
          );

        }

      }

    }

  }


  /*
   * React может пересоздать навигацию,
   * например после перехода по внутренним страницам.
   * Поэтому повторно применяем изменения
   * после DOM-обновлений.
   */
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

            updateNavigation();

          }
        );

      }
    );


  observer.observe(
    document.documentElement,
    {
      childList:
        true,

      subtree:
        true
    }
  );


  updateNavigation();

})();
