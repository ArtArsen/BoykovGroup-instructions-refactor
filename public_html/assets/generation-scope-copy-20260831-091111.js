(() => {
  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  function replaceExactText(oldText, newText) {
    const walker =
      document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(
        walker.currentNode
      );
    }

    for (const node of nodes) {
      if (
        normalize(node.nodeValue) ===
        normalize(oldText)
      ) {
        node.nodeValue =
          node.nodeValue.replace(
            node.nodeValue.trim(),
            newText
          );
      }
    }
  }

  function findGenerationInput() {
    return (
      document.querySelector(
        'input[placeholder*="электромонт"]'
      )
      ||
      [...document.querySelectorAll("input")]
        .find((input) => {
          const placeholder =
            normalize(
              input.placeholder
            )
              .toLowerCase();

          return (
            placeholder.includes(
              "професс"
            )
            ||
            placeholder.includes(
              "электромонт"
            )
          );
        })
      ||
      null
    );
  }

  function init() {
    /*
     * Убираем декоративный номер шага "01".
     */
    const allElements = [
      ...document.querySelectorAll(
        "span, div, p"
      )
    ];

    const stepNumber =
      allElements.find(
        element =>
          element.children.length === 0
          &&
          String(
            element.textContent || ""
          ).trim() === "01"
      );

    if (stepNumber) {
      stepNumber.style.display =
        "none";
    }

    /*
     * HERO
     */
    replaceExactText(
      "[ срочная подготовка ]",
      "[ профессия или вид работ ]"
    );

    replaceExactText(
      "Укажите профессию — подготовим проект инструкции с опорой на требования законодательства Российской Федерации и принятую структуру документов по охране труда.",
      "Укажите профессию, должность или вид работ — подготовим проект инструкции с опорой на требования законодательства Российской Федерации и принятую структуру документов по охране труда."
    );

    /*
     * ШАГ 01
     */
    replaceExactText(
      "Укажите профессию",
      "Укажите профессию или вид работ"
    );

    replaceExactText(
      "Напишите точное название профессии или вида работ, для которых необходима инструкция.",
      "Напишите точное название профессии, должности или вида работ, для которых необходима инструкция."
    );

    /*
     * FIELD
     */
    const input =
      findGenerationInput();

    if (!input) {
      console.warn(
        "[generation-scope-copy] input not found"
      );

      return;
    }

    input.placeholder =
      "Например: электромонтёр или при работе на высоте";

    /*
     * Меняем label над input.
     */
    const container =
      input.parentElement;

    if (container) {
      const candidates =
        [
          ...container.querySelectorAll(
            "label, span, div, p"
          )
        ];

      const label =
        candidates.find(
          (element) =>
            normalize(
              element.textContent
            ) ===
            "Профессия"
        );

      if (label) {
        label.textContent =
          "Профессия или вид работ";
      }
    }

    /*
     * Если label находится уровнем выше.
     */
    const broaderContainer =
      input.closest(
        "form, section, article, div"
      );

    if (broaderContainer) {
      const candidates =
        [
          ...broaderContainer.querySelectorAll(
            "label, span, div, p"
          )
        ];

      const label =
        candidates.find(
          (element) =>
            normalize(
              element.textContent
            ) ===
            "Профессия"
        );

      if (label) {
        label.textContent =
          "Профессия или вид работ";
      }
    }

    /*
     * Подсказка под полем.
     */
    if (
      !document.querySelector(
        ".bg-generation-scope-hint"
      )
    ) {
      const hint =
        document.createElement(
          "div"
        );

      hint.className =
        "bg-generation-scope-hint";

      hint.innerHTML = `
        <span>Можно указать:</span>
        <strong>профессию</strong>
        <span>или</span>
        <strong>конкретный вид работ</strong>
        <span class="bg-generation-scope-examples">
          Например: водитель погрузчика · при работе на высоте · при эксплуатации электрооборудования
        </span>
      `;

      const target =
        input.parentElement;

      if (target) {
        target.appendChild(
          hint
        );
      }
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        setTimeout(
          init,
          50
        );
      },
      {
        once: true
      }
    );
  }
  else {
    setTimeout(
      init,
      50
    );
  }
})();
