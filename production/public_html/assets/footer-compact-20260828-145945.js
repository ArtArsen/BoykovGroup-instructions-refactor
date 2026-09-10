(() => {
  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  function commonAncestor(elements) {
    if (!elements.length) return null;

    let current = elements[0];

    while (current) {
      if (elements.every((element) => current.contains(element))) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function findSmallTextElement(root, text) {
    const target = normalize(text);

    return [...root.querySelectorAll("*")]
      .filter((element) => {
        const value = normalize(element.textContent);

        return (
          value.includes(target) &&
          value.length < 120
        );
      })
      .sort(
        (a, b) =>
          a.textContent.trim().length -
          b.textContent.trim().length
      )[0] || null;
  }

  function findRequisitesCard(root) {
    const required = [
      "полное наименование",
      "инн",
      "кпп",
      "юридический адрес",
      "лицензия мчс"
    ];

    const candidates = [
      ...root.querySelectorAll("section, div")
    ].filter((element) => {
      const text = normalize(element.innerText);

      return required.every((phrase) =>
        text.includes(phrase)
      );
    });

    /*
      Берём наиболее глубокий/компактный контейнер,
      содержащий все реквизиты.
    */
    return candidates.sort((a, b) => {
      const aLength = normalize(a.innerText).length;
      const bLength = normalize(b.innerText).length;

      return aLength - bLength;
    })[0] || null;
  }

  function extract(pattern, text, fallback = "") {
    const match = text.match(pattern);
    return match?.[1]?.trim() || fallback;
  }

  function initCompactFooter() {
    if (
      document.querySelector(
        ".bg-footer-requisites-details"
      )
    ) {
      return;
    }

    const headingCandidates = [
      ...document.querySelectorAll(
        "footer *, body *"
      )
    ].filter((element) => {
      const text = normalize(element.textContent);

      return (
        text.includes(
          "реквизиты юридического лица"
        ) &&
        text.length < 100
      );
    });

    const heading = headingCandidates[0];

    if (!heading) {
      console.warn(
        "[footer-compact] requisites heading not found"
      );
      return;
    }

    const footer =
      heading.closest("footer") ||
      heading.parentElement?.parentElement?.parentElement;

    if (!footer) return;

    footer.classList.add(
      "bg-footer-compact-root"
    );

    /*
      Скрываем только короткий старый заголовок,
      а не весь контейнер.
    */
    const headingBlock =
      heading.parentElement &&
      normalize(heading.parentElement.textContent).length <
        120
        ? heading.parentElement
        : heading;

    headingBlock.classList.add(
      "bg-footer-original-heading"
    );

    const card = findRequisitesCard(footer);

    if (!card) {
      console.warn(
        "[footer-compact] requisites card not found"
      );
      return;
    }

    /*
      Не позволяем случайно выбрать сам footer.
    */
    if (card === footer) {
      console.warn(
        "[footer-compact] unsafe requisites container"
      );
      return;
    }

    card.classList.add(
      "bg-footer-requisites-card"
    );

    const cardText = card.innerText || "";

    const inn = extract(
      /инн\s*([0-9]{10,12})/i,
      cardText,
      "5027310150"
    );

    const phoneLink =
      card.querySelector('a[href^="tel:"]');

    const mailLink =
      card.querySelector('a[href^="mailto:"]');

    const phone =
      phoneLink?.textContent?.trim() ||
      "+7 (800) 201-20-43";

    const email =
      mailLink?.textContent?.trim() ||
      "contact@boykovgroup.ru";

    const phoneHref =
      phoneLink?.getAttribute("href") ||
      "tel:+78002012043";

    const mailHref =
      mailLink?.getAttribute("href") ||
      "mailto:contact@boykovgroup.ru";

    const compact =
      document.createElement("div");

    compact.className =
      "bg-footer-compact";

    const line =
      document.createElement("div");

    line.className =
      "bg-footer-compact-line";

    line.innerHTML = `
      <span class="bg-footer-compact-company">
        ООО «СПЕЦКОНС»
      </span>

      <span class="bg-footer-compact-item">
        <span class="bg-footer-compact-label">
          ИНН
        </span>
        ${inn}
      </span>

      <span class="bg-footer-compact-item">
        <a href="${phoneHref}">
          ${phone}
        </a>
      </span>

      <span class="bg-footer-compact-item">
        <a href="${mailHref}">
          ${email}
        </a>
      </span>
    `;

    const details =
      document.createElement("details");

    details.className =
      "bg-footer-requisites-details";

    const summary =
      document.createElement("summary");

    summary.textContent =
      "Все реквизиты компании";

    const parent = card.parentElement;

    if (!parent) return;

    parent.insertBefore(compact, card);

    compact.appendChild(line);
    compact.appendChild(details);

    details.appendChild(summary);
    details.appendChild(card);

    /*
      Компактно оформляем нижние юридические ссылки.
    */
    const legalTexts = [
      "политика",
      "пользовательское соглашение",
      "публичная оферта"
    ];

    const legalLinks = [
      ...footer.querySelectorAll("a")
    ].filter((link) => {
      const text = normalize(link.textContent);

      return legalTexts.some((phrase) =>
        text.includes(phrase)
      );
    });

    if (legalLinks.length >= 2) {
      const legalContainer =
        commonAncestor(legalLinks);

      if (
        legalContainer &&
        legalContainer !== footer
      ) {
        legalContainer.classList.add(
          "bg-footer-legal-links"
        );
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initCompactFooter,
      { once: true }
    );
  } else {
    initCompactFooter();
  }
})();
