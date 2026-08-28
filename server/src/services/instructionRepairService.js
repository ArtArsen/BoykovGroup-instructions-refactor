import {
  generateInstructionSectionsWithYandexGpt
} from "./yandexGptService.js";


const REQUIRED_SECTIONS = [
  {
    number: 1,
    heading: "Общие требования охраны труда"
  },
  {
    number: 2,
    heading: "Требования охраны труда перед началом работы"
  },
  {
    number: 3,
    heading: "Требования охраны труда во время работы"
  },
  {
    number: 4,
    heading: "Требования охраны труда в аварийных ситуациях"
  },
  {
    number: 5,
    heading: "Требования охраны труда по окончании работы"
  }
];


function isDangerousProfession(value) {

  const text =
    String(value ?? "").trim();

  if (!text) {
    return true;
  }

  /*
   * Защита от повторного попадания
   * служебного prompt в profession.
   */
  return (
    text.length > 200 ||
    /ты являешься редактором/i.test(text) ||
    /текущий документ/i.test(text) ||
    /ошибки проверки/i.test(text) ||
    /верни только json/i.test(text) ||
    /требования:\s*1\./i.test(text)
  );
}


function getSection(
  sections,
  number
) {

  if (!Array.isArray(sections)) {
    return null;
  }

  return (
    sections.find(
      section =>
        Number(section?.number) ===
        Number(number)
    ) ||
    null
  );
}


function isUsableSection(section) {

  return Boolean(
    section &&
    Array.isArray(section.paragraphs) &&
    section.paragraphs.length > 0
  );
}


export async function repairInstruction(
  instruction,
  errors = []
) {

  const profession =
    String(
      instruction?.profession ?? ""
    ).trim();


  if (isDangerousProfession(profession)) {

    throw new Error(
      "Невозможно восстановить инструкцию: некорректная профессия"
    );

  }


  const originalSections =
    Array.isArray(
      instruction?.sections
    )
      ? instruction.sections
      : [];


  /*
   * Сначала приводим существующие
   * заголовки к стандартному виду.
   */
  const normalizedSections =
    REQUIRED_SECTIONS
      .map(definition => {

        const existing =
          getSection(
            originalSections,
            definition.number
          );

        if (!existing) {
          return null;
        }

        return {
          ...existing,

          number:
            definition.number,

          heading:
            definition.heading
        };

      })
      .filter(Boolean);


  const missingSections =
    REQUIRED_SECTIONS.filter(
      definition => {

        const existing =
          getSection(
            normalizedSections,
            definition.number
          );

        return !isUsableSection(
          existing
        );

      }
    );


  /*
   * Если все 5 разделов уже есть,
   * нейросеть вообще не вызываем.
   *
   * Это исправляет, например,
   * небольшие отличия в heading
   * без дополнительных расходов.
   */
  if (missingSections.length === 0) {

    return {
      ...instruction,

      profession,

      sections:
        REQUIRED_SECTIONS.map(
          definition =>
            getSection(
              normalizedSections,
              definition.number
            )
        ),

      updatedAt:
        new Date().toISOString()
    };

  }


  console.warn(
    `[Repair] "${profession}": отсутствуют/пустые разделы: ` +
    missingSections
      .map(item => item.number)
      .join(", ") +
    (
      errors?.length
        ?
        `. Ошибки проверки: ${errors.join("; ")}`
        :
        ""
    )
  );


  /*
   * КРИТИЧЕСКИ ВАЖНО:
   *
   * generateInstructionWithYandexGpt()
   * получает ТОЛЬКО профессию.
   *
   * Никогда не передаём сюда repairPrompt,
   * JSON документа и тексты ошибок.
   */
  const generated =
    await generateInstructionSectionsWithYandexGpt(
      profession,

      missingSections.map(
        item => item.number
      ),

      {
        source: "repair"
      }
    );


  const mergedSections =
    REQUIRED_SECTIONS.map(
      definition => {

        const existing =
          getSection(
            normalizedSections,
            definition.number
          );

        /*
         * Хороший исходный раздел
         * сохраняем без перегенерации.
         */
        if (isUsableSection(existing)) {

          return {
            ...existing,

            number:
              definition.number,

            heading:
              definition.heading
          };

        }


        /*
         * Берём из YandexGPT только
         * отсутствующий раздел.
         */
        const generatedSection =
          getSection(
            generated?.sections,
            definition.number
          );


        if (
          !isUsableSection(
            generatedSection
          )
        ) {

          throw new Error(
            `Не удалось восстановить раздел №${definition.number}`
          );

        }


        return {
          ...generatedSection,

          number:
            definition.number,

          heading:
            definition.heading
        };

      }
    );


  return {

    /*
     * Все metadata исходного upload
     * остаются исходными.
     */
    ...instruction,

    /*
     * profession НИКОГДА не берём
     * из repair-генерации.
     */
    profession,

    /*
     * Заголовок можем безопасно взять
     * из нормальной генерации, потому что
     * туда передана настоящая профессия.
     */
    title:
      instruction.title,

    intro:
      instruction.intro,

    sections:
      mergedSections,

    updatedAt:
      new Date().toISOString()

  };
}
