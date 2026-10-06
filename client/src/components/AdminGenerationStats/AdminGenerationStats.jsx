import styles from "../AdminPanel/AdminPanel.module.css";


const numberFormatter =
  new Intl.NumberFormat(
    "ru-RU"
  );

const rubFormatter =
  new Intl.NumberFormat(
    "ru-RU",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );


function number(value) {

  return numberFormatter.format(
    Number(value) || 0
  );
}


function rub(value) {

  return (
    rubFormatter.format(
      Number(value) || 0
    ) +
    " ₽"
  );
}



function getGenerationTypeLabel(source) {
  switch (source) {
    case "schedule":
      return "По расписанию";

    case "repair":
      return "Восстановление";

    case "import":
      return "Импорт";

    case "generation":
    default:
      return "Генерация";
  }
}


function getGenerationDisplayName(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "—";
  }

  /*
   * Старые repair-записи могли сохранить весь системный prompt
   * вместо названия профессии.
   *
   * Ищем profession прямо внутри JSON, находящегося в prompt.
   */
  const professionMatch =
    text.match(
      /["']profession["']\s*:\s*["']([^"']+)["']/i
    );

  if (professionMatch?.[1]) {
    return professionMatch[1].trim();
  }

  /*
   * Защита интерфейса на случай другой поврежденной записи.
   */
  if (
    text.includes("Ты являешься редактором") ||
    text.includes("Текущий документ:") ||
    text.includes("Верни только JSON")
  ) {
    return "Восстановление инструкции";
  }

  return text.length > 100
    ? `${text.slice(0, 97)}...`
    : text;
}


export default function AdminGenerationStats({

  stats,
  statsError

}) {

  return (

    <div className={styles.statsBlock}>

      <div className={styles.statsHeader}>

        <div>

          <div className={styles.statsEyebrow}>
            YandexGPT
          </div>

          <h2 className={styles.statsTitle}>
            Расходы на генерацию
          </h2>

        </div>

        {
          stats?.trackingStarted &&
          (
            <div className={styles.tracking}>
              учёт с{" "}
              {
                new Date(
                  stats.trackingStarted
                )
                  .toLocaleString(
                    "ru-RU"
                  )
              }
            </div>
          )
        }

      </div>


      {
        statsError &&
        (
          <div className={styles.statsError}>
            {statsError}
          </div>
        )
      }


      {
        stats &&
        (
          <>
            <div className={styles.cards}>

              <div className={styles.card}>

                <span className={styles.cardLabel}>
                  Сегодня
                </span>

                <strong className={styles.cardValue}>
                  {
                    number(
                      stats.today
                        ?.generations
                    )
                  }
                </strong>

                <span className={styles.cardMeta}>
                  генераций ·{" "}
                  {
                    rub(
                      stats.today
                        ?.costRub
                    )
                  }
                </span>

              </div>


              <div className={styles.card}>

                <span className={styles.cardLabel}>
                  За месяц
                </span>

                <strong className={styles.cardValue}>
                  {
                    rub(
                      stats.month
                        ?.costRub
                    )
                  }
                </strong>

                <span className={styles.cardMeta}>
                  {
                    number(
                      stats.month
                        ?.generations
                    )
                  }
                  {" "}
                  генераций
                </span>

              </div>


              <div className={styles.card}>

                <span className={styles.cardLabel}>
                  Всего
                </span>

                <strong className={styles.cardValue}>
                  {
                    rub(
                      stats.total
                        ?.costRub
                    )
                  }
                </strong>

                <span className={styles.cardMeta}>
                  {
                    number(
                      stats.total
                        ?.apiCalls
                    )
                  }
                  {" "}
                  API-запросов
                </span>

              </div>


              <div className={styles.card}>

                <span className={styles.cardLabel}>
                  Средняя генерация
                </span>

                <strong className={styles.cardValue}>
                  {
                    rub(
                      stats.total
                        ?.averageCostRub
                    )
                  }
                </strong>

                <span className={styles.cardMeta}>
                  {
                    number(
                      stats.total
                        ?.totalTokens
                    )
                  }
                  {" "}
                  токенов всего
                </span>

              </div>

            </div>


            {
              stats.recent
                ?.length > 0 &&
              (
                <div className={styles.tableWrap}>

                  <div className={styles.tableTitle}>
                    Последние операции
                  </div>

                  <table className={styles.table}>

                    <thead>
                      <tr>
                        <th>
                           Тип
                         </th>

                         <th>
                           Профессия
                         </th>

                        <th>
                          API
                        </th>

                        <th>
                          Вход
                        </th>

                        <th>
                          Выход
                        </th>

                        <th>
                          Стоимость
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        stats.recent
                          .slice(
                            0,
                            10
                          )
                          .map(
                            item => (

                              <tr key={item.id}>

                                <td>
                                   {
                                     getGenerationTypeLabel(
                                       item.source
                                     )
                                   }
                                 </td>

                                 <td>
                                   {
                                     getGenerationDisplayName(
                                       item.profession
                                     )
                                   }
                                 </td>

                                <td>
                                  {
                                    number(
                                      item.apiCalls
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    number(
                                      item.inputTokens
                                    )
                                  }
                                </td>

                                <td>
                                  {
                                    number(
                                      item.outputTokens
                                    )
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {
                                      rub(
                                        item.costRub
                                      )
                                    }
                                  </strong>
                                </td>

                              </tr>

                            )
                          )
                      }

                    </tbody>

                  </table>

                </div>
              )
            }

          </>
        )
      }

    </div>

  );

}
