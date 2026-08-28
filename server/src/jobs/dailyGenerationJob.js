import cron from "node-cron";

import {
  runScheduledGeneration
} from "../services/scheduledGenerationService.js";


const DAILY_CRON_EXPRESSION =
  process.env.DAILY_GENERATION_CRON ||
  "0 * * * *";


/**
 * Запускает автогенерацию только по cron.
 *
 * ВАЖНО:
 * при старте/restart Passenger генерация
 * больше не запускается автоматически.
 */
export function startDailyGenerationJob() {

  if (
    !cron.validate(
      DAILY_CRON_EXPRESSION
    )
  ) {

    console.error(
      `[ScheduledGeneration] Некорректный cron: "${DAILY_CRON_EXPRESSION}"`
    );

    return;
  }


  cron.schedule(
    DAILY_CRON_EXPRESSION,
    async () => {

      console.log(
        "[ScheduledGeneration] Cron trigger"
      );

      const result =
        await runScheduledGeneration();


      if (
        result.status === "generated"
      ) {

        console.log(
          `[ScheduledGeneration] Создано: ${result.instruction.title}`
        );

        return;
      }


      if (
        result.status === "skipped"
      ) {

        console.log(
          `[ScheduledGeneration] Пропуск: ${result.reason}`
        );

        return;
      }


      console.error(
        `[ScheduledGeneration] Ошибка: ${result.reason}`
      );

    }
  );


  console.log(
    `[ScheduledGeneration] Cron зарегистрирован: "${DAILY_CRON_EXPRESSION}"`
  );

  /*
   * НИЧЕГО здесь сразу не генерируем.
   *
   * Раньше здесь был:
   *
   * runScheduledGeneration()
   *
   * Из-за этого каждый restart Passenger
   * запускал новую платную генерацию.
   */
}
