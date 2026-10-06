import styles from "../AdminPanel/AdminPanel.module.css";


import AdminGenerationRecentTable from "./AdminGenerationRecentTable.jsx";

import {
  number,
  rub
} from "./generationStatsFormatters.js";


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


            <AdminGenerationRecentTable
              recent={
                stats.recent
              }
            />

          </>
        )
      }

    </div>

  );

}
