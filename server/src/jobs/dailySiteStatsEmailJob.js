import cron from "node-cron";

import {
  sendDailySiteStatsEmailIfDue
} from "../services/siteStatsEmailService.js";


const CRON_EXPRESSION =
  process.env.DAILY_STATS_CRON
  ||
  "0 * * * *";

const TIMEZONE =
  "Europe/Moscow";


async function runDailySiteStats() {
  try {
    const result =
      await sendDailySiteStatsEmailIfDue();

    console.log(
      "[DailySiteStats]",
      result.status,
      result.reason || ""
    );
  }
  catch (error) {
    console.error(
      "[DailySiteStats] Error:",
      error
    );
  }
}


export function startDailySiteStatsEmailJob() {
  if (
    !cron.validate(
      CRON_EXPRESSION
    )
  ) {
    console.error(
      `[DailySiteStats] Invalid cron: "${CRON_EXPRESSION}"`
    );

    return;
  }

  cron.schedule(
    CRON_EXPRESSION,
    runDailySiteStats,
    {
      timezone:
        TIMEZONE
    }
  );

  /*
   * Если Passenger был перезапущен
   * уже после 08:00, проверяем отчёт
   * через 5 секунд после старта.
   */
  setTimeout(
    runDailySiteStats,
    5000
  );

  console.log(
    `[DailySiteStats] Cron registered: "${CRON_EXPRESSION}", timezone=${TIMEZONE}`
  );
}
