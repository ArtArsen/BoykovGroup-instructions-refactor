(() => {

  "use strict";


  const ROOT_ID =
    "boykov-instruction-sort";


  function getMode() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    return (
      params.get("sort")
      ===
      "popular"
    )
      ?
      "popular"
      :
      "newest";
  }


  /*
   * Addon загружается перед главным React bundle
   * и добавляет sort ко всем GET /api/instructions.
   */
  const originalFetch =
    window.fetch.bind(
      window
    );


  window.fetch =
    function(
      input,
      init
    ) {

      try {

        const method =
          String(
            init?.method
            ??
            (
              input instanceof Request
                ? input.method
                : "GET"
            )
          )
          .toUpperCase();


        if (
          method === "GET"
        ) {

          const raw =
            input instanceof Request
              ?
              input.url
              :
              String(input);


          const url =
            new URL(
              raw,
              window.location.origin
            );


          if (
            url.origin ===
              window.location.origin
            &&
            url.pathname ===
              "/api/instructions"
          ) {

            url.searchParams.set(
              "sort",
              getMode()
            );


            if (
              input instanceof Request
            ) {

              input =
                new Request(
                  url.toString(),
                  input
                );

            } else {

              input =
                url.pathname
                +
                url.search
                +
                url.hash;
            }
          }
        }

      } catch (error) {

        console.warn(
          "Instruction sorting:",
          error
        );
      }


      return originalFetch(
        input,
        init
      );
    };


  function chooseMode(
    mode
  ) {

    const url =
      new URL(
        window.location.href
      );


    if (
      mode === "popular"
    ) {

      url.searchParams.set(
        "sort",
        "popular"
      );

    } else {

      url.searchParams.delete(
        "sort"
      );
    }


    window.location.assign(
      url.pathname
      +
      url.search
      +
      url.hash
    );
  }


  function button(
    label,
    mode
  ) {

    const element =
      document.createElement(
        "button"
      );


    element.type =
      "button";


    element.className =
      "boykovInstructionSort__button";


    element.textContent =
      label;


    if (
      getMode() === mode
    ) {

      element.classList.add(
        "boykovInstructionSort__button--active"
      );

      element.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      element.setAttribute(
        "aria-pressed",
        "false"
      );
    }


    element.addEventListener(
      "click",
      () => {

        if (
          getMode() !== mode
        ) {

          chooseMode(
            mode
          );
        }
      }
    );


    return element;
  }


  function findList() {

    const generationCard =
      document.querySelector(
        ".generationListCard"
      );


    if (generationCard) {

      const list =
        generationCard.closest(
          "ul"
        );

      if (list) {
        return list;
      }
    }


    const catalogCard =
      document.querySelector(
        ".generationCatalogCard"
      );


    if (
      catalogCard
      &&
      catalogCard.parentElement
    ) {

      return catalogCard
        .parentElement;
    }


    return null;
  }


  function render() {

    const allowed =
      window.location.pathname === "/"
      ||
      window.location.pathname ===
        "/instrukcii-po-ohrane-truda"
      ||
      window.location.pathname ===
        "/instrukcii-po-ohrane-truda/";


    if (!allowed) {

      document
        .getElementById(
          ROOT_ID
        )
        ?.remove();

      return;
    }


    if (
      document.getElementById(
        ROOT_ID
      )
    ) {
      return;
    }


    const list =
      findList();


    if (
      !list
      ||
      !list.parentNode
    ) {
      return;
    }


    const root =
      document.createElement(
        "div"
      );


    root.id =
      ROOT_ID;


    root.className =
      "boykovInstructionSort";


    const label =
      document.createElement(
        "span"
      );


    label.className =
      "boykovInstructionSort__label";


    label.textContent =
      "Сортировка:";


    const controls =
      document.createElement(
        "div"
      );


    controls.className =
      "boykovInstructionSort__buttons";


    controls.append(
      button(
        "Сначала новые",
        "newest"
      ),

      button(
        "Популярные",
        "popular"
      )
    );


    root.append(
      label,
      controls
    );


    list.parentNode.insertBefore(
      root,
      list
    );
  }


  let pending =
    false;


  const observer =
    new MutationObserver(
      () => {

        if (pending) {
          return;
        }


        pending =
          true;


        requestAnimationFrame(
          () => {

            pending =
              false;

            render();
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


  render();

})();
