import {
  Router
} from "express";

import {
  updatePublicGenerationOrder,
  getPublicGenerationOrderView
} from "../services/publicGenerationOrderService.js";

import {
  instructionsRepository
} from "../services/instructionsRepository.js";

import {
  createInstructionPdfBuffer
} from "../services/instructionPdfService.js";


export const publicGenerationCheckoutRouter =
  Router();


const OFFER_URL =
  "https://boykovdocs.ru/offer/";

const PERSONAL_DATA_URL =
  "https://boykovdocs.ru/personal-data-consent/";


/*
 * ============================================================
 * PAYMENT CONSENTS
 * ============================================================
 *
 * Этот route является middleware перед существующим
 * POST /api/public-generation/orders.
 *
 * Сам существующий order route не меняем.
 */
publicGenerationCheckoutRouter.post(
  "/orders",

  (
    req,
    res,
    next
  ) => {

    const offerAccepted =
      req.body?.offerAccepted ===
      true;

    const personalDataConsentAccepted =
      req.body
        ?.personalDataConsentAccepted ===
      true;


    /*
     * Без двух обязательных согласий
     * платёжный заказ вообще не создаётся.
     */
    if (
      !offerAccepted ||
      !personalDataConsentAccepted
    ) {

      return res
        .status(422)
        .json({
          code:
            "PAYMENT_CONSENTS_REQUIRED",

          error:
            "Для оплаты необходимо принять публичную оферту и дать согласие на обработку персональных данных."
        });

    }


    /*
     * Сохраняем факт согласия непосредственно
     * в созданный заказ.
     *
     * Существующий route после создания заказа
     * вызывает res.json(). Здесь перехватываем
     * только успешный ответ 201.
     */
    const originalJson =
      res.json.bind(
        res
      );


    res.json =
      function(
        payload
      ) {

        if (
          res.statusCode ===
            201 &&
          payload?.orderId
        ) {

          const acceptedAt =
            new Date()
              .toISOString();


          const updated =
            updatePublicGenerationOrder(
              payload.orderId,
              {
                checkoutConsent: {

                  offerAccepted:
                    true,

                  personalDataConsentAccepted:
                    true,

                  acceptedAt,

                  offerUrl:
                    OFFER_URL,

                  personalDataConsentUrl:
                    PERSONAL_DATA_URL,

                  ip:
                    String(
                      req.ip ??
                      ""
                    )
                    .slice(
                      0,
                      120
                    ),

                  forwardedFor:
                    String(
                      req.get(
                        "x-forwarded-for"
                      ) ??
                      ""
                    )
                    .slice(
                      0,
                      500
                    ),

                  userAgent:
                    String(
                      req.get(
                        "user-agent"
                      ) ??
                      ""
                    )
                    .slice(
                      0,
                      1000
                    )
                }
              }
            );


          /*
           * Если факт согласия записать не удалось,
           * не отдаём клиенту данные для CloudPayments.
           */
          if (!updated) {

            res.status(
              500
            );


            return originalJson({
              error:
                "Не удалось зафиксировать согласия перед оплатой."
            });

          }

        }


        return originalJson(
          payload
        );

      };


    return next();

  }
);


/*
 * ============================================================
 * PRIVATE PAID PDF
 * ============================================================
 *
 * Покупателю не требуется отдельная регистрация.
 *
 * Доступ подтверждается:
 * orderId + секретный x-order-token.
 */
publicGenerationCheckoutRouter.get(
  "/orders/:id/pdf",

  async (
    req,
    res
  ) => {

    const accessToken =
      String(
        req.get(
          "x-order-token"
        ) ??
        ""
      );


    const order =
      getPublicGenerationOrderView(
        req.params.id,
        accessToken
      );


    /*
     * Специально отвечаем одинаковым 404
     * и при неправильном token.
     */
    if (!order) {

      return res
        .status(404)
        .json({
          error:
            "Заказ не найден"
        });

    }


    let instruction =
      order.instruction ??
      null;


    /*
     * Если документ уже опубликован,
     * но приватная копия отсутствует,
     * берём опубликованную версию.
     */
    if (
      !instruction &&
      order.instructionId
    ) {

      instruction =
        instructionsRepository
          .getById(
            order.instructionId
          );

    }


    if (!instruction) {

      return res
        .status(409)
        .json({
          error:
            "Инструкция ещё формируется"
        });

    }


    try {

      const pdf =
        await createInstructionPdfBuffer(
          instruction
        );


      const safeOrderId =
        String(
          order.id ??
          "order"
        )
        .replace(
          /[^a-zA-Z0-9_-]+/g,
          "-"
        )
        .slice(
          0,
          100
        );


      res.set(
        "Content-Type",
        "application/pdf"
      );


      res.set(
        "Content-Disposition",
        `attachment; filename="instruction-${safeOrderId}.pdf"`
      );


      res.set(
        "Cache-Control",
        "private, no-store"
      );


      return res
        .status(200)
        .send(
          pdf
        );

    }
    catch (error) {

      console.error(
        "[Paid instruction PDF]",
        order.id,
        error
      );


      return res
        .status(500)
        .json({
          error:
            "Не удалось сформировать PDF"
        });

    }

  }
);
