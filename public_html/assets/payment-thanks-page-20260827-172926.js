(() => {

  "use strict";


  const THANKS_STORAGE_KEY =
    "boykovdocs_thanks_order_v1";

  const LEGACY_STORAGE_KEY =
    "boykovgroup_urgent_generation_order_v1";


  const statusElement =
    document.getElementById(
      "thanks-status"
    );

  const professionElement =
    document.getElementById(
      "thanks-profession"
    );

  const resultRoot =
    document.getElementById(
      "thanks-instruction"
    );

  const modal =
    document.getElementById(
      "thanks-loading-modal"
    );

  const modalTitle =
    document.getElementById(
      "thanks-modal-title"
    );

  const modalText =
    document.getElementById(
      "thanks-modal-text"
    );

  const modalSpinner =
    document.getElementById(
      "thanks-modal-spinner"
    );


  function readSession() {

    for (
      const key
      of [
        THANKS_STORAGE_KEY,
        LEGACY_STORAGE_KEY
      ]
    ) {

      try {

        const raw =
          window.sessionStorage
            .getItem(
              key
            );


        if (!raw) {
          continue;
        }


        const parsed =
          JSON.parse(
            raw
          );


        if (
          parsed?.orderId &&
          parsed?.orderToken
        ) {

          return parsed;

        }

      }
      catch {

        /* try next storage key */

      }

    }


    return null;

  }


  function saveSession(
    order
  ) {

    try {

      window.sessionStorage
        .setItem(
          THANKS_STORAGE_KEY,
          JSON.stringify(
            order
          )
        );

    }
    catch {

      /* no-op */

    }

  }


  function sleep(
    milliseconds
  ) {

    return new Promise(
      resolve =>
        window.setTimeout(
          resolve,
          milliseconds
        )
    );

  }


  function setStatus(
    text,
    type = ""
  ) {

    if (!statusElement) {
      return;
    }


    statusElement.textContent =
      text;


    statusElement.className =
      "thanksStatus";


    if (type) {

      statusElement.classList.add(
        `thanksStatus--${type}`
      );

    }

  }


  function setModal({
    title,
    text,
    spinning = true
  }) {

    if (!modal) {
      return;
    }


    modal.hidden =
      false;


    if (modalTitle) {

      modalTitle.textContent =
        title;

    }


    if (modalText) {

      modalText.textContent =
        text;

    }


    if (modalSpinner) {

      modalSpinner.hidden =
        !spinning;

    }

  }


  function hideModal() {

    if (modal) {

      modal.hidden =
        true;

    }

  }


  function paragraphText(
    value
  ) {

    if (
      typeof value ===
      "string"
    ) {

      return value;

    }


    if (
      value &&
      typeof value ===
      "object"
    ) {

      return String(
        value.text ??
        value.content ??
        ""
      );

    }


    return String(
      value ??
      ""
    );

  }


  function createTextElement(
    tag,
    className,
    text
  ) {

    const element =
      document.createElement(
        tag
      );


    if (className) {

      element.className =
        className;

    }


    element.textContent =
      text;


    return element;

  }


  function instructionTitle(
    instruction
  ) {

    return (
      instruction?.title
      ||
      (
        instruction?.profession
          ? `Инструкция по охране труда: ${instruction.profession}`
          : "Ваша инструкция"
      )
    );

  }


  function createDownloadButton(
    session
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "thanksDownload";

    button.textContent =
      "Скачать PDF";


    button.addEventListener(
      "click",

      async () => {

        const oldText =
          button.textContent;


        button.disabled =
          true;

        button.textContent =
          "Формируем PDF...";


        try {

          const response =
            await fetch(
              `/api/public-generation/orders/${encodeURIComponent(
                session.orderId
              )}/pdf`,

              {
                headers: {
                  "x-order-token":
                    session.orderToken
                },

                cache:
                  "no-store"
              }
            );


          if (!response.ok) {

            const data =
              await response
                .json()
                .catch(
                  () => ({})
                );


            throw new Error(
              data?.error ||
              `Ошибка загрузки (${response.status})`
            );

          }


          const blob =
            await response.blob();


          const disposition =
            response.headers.get(
              "content-disposition"
            )
            ||
            "";


          const filenameMatch =
            disposition.match(
              /filename="([^"]+)"/iu
            );


          const filename =
            filenameMatch?.[1]
            ||
            "instruction.pdf";


          const url =
            URL.createObjectURL(
              blob
            );


          const link =
            document.createElement(
              "a"
            );


          link.href =
            url;

          link.download =
            filename;


          document.body
            .appendChild(
              link
            );


          link.click();
          link.remove();


          window.setTimeout(
            () =>
              URL.revokeObjectURL(
                url
              ),
            2000
          );

        }
        catch (error) {

          window.alert(
            error?.message ||
            "Не удалось скачать PDF."
          );

        }
        finally {

          button.disabled =
            false;

          button.textContent =
            oldText;

        }

      }
    );


    return button;

  }


  function renderInstruction(
    instruction,
    session
  ) {

    if (
      !instruction ||
      !resultRoot
    ) {

      return false;

    }


    resultRoot.replaceChildren();


    const article =
      document.createElement(
        "article"
      );


    article.className =
      "thanksDocument";


    const top =
      document.createElement(
        "div"
      );


    top.className =
      "thanksDocument__top";


    const headingBox =
      document.createElement(
        "div"
      );


    headingBox.append(

      createTextElement(
        "div",
        "thanksDocument__eyebrow",
        "ДОКУМЕНТ ГОТОВ"
      ),

      createTextElement(
        "h2",
        "thanksDocument__title",
        instructionTitle(
          instruction
        )
      )

    );


    top.append(
      headingBox,
      createDownloadButton(
        session
      )
    );


    article.appendChild(
      top
    );


    if (
      instruction.intro
    ) {

      article.appendChild(
        createTextElement(
          "p",
          "thanksDocument__intro",
          String(
            instruction.intro
          )
        )
      );

    }


    const sections =
      Array.isArray(
        instruction.sections
      )
        ? instruction.sections
        : [];


    for (
      let index = 0;
      index < sections.length;
      index++
    ) {

      const section =
        sections[index];


      const sectionElement =
        document.createElement(
          "section"
        );


      sectionElement.className =
        "thanksDocument__section";


      const number =
        section?.number ??
        index + 1;


      const heading =
        String(
          section?.heading ??
          ""
        )
        .trim();


      if (heading) {

        const alreadyNumbered =
          new RegExp(
            `^${String(number).replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}[.)\\s]`,
            "u"
          )
          .test(
            heading
          );


        sectionElement.appendChild(
          createTextElement(
            "h3",
            "thanksDocument__sectionTitle",
            alreadyNumbered
              ? heading
              : `${number}. ${heading}`
          )
        );

      }


      const paragraphs =
        Array.isArray(
          section?.paragraphs
        )
          ? section.paragraphs
          : [];


      for (
        const paragraph
        of paragraphs
      ) {

        const text =
          paragraphText(
            paragraph
          )
          .trim();


        if (!text) {
          continue;
        }


        sectionElement.appendChild(
          createTextElement(
            "p",
            "thanksDocument__paragraph",
            text
          )
        );

      }


      article.appendChild(
        sectionElement
      );

    }


    resultRoot.appendChild(
      article
    );


    hideModal();


    setStatus(
      "Инструкция готова. Вы можете прочитать её ниже или скачать PDF.",
      "ready"
    );


    return true;

  }


  async function fetchPublishedInstruction(
    instructionId
  ) {

    if (!instructionId) {
      return null;
    }


    try {

      const response =
        await fetch(
          `/api/instructions/${encodeURIComponent(
            instructionId
          )}`,
          {
            cache:
              "no-store"
          }
        );


      if (!response.ok) {
        return null;
      }


      return response.json();

    }
    catch {

      return null;

    }

  }


  async function start() {

    const session =
      readSession();


    if (!session) {

      hideModal();


      setStatus(
        "Не удалось восстановить данные оплаченного заказа. Если платёж был выполнен, не оплачивайте повторно — обратитесь в поддержку.",
        "error"
      );


      return;

    }


    saveSession(
      session
    );


    setModal({
      title:
        "Готовим вашу инструкцию",

      text:
        "Оплата подтверждена. Сейчас формируем документ.",

      spinning:
        true
    });


    setStatus(
      "Оплата прошла успешно. Ожидаем готовность инструкции."
    );


    for (
      let attempt = 0;
      attempt < 450;
      attempt++
    ) {

      let response;


      try {

        response =
          await fetch(
            `/api/public-generation/orders/${encodeURIComponent(
              session.orderId
            )}`,

            {
              headers: {
                "x-order-token":
                  session.orderToken
              },

              cache:
                "no-store"
            }
          );

      }
      catch {

        await sleep(
          2000
        );

        continue;

      }


      if (
        response.status ===
          401 ||
        response.status ===
          404
      ) {

        hideModal();


        setStatus(
          "Не удалось получить оплаченный заказ. Не выполняйте повторную оплату.",
          "error"
        );


        return;

      }


      if (!response.ok) {

        await sleep(
          2000
        );

        continue;

      }


      const order =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (
        professionElement &&
        order?.profession
      ) {

        professionElement.textContent =
          order.profession;

      }


      switch (
        order?.status
      ) {

        case "generated": {

          if (
            renderInstruction(
              order?.instruction,
              session
            )
          ) {

            return;

          }


          setModal({
            title:
              "Инструкция готова",

            text:
              "Получаем текст документа...",

            spinning:
              true
          });

          break;

        }


        case "published": {

          let instruction =
            order?.instruction ??
            null;


          if (
            !instruction &&
            order?.instructionId
          ) {

            instruction =
              await fetchPublishedInstruction(
                order.instructionId
              );

          }


          if (
            renderInstruction(
              instruction,
              session
            )
          ) {

            return;

          }


          break;

        }


        case "paid":

          setModal({
            title:
              "Оплата подтверждена",

            text:
              "Запускаем подготовку инструкции.",

            spinning:
              true
          });

          break;


        case "generating":

          setModal({
            title:
              "Готовим вашу инструкцию",

            text:
              "Документ формируется. Страница обновится автоматически.",

            spinning:
              true
          });

          break;


        case "moderating":

          setModal({
            title:
              "Обрабатываем заказ",

            text:
              "Проверяем данные перед формированием документа.",

            spinning:
              true
          });

          break;


        case "manual_review":

          setModal({
            title:
              "Оплата подтверждена",

            text:
              "Заказ принят и требует дополнительной обработки. Повторно оплачивать не нужно.",

            spinning:
              false
          });


          setStatus(
            "Оплата подтверждена. Заказ принят в обработку. Повторная оплата не требуется."
          );


          return;


        case "test_paid":

          setModal({
            title:
              "Тестовый платёж подтверждён",

            text:
              "Платёж обработан в тестовом режиме.",

            spinning:
              false
          });

          return;


        case "refunding":
        case "refund_pending":

          setModal({
            title:
              "Оформляется возврат",

            text:
              "Оплата возвращается. Срок зачисления зависит от банка.",

            spinning:
              false
          });

          return;


        case "refunded":

          hideModal();


          setStatus(
            "Оплата возвращена. Срок зачисления зависит от банка.",
            "error"
          );


          return;


        default:

          break;

      }


      await sleep(
        2000
      );

    }


    setModal({
      title:
        "Заказ принят",

      text:
        "Подготовка документа занимает больше обычного. Повторно оплачивать не нужно.",

      spinning:
        false
    });


    setStatus(
      "Заказ сохранён. Подготовка инструкции продолжается."
    );

  }


  start();

})();
