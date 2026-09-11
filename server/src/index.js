import { startDailySiteStatsEmailJob } from "./jobs/dailySiteStatsEmailJob.js";
import { thanksRouter } from "./routes/thanks.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { instructionsRouter } from "./routes/instructions.js";
import { instructionViewsRouter } from "./routes/instructionViews.js";
import { instructionPopularityRouter } from "./routes/instructionPopularity.js";
import { visitorStatsRouter } from "./routes/visitorStats.js";
import { instructionPdfRouter } from "./routes/instructionPdf.js";
import { cloudPaymentsWebhookRouter } from "./routes/cloudPaymentsWebhook.js";
import { recoverPublicGenerationOrders } from "./services/publicPaidGenerationService.js";
import { publicGenerationRouter } from "./routes/publicGeneration.js";
import { publicGenerationCheckoutRouter } from "./routes/publicGenerationCheckout.js";
import { authRouter } from "./routes/auth.js";
import { attachUser } from "./middleware/auth.js";
import { isYandexGptConfigured } from "./services/yandexGptService.js";
import { isAdminConfigured } from "./services/authService.js";
import { startDailyGenerationJob } from "./jobs/dailyGenerationJob.js";
import { importsRouter } from "./routes/imports.js";

import seoRouter from "./routes/seo.js";
const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(
  "/api/public-generation/cloudpayments",
  cloudPaymentsWebhookRouter
);

app.use(express.json());
app.use(morgan("dev"));
app.use(attachUser);
app.use(
 "/api/imports",
 importsRouter
);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    yandexGptConfigured: isYandexGptConfigured(),
    adminConfigured: isAdminConfigured(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/public-generation", publicGenerationCheckoutRouter);
app.use("/api/public-generation", publicGenerationRouter);
app.use("/api/instructions", instructionPdfRouter);
app.use("/api/admin/instruction-popularity", instructionPopularityRouter);
app.use("/api/visitor-stats", visitorStatsRouter);
app.use("/api/instructions", instructionViewsRouter);
app.use("/api/instructions", instructionsRouter);
app.use("/", seoRouter);

app.use("/", thanksRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

/*
 * PUBLIC PAID GENERATION RECOVERY
 */
/*
 * PUBLIC_GENERATION_PERIODIC_RECOVERY_V1
 *
 * Первый recovery сразу при старте Passenger.
 */
recoverPublicGenerationOrders();


/*
 * Дополнительная страховка для оплаченных заказов.
 *
 * Если процесс упал после:
 * - подтверждения оплаты;
 * - semantic moderation;
 * - начала генерации;
 * - начала возврата,
 *
 * заказ будет повторно найден без необходимости
 * ждать следующего перезапуска Passenger.
 *
 * processingOrders + disk lock внутри сервиса
 * не позволяют одновременно обрабатывать
 * один заказ в одном/нескольких процессах.
 */
const publicGenerationRecoveryTimer =
  setInterval(
    () => {

      try {

        recoverPublicGenerationOrders();

      }
      catch(error) {

        console.error(
          "[PublicGeneration] periodic recovery failed:",
          error
        );

      }

    },
    60 * 1000
  );


/*
 * Таймер сам по себе не должен удерживать
 * Node.js-процесс при штатном завершении.
 */
if (
  typeof publicGenerationRecoveryTimer.unref ===
    "function"
) {
  publicGenerationRecoveryTimer.unref();
}

app.listen(PORT, () => {
  console.log(`Instructions API запущен на http://localhost:${PORT}`);
  if (!isYandexGptConfigured()) {
    console.warn(
      "YandexGPT не настроен (нет YANDEX_API_KEY/YANDEX_FOLDER_ID) — генерация недостающих инструкций будет недоступна."
    );
  }
  if (!isAdminConfigured()) {
    console.warn(
      "Учётная запись админа не настроена (нет ADMIN_LOGIN/ADMIN_PASSWORD_HASH) — вход в панель будет недоступен."
    );
  }

  startDailyGenerationJob();
startDailySiteStatsEmailJob();
});
