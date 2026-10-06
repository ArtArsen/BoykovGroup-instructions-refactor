import useEditInstructionModal
  from "./hooks/useEditInstructionModal.js";

import styles from "./EditInstructionModal.module.css";


export default function EditInstructionModal({
  instruction,
  onClose,
  onSave
}) {

  const {
    data,
    history,
    rollbackBusy,
    saveBusy,
    updateField,
    updateSectionHeading,
    updateSectionText,
    removeSection,
    addSection,
    handleSave,
    handleRollback
  } =
    useEditInstructionModal({
      instruction,
      onSave
    });


  return (
    <div
      className={
        styles.overlay
      }
    >

      <div
        className={[
          styles.modal,
          styles.editorFullModal
        ]
          .filter(Boolean)
          .join(" ")}
      >

        <button
          type="button"
          className={
            styles.close
          }
          onClick={
            onClose
          }
        >
          ×
        </button>


        <h2>
          Редактирование инструкции
        </h2>


        <label
          className={
            styles.editorField
          }
        >
          Название

          <input
            value={
              data.title ??
              ""
            }
            onChange={
              event =>
                updateField(
                  "title",
                  event.target.value
                )
            }
          />
        </label>


        <label
          className={
            styles.editorField
          }
        >
          Вводный текст

          <textarea
            value={
              data.intro ??
              ""
            }
            onChange={
              event =>
                updateField(
                  "intro",
                  event.target.value
                )
            }
          />
        </label>


        {
          (
            data.sections ||
            []
          )
            .map(
              (
                section,
                sectionIndex
              ) => (

                <div
                  className={[
                    styles.editorSection,
                    styles.editorUnifiedSection
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={
                    `${section.number}-${sectionIndex}`
                  }
                >

                  <div
                    className={
                      styles.editorSectionHeader
                    }
                  >

                    <h3>
                      Раздел{" "}
                      {section.number}
                    </h3>


                    <button
                      type="button"
                      className={
                        styles.editorDangerButton
                      }
                      onClick={
                        () => {

                          if (
                            !String(
                              section.__editorText ??
                              ""
                            )
                              .trim() ||
                            window.confirm(
                              `Удалить раздел ${section.number}?`
                            )
                          ) {

                            removeSection(
                              sectionIndex
                            );

                          }

                        }
                      }
                    >
                      Удалить раздел
                    </button>

                  </div>


                  <label
                    className={
                      styles.editorField
                    }
                  >
                    Заголовок раздела

                    <input
                      value={
                        section.heading ??
                        ""
                      }
                      placeholder={
                        `Название раздела ${section.number}`
                      }
                      onChange={
                        event =>
                          updateSectionHeading(
                            sectionIndex,
                            event.target.value
                          )
                      }
                    />
                  </label>


                  <label
                    className={
                      styles.editorUnifiedSectionField
                    }
                  >

                    <span
                      className={
                        styles.editorUnifiedSectionLabel
                      }
                    >
                      Содержание раздела
                    </span>


                    <textarea
                      className={
                        styles.editorUnifiedSectionTextarea
                      }
                      value={
                        section.__editorText ??
                        ""
                      }
                      onChange={
                        event =>
                          updateSectionText(
                            sectionIndex,
                            event.target.value
                          )
                      }
                      placeholder="Введите содержание всего раздела"
                    />


                    <span
                      className={
                        styles.editorUnifiedSectionHint
                      }
                    >
                      Весь раздел редактируется здесь целиком. Новый абзац отделяйте пустой строкой.
                    </span>

                  </label>

                </div>

              )
            )
        }


        <button
          type="button"
          className={
            styles.editorAddSectionButton
          }
          onClick={
            addSection
          }
        >
          + Добавить раздел
        </button>


        <button
          type="button"
          className={
            styles.rollbackButton
          }
          disabled={
            rollbackBusy ||
            !history?.available
          }
          onClick={
            handleRollback
          }
        >
          {
            rollbackBusy
              ? "Откатываем..."
              : history?.available
                ? (
                    history.count >
                      1
                      ? `Откатить последнее сохранение · ${history.count} версий`
                      : "Откатить последнее сохранение"
                  )
                : "Нет предыдущей версии"
          }
        </button>


        <button
          type="button"
          className={
            styles.save
          }
          disabled={
            saveBusy
          }
          onClick={
            handleSave
          }
        >
          {
            saveBusy
              ? "Сохранение..."
              : "Сохранить изменения"
          }
        </button>

      </div>

    </div>
  );

}
