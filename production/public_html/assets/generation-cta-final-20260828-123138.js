(() => {

  "use strict";


  const TEXT =
    "Создадим её за 2 минуты!";


  function update() {

    const elements =
      document.querySelectorAll(
        ".generationListText"
      );


    for (
      const element
      of elements
    ) {

      if (
        element.textContent !==
        TEXT
      ) {

        element.textContent =
          TEXT;

      }

    }

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

            update();

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


  update();

})();
