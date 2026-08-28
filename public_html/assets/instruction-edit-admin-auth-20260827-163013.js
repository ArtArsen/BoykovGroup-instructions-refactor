(() => {

  "use strict";

  /*
   * INSTRUCTION_EDIT_ADMIN_AUTH_V1
   *
   * Исправляет только:
   *
   * PUT /api/instructions/:id
   *
   * Остальные запросы сайта,
   * регистрация и PDF не изменяются.
   */

  const ADMIN_TOKEN_KEY =
    "boykovgroup_admin_token";


  const previousFetch =
    window.fetch.bind(
      window
    );


  function getUrl(
    input
  ) {

    if (
      typeof input ===
      "string"
    ) {

      return input;

    }


    if (
      input instanceof URL
    ) {

      return input.href;

    }


    if (
      input instanceof Request
    ) {

      return input.url;

    }


    return String(
      input ?? ""
    );

  }


  function getMethod(
    input,
    init
  ) {

    if (
      init?.method
    ) {

      return String(
        init.method
      ).toUpperCase();

    }


    if (
      input instanceof Request
    ) {

      return String(
        input.method ||
        "GET"
      ).toUpperCase();

    }


    return "GET";

  }


  function isInstructionEditRequest(
    input,
    init
  ) {

    if (
      getMethod(
        input,
        init
      ) !==
      "PUT"
    ) {

      return false;

    }


    let url;


    try {

      url =
        new URL(
          getUrl(
            input
          ),
          window.location.origin
        );

    }

    catch {

      return false;

    }


    /*
     * Только наш домен.
     */

    if (
      url.origin !==
      window.location.origin
    ) {

      return false;

    }


    /*
     * Именно:
     *
     * /api/instructions/<id>
     *
     * Не PDF,
     * не imports,
     * не generation-stats и т.п.
     */

    return (
      /^\/api\/instructions\/[^/]+\/?$/
        .test(
          url.pathname
        )
    );

  }


  window.fetch =
    async function(
      input,
      init = {}
    ) {

      if (
        !isInstructionEditRequest(
          input,
          init
        )
      ) {

        return previousFetch(
          input,
          init
        );

      }


      const token =
        localStorage.getItem(
          ADMIN_TOKEN_KEY
        );


      if (!token) {

        console.warn(
          "[Instruction edit] Admin token is missing"
        );


        return previousFetch(
          input,
          init
        );

      }


      /*
       * Вариант, когда fetch получил Request.
       */

      if (
        input instanceof Request
      ) {

        const headers =
          new Headers(
            input.headers
          );


        if (
          init?.headers
        ) {

          const extraHeaders =
            new Headers(
              init.headers
            );


          for (
            const [
              key,
              value
            ]
            of extraHeaders.entries()
          ) {

            headers.set(
              key,
              value
            );

          }

        }


        /*
         * ВАЖНО:
         * перезаписываем Authorization,
         * даже если старый код уже поставил
         * туда неправильный JWT.
         */

        headers.set(
          "Authorization",
          `Bearer ${token}`
        );


        const request =
          new Request(
            input,
            {
              ...init,
              headers
            }
          );


        return previousFetch(
          request
        );

      }


      /*
       * Обычный fetch(url, options).
       */

      const headers =
        new Headers(
          init?.headers ||
          {}
        );


      headers.set(
        "Authorization",
        `Bearer ${token}`
      );


      return previousFetch(
        input,
        {
          ...init,
          headers
        }
      );

    };


  console.info(
    "[Instruction edit] Admin auth fix active"
  );

})();
