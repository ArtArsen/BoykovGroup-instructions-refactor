import {
  useEffect,
  useState
} from "react";

import {
  useSelector
} from "react-redux";

import {
  selectAuthToken
} from "../../store/authSlice.js";

import {
  getInstructionHistory,
  rollbackInstruction
} from "../../api/instructionsApi.js";

import styles from "./EditInstructionModal.module.css";


export default function EditInstructionModal({
  instruction,
  onClose,
  onSave,
}) {

  const [data, setData] = useState({
    ...instruction,
    sections: (instruction.sections || []).map(section => ({
      ...section,
      paragraphs: [...section.paragraphs],
    })),
  });



  const token =
    useSelector(
      selectAuthToken
    );


  const [
    history,
    setHistory
  ] =
    useState(null);


  const [
    rollbackBusy,
    setRollbackBusy
  ] =
    useState(false);


  useEffect(() => {

    if (
      !instruction?.id ||
      !token
    ) {

      setHistory(
        null
      );

      return undefined;

    }


    let cancelled =
      false;


    getInstructionHistory(
      instruction.id,
      token
    )
    .then(
      data => {

        if (!cancelled) {

          setHistory(
            data
          );

        }

      }
    )
    .catch(
      () => {

        if (!cancelled) {

          setHistory(
            null
          );

        }

      }
    );


    return () => {

      cancelled =
        true;

    };

  }, [
    instruction?.id,
    token
  ]);


  function updateField(field, value) {

    setData(prev => ({
      ...prev,
      [field]: value,
    }));

  }


  function updateParagraph(
    sectionIndex,
    paragraphIndex,
    value
  ) {

    setData(prev => {

      const sections = [...prev.sections];

      sections[sectionIndex].paragraphs[paragraphIndex] = value;


      return {
        ...prev,
        sections,
      };

    });

  }



  async function handleSave() {

    await onSave(data);

  }



  async function handleRollback() {

    if (
      rollbackBusy ||
      !history?.available ||
      !instruction?.id ||
      !token
    ) {

      return;

    }


    if (
      !window.confirm(
        "Вернуть инструкцию к состоянию до последнего сохранения?"
      )
    ) {

      return;

    }


    setRollbackBusy(
      true
    );


    try {

      await rollbackInstruction(
        instruction.id,
        token
      );


      window.alert(
        "Предыдущая версия восстановлена."
      );


      window.location.reload();

    }
    catch(error) {

      console.error(
        "Rollback error:",
        error
      );


      window.alert(
        error?.message ||
        "Не удалось выполнить откат."
      );


      setRollbackBusy(
        false
      );

    }

  }



  return (
    <div className={styles.overlay}>

      <div className={styles.modal}>


        <button
          className={styles.close}
          onClick={onClose}
        >
          ×
        </button>



        <h2>
          Редактирование инструкции
        </h2>



        <label>
          Название

          <input
            value={data.title}
            onChange={(e)=>
              updateField(
                "title",
                e.target.value
              )
            }
          />

        </label>



        <label>
          Вводный текст

          <textarea
            value={data.intro}
            onChange={(e)=>
              updateField(
                "intro",
                e.target.value
              )
            }
          />

        </label>



       {(data.sections || []).map(
          (section, sectionIndex)=>(

          <div
            className={styles.section}
            key={section.number}
          >

            <h3>
              Раздел {section.number}
            </h3>



            {section.paragraphs.map(
              (paragraph, paragraphIndex)=>(

              <textarea
                key={paragraphIndex}
                value={paragraph}
                onChange={(e)=>
                  updateParagraph(
                    sectionIndex,
                    paragraphIndex,
                    e.target.value
                  )
                }
              />

            ))}


          </div>

        ))}



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
                    history.count > 1
                      ? `Откатить последнее сохранение · ${history.count} версий`
                      : "Откатить последнее сохранение"
                  )
                : "Нет предыдущей версии"
          }
        </button>


        <button
          className={styles.save}
          onClick={handleSave}
        >
          Сохранить изменения
        </button>


      </div>

    </div>
  );
}
