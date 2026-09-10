(() => {

  "use strict";


  const LEGAL_LINK_TEXTS =
    new Set([
      "Политика в отношении обработки персональных данных",
      "Пользовательское соглашение",
      "Публичная оферта"
    ]);


  function normalizeText(value) {

    return String(
      value ?? ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }


  function apply() {

    const links =
      document.querySelectorAll(
        "footer a"
      );


    for (
      const link
      of links
    ) {

      const text =
        normalizeText(
          link.textContent
        );


      if (
        !LEGAL_LINK_TEXTS.has(
          text
        )
      ) {
        continue;
      }


      link.setAttribute(
        "target",
        "_blank"
      );

      link.setAttribute(
        "rel",
        "noopener noreferrer"
      );

    }

  }


  /*
   * React может перерисовывать footer,
   * поэтому повторно применяем атрибуты.
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

            apply();

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


  apply();

})();
