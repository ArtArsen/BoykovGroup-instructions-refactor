(() => {

  "use strict";

  const ROUTE =
    "/instrukcii-po-ohrane-truda";

  const ID =
    "boykovCatalogHomeButton";


  function removeButton() {

    const existing =
      document.getElementById(
        ID
      );

    if (existing) {
      existing.remove();
    }

  }


  function mount() {

    if (
      window.location.pathname !==
      ROUTE
    ) {

      removeButton();
      return;
    }


    if (
      document.getElementById(
        ID
      )
    ) {
      return;
    }


    const main =
      document.querySelector(
        "main"
      );

    if (!main) {
      return;
    }


    const anchor =
      document.createElement(
        "a"
      );

    anchor.id =
      ID;

    anchor.className =
      "boykovCatalogHomeButton";

    anchor.href =
      "/";

    anchor.textContent =
      "← На главную";


    /*
     * Ставим непосредственно
     * перед первым H1 страницы.
     */

    const heading =
      main.querySelector(
        "h1"
      );


    if (heading) {

      heading.parentNode.insertBefore(
        anchor,
        heading
      );

    } else {

      main.insertBefore(
        anchor,
        main.firstChild
      );

    }

  }


  /*
   * React может перерисовывать DOM.
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

            mount();

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


  /*
   * Поддержка SPA-навигации.
   */

  const notify = () => {

    setTimeout(
      mount,
      0
    );

  };


  for (
    const method
    of [
      "pushState",
      "replaceState"
    ]
  ) {

    const original =
      history[method];

    history[method] =
      function (...args) {

        const result =
          original.apply(
            this,
            args
          );

        notify();

        return result;
      };

  }


  window.addEventListener(
    "popstate",
    notify
  );


  mount();

})();
