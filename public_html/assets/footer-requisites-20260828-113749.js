(() => {

  "use strict";


  const ROOT_ID =
    "boykov-footer-requisites";


  function createElement(
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


    if (
      text !== undefined
      &&
      text !== null
    ) {

      element.textContent =
        text;
    }


    return element;
  }


  function createItem(
    label,
    value,
    options = {}
  ) {

    const item =
      createElement(
        "div",
        "boykovFooterReq__item"
      );


    const labelElement =
      createElement(
        "span",
        "boykovFooterReq__label",
        label
      );


    let valueElement;


    if (
      options.href
    ) {

      valueElement =
        createElement(
          "a",
          "boykovFooterReq__value boykovFooterReq__link",
          value
        );


      valueElement.href =
        options.href;

    }
    else if (
      options.address
    ) {

      valueElement =
        createElement(
          "address",
          "boykovFooterReq__value boykovFooterReq__address",
          value
        );

    }
    else {

      valueElement =
        createElement(
          options.strong
            ?
            "strong"
            :
            "span",

          "boykovFooterReq__value",

          value
        );

    }


    item.append(
      labelElement,
      valueElement
    );


    return item;
  }


  function buildSection() {

    const section =
      createElement(
        "section",
        "boykovFooterReq"
      );


    section.id =
      ROOT_ID;


    const inner =
      createElement(
        "div",
        "boykovFooterReq__inner"
      );


    const head =
      createElement(
        "div",
        "boykovFooterReq__head"
      );


    head.appendChild(
      createElement(
        "span",
        "boykovFooterReq__eyebrow",
        "Реквизиты юридического лица"
      )
    );


    const grid =
      createElement(
        "div",
        "boykovFooterReq__grid"
      );


    /*
     * ========================================================
     * КОЛОНКА 1 — КОМПАНИЯ
     * ========================================================
     */

    const company =
      createElement(
        "div",
        "boykovFooterReq__column"
      );


    company.append(
      createItem(
        "Полное наименование",
        "Общество с ограниченной ответственностью «СПЕЦКОНС»",
        {
          strong: true
        }
      ),

      createItem(
        "Бренд",
        "БОЙКОВГРУПП"
      ),

      createItem(
        "Руководитель",
        "Бойков Николай Александрович, генеральный директор"
      )
    );


    /*
     * ========================================================
     * КОЛОНКА 2 — РЕКВИЗИТЫ
     * ========================================================
     */

    const requisites =
      createElement(
        "div",
        "boykovFooterReq__column"
      );


    const numbers =
      createElement(
        "div",
        "boykovFooterReq__numbers"
      );


    numbers.append(
      createItem(
        "ИНН",
        "5027310150"
      ),

      createItem(
        "КПП",
        "502701001"
      )
    );


    requisites.append(
      numbers,

      createItem(
        "ОГРН",
        "1225000108618"
      ),

      createItem(
        "Лицензия МЧС",
        "Л014-00101-50/00624678"
      ),

      createItem(
        "Образовательная лицензия",
        "№ Л035-01255-50-06059814"
      )
    );


    /*
     * ========================================================
     * КОЛОНКА 3 — КОНТАКТЫ И АДРЕСА
     * ========================================================
     */

    const contacts =
      createElement(
        "div",
        "boykovFooterReq__column"
      );


    const contactsTop =
      createElement(
        "div",
        "boykovFooterReq__contactRow"
      );


    contactsTop.append(
      createItem(
        "Телефон",
        "+7 (800) 201-20-43",
        {
          href:
            "tel:+78002012043"
        }
      ),

      createItem(
        "Email",
        "contact@boykovgroup.ru",
        {
          href:
            "mailto:contact@boykovgroup.ru"
        }
      )
    );


    contacts.append(
      contactsTop,

      createItem(
        "Юридический адрес",
        "140054, Московская область, г. о. Котельники, г. Котельники, мкр. Парковый, д. 2, помещ. 0181",
        {
          address: true
        }
      ),

      createItem(
        "Московский офис",
        "Москва, проспект Мира, 101с1, БЦ «Гипромез», офис №1308",
        {
          address: true
        }
      )
    );


    grid.append(
      company,
      requisites,
      contacts
    );


    inner.append(
      head,
      grid
    );


    section.appendChild(
      inner
    );


    return section;
  }


  function findFooter() {

    return (
      document.querySelector(
        "footer"
      )
      ||
      document.querySelector(
        '[class*="footer"]'
      )
    );
  }


  function findBottomArea(
    footer
  ) {

    /*
     * Стараемся оставить:
     *
     * политика,
     * согласия,
     * копирайт
     *
     * ниже нового блока.
     */
    const children =
      Array.from(
        footer.children
      );


    for (
      let i =
        children.length - 1;

      i >= 0;

      i -= 1
    ) {

      const child =
        children[i];


      const text =
        String(
          child.textContent ?? ""
        )
          .toLowerCase();


      if (
        text.includes(
          "политик"
        )
        ||
        text.includes(
          "соглас"
        )
        ||
        text.includes(
          "©"
        )
        ||
        text.includes(
          "2026"
        )
      ) {

        return child;

      }

    }


    return null;
  }


  function mount() {

    if (
      document.getElementById(
        ROOT_ID
      )
    ) {

      return true;

    }


    const footer =
      findFooter();


    if (!footer) {
      return false;
    }


    const section =
      buildSection();


    const bottomArea =
      findBottomArea(
        footer
      );


    if (
      bottomArea
      &&
      bottomArea.parentNode ===
        footer
    ) {

      footer.insertBefore(
        section,
        bottomArea
      );

    }
    else {

      footer.appendChild(
        section
      );

    }


    return true;
  }


  /*
   * React может отрисовать footer
   * после загрузки addon.
   */
  if (!mount()) {

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


              if (
                mount()
              ) {

                observer.disconnect();

              }

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

  }

})();
