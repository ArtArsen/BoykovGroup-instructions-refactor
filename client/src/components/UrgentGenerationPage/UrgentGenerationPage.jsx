import PrivateInstructionView from "../PrivateInstructionView/PrivateInstructionView.jsx";
import {
  useLayoutEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import Header from "../Header/Header.jsx";
import Navigation from "../Navigation/Navigation.jsx";
import HeroPortrait from "../HeroPortrait/HeroPortrait.jsx";

import SEO
  from "../SEO/SEO.jsx";

import {
  loadCloudPayments
} from "../../lib/cloudPayments.js";

import styles
  from "./UrgentGenerationPage.module.css";


export default function UrgentGenerationPage() {

  const navigate =
    useNavigate();

  const [
    profession,
    setProfession
  ] = useState("");

  const [
    headerQuery,
    setHeaderQuery
  ] = useState("");

  const [
    isPaying,
    setIsPaying
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    isPaymentComplete,
    setIsPaymentComplete
  ] = useState(false);

  const [
    paymentMessage,
    setPaymentMessage
  ] = useState("");


  /*
   * ==========================================================
   * URGENT PAGE SCROLL RESET
   * ==========================================================
   *
   * React Router сохраняет scroll позиции
   * предыдущего route. Для коммерческой страницы
   * всегда начинаем с первого экрана.
   */
  useLayoutEffect(() => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    });


    /*
     * Дополнительно сбрасываем scroll у document,
     * чтобы поведение было одинаковым
     * во всех браузерах.
     */
    document.documentElement.scrollTop =
      0;

    document.body.scrollTop =
      0;

  }, []);


  /*


   * PRIVATE_PAID_RESULT_UI_V3


   *


   * Готовый оплаченный документ отображается


   * сразу и не зависит от публикации в каталоге.


   */


  const [


    generatedInstruction,


    setGeneratedInstruction


  ] =


    useState(null);




  function showGeneratedInstruction(


    instruction


  ) {



    if (!instruction) {


      return false;


    }




    setGeneratedInstruction(


      instruction


    );



    setPaymentMessage(


      "Инструкция готова."


    );




    window.setTimeout(


      () => {



        document


          .getElementById(


            "urgent-generated-instruction"


          )


          ?.scrollIntoView({


            behavior:


              "smooth",



            block:


              "start"


          });



      },


      50


    );




    return true;


  }




  /*




   * URGENT_ORDER_SESSION_RESTORE_V1




   *




   * orderToken не помещаем в URL и не сохраняем




   * постоянно. sessionStorage переживает F5,




   * но очищается при закрытии вкладки.




   */




  const urgentOrderSessionKey =




    "boykovgroup_urgent_generation_order_v1";






  function readUrgentOrderSession() {





    try {





      const raw =




        window.sessionStorage




          .getItem(




            urgentOrderSessionKey




          );






      if (!raw) {




        return null;




      }






      const parsed =




        JSON.parse(raw);






      if (




        !parsed?.orderId ||




        !parsed?.orderToken




      ) {





        return null;





      }






      return parsed;





    }




    catch {





      return null;





    }





  }






  function saveUrgentOrderSession(




    orderId,




    orderToken,




    transactionId = null




  ) {





    if (




      !orderId ||




      !orderToken




    ) {




      return;




    }






    try {





      const previous =




        readUrgentOrderSession();






      window.sessionStorage




        .setItem(




          urgentOrderSessionKey,




          JSON.stringify({




            orderId:




              String(orderId),





            orderToken:




              String(orderToken),





            transactionId:




              transactionId




                ? String(




                    transactionId




                  )




                : previous?.orderId ===




                    String(orderId)




                  ? previous




                      ?.transactionId ??




                    null




                  : null




          })




        );





    }




    catch {





      /*




       * Недоступный sessionStorage не должен




       * мешать основной покупке.




       */





    }





  }






  function clearUrgentOrderSession() {





    try {





      window.sessionStorage




        .removeItem(




          urgentOrderSessionKey




        );





    }




    catch {





      /*




       * Ничего не делаем.




       */





    }





  }






  useLayoutEffect(




    () => {





      const savedOrder =




        readUrgentOrderSession();






      if (!savedOrder) {




        return undefined;




      }






      let cancelled =




        false;






      const sleep =




        milliseconds =>




          new Promise(




            resolve =>




              window.setTimeout(




                resolve,




                milliseconds




              )




          );






      async function restoreOrder() {





        setPaymentMessage(




          "Восстанавливаем состояние оплаченного заказа..."




        );






        for (




          let attempt = 0;




          attempt < 180;




          attempt += 1




        ) {





          if (cancelled) {




            return;




          }






          let response;






          try {





            response =




              await fetch(




                `/api/public-generation/orders/${encodeURIComponent(




                  savedOrder.orderId




                )}`,




                {




                  headers: {




                    "x-order-token":




                      savedOrder.orderToken




                  },





                  cache:




                    "no-store"




                }




              );





          }




          catch {





            await sleep(




              2000




            );





            continue;





          }






          if (




            response.status ===




              401 ||




            response.status ===




              404




          ) {





            clearUrgentOrderSession();





            return;





          }






          if (!response.ok) {





            await sleep(




              2000




            );





            continue;





          }






          let order =




            await response




              .json()




              .catch(




                () => ({})




              );






          /*




           * Если страница обновилась после успешного




           * виджета оплаты, но до confirm-payment,




           * повторяем серверное подтверждение.




           */




          if (




            order?.status ===




              "pending_payment" &&




            savedOrder




              .transactionId




          ) {





            try {





              const confirmResponse =




                await fetch(




                  `/api/public-generation/orders/${encodeURIComponent(




                    savedOrder.orderId




                  )}/confirm-payment`,




                  {




                    method:




                      "POST",





                    headers: {




                      "Content-Type":




                        "application/json",





                      "x-order-token":




                        savedOrder.orderToken




                    },





                    body:




                      JSON.stringify({




                        transactionId:




                          savedOrder




                            .transactionId




                      })




                  }




                );






              if (




                confirmResponse.ok




              ) {





                order =




                  await confirmResponse




                    .json()




                    .catch(




                      () => order




                    );





              }





            }




            catch {





              /*




               * Следующий polling повторит попытку.




               */





            }





          }






          if (cancelled) {




            return;




          }






          switch (




            order?.status




          ) {





            case "generated":





              setIsPaymentComplete(




                true




              );






              if (




                showGeneratedInstruction(




                  order?.instruction




                )




              ) {




                return;




              }






              setPaymentMessage(




                "Инструкция готова. Получаем документ..."




              );





              break;






            case "published":





              if (




                order?.instructionId




              ) {





                clearUrgentOrderSession();





                navigate(




                  `/instrukciya-po-ohrane-truda/${encodeURIComponent(




                    order.instructionId




                  )}`




                );





                return;





              }





              break;






            case "paid":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Платёж подтверждён. Запускаем подготовку инструкции..."




              );





              break;






            case "generating":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Платёж подтверждён. Инструкция формируется..."




              );





              break;






            case "moderating":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Платёж подтверждён. Заказ обрабатывается..."




              );





              break;






            case "refunding":





            case "refund_pending":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Возврат оплаты оформляется..."




              );





              break;






            case "refunded":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Возврат оплаты оформлен. Срок зачисления зависит от банка."




              );





              clearUrgentOrderSession();





              return;






            case "manual_review":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Заказ принят и требует ручной обработки."




              );





              return;






            case "test_paid":





              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Тестовый платёж подтверждён."




              );





              return;






            case "pending_payment":





              if (




                !savedOrder




                  .transactionId




              ) {





                clearUrgentOrderSession();





                setPaymentMessage("");





                return;





              }






              setIsPaymentComplete(




                true




              );





              setPaymentMessage(




                "Платёж выполнен. Восстанавливаем заказ..."




              );





              break;






            default:





              break;





          }






          await sleep(




            2000




          );





        }






        if (!cancelled) {





          setPaymentMessage(




            "Заказ сохранён. Подготовка инструкции занимает больше обычного."




          );





        }





      }






      restoreOrder();






      return () => {





        cancelled =




          true;





      };





    },




    []




  );






  async function handleSubmit(event) {

    event.preventDefault();

    setError("");
    setPaymentMessage("");
    setGeneratedInstruction(null);
    clearUrgentOrderSession();


    const normalizedProfession =
      profession.trim();


    if (
      normalizedProfession.length < 2
    ) {

      setError(
        "Укажите профессию, для которой нужна инструкция."
      );

      return;
    }


    setIsPaying(
      true
    );


    try {

      /*
       * Сначала создаём заказ на сервере.
       *
       * Только сервер определяет:
       * - профессию после модерации;
       * - сумму;
       * - валюту;
       * - orderId;
       * - Public ID терминала.
       */
      const orderResponse =
        await fetch(
          "/api/public-generation/orders",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                profession:
                  normalizedProfession
              })
          }
        );


      const order =
        await orderResponse
          .json()
          .catch(
            () => ({})
          );


      /*
       * Инструкция уже существует —
       * оплачивать её повторно не нужно.
       */
      if (
        orderResponse.status === 409 &&
        order?.existingInstructionId
      ) {

        clearUrgentOrderSession();


        navigate(
          `/instrukciya-po-ohrane-truda/${encodeURIComponent(
            order.existingInstructionId
          )}`
        );

        return;
      }


      if (
        !orderResponse.ok
      ) {

        throw new Error(
          order?.error ||
          order?.message ||
          "Не удалось создать заказ."
        );
      }


      const {
        orderId,
        orderToken,
        externalId,
        publicTerminalId,
        amount,
        currency
      } = order;


        saveUrgentOrderSession(
          orderId,
          orderToken
        );


      if (
        !orderId ||
        !orderToken ||
        !publicTerminalId ||
        !Number.isFinite(
          Number(amount)
        ) ||
        Number(amount) <= 0 ||
        !currency
      ) {

        throw new Error(
          "Сервер вернул неполные данные платежа."
        );
      }


      /*
       * Загружаем официальный widget
       * только после создания заказа.
       */
      const cp =
        await loadCloudPayments();


      const widget =
        new cp.CloudPayments();


      const widgetResult =
        await widget.start({

        publicTerminalId,

        description:
          `Срочная инструкция по охране труда: ${normalizedProfession}`,

        paymentSchema:
          "Single",

        amount:
          Number(amount),

        currency,

        culture:
          "ru-RU",

        skin:
          "classic",

        /*
         * Серверный orderId возвращается
         * в CloudPayments и сохраняется как InvoiceId.
         */
        externalId:
          externalId ||
          orderId
      });


        /*
         * Успешный ответ widget сам по себе
         * НЕ является доказательством оплаты.
         *
         * Из браузера берём только transactionId.
         * Backend самостоятельно проверяет
         * транзакцию через CloudPayments API.
         */
        if (
          widgetResult?.status !==
            "success" ||
          !widgetResult?.data
            ?.transactionId
        ) {

          throw new Error(
            widgetResult?.message ||
            "Оплата не завершена."
          );
        }


        const transactionId =
          String(
            widgetResult
              .data
              .transactionId
          );

          saveUrgentOrderSession(
            orderId,
            orderToken,
            transactionId
          );


        setIsPaymentComplete(
          true
        );

        setPaymentMessage(
          "Платёж выполнен. Проверяем транзакцию в CloudPayments..."
        );


        let paymentConfirmed =
          false;

        let confirmationData =
          null;


        /*
         * После закрытия формы транзакция может
         * появиться в API CloudPayments
         * с небольшой задержкой.
         */
        for (
          let attempt = 0;
          attempt < 8;
          attempt += 1
        ) {

          let confirmResponse;


          try {

            confirmResponse =
              await fetch(
                `/api/public-generation/orders/${encodeURIComponent(
                  orderId
                )}/confirm-payment`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",

                    "x-order-token":
                      orderToken
                  },

                  body:
                    JSON.stringify({
                      transactionId
                    })
                }
              );

          }
          catch {

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  2000
                )
            );

            continue;
          }


          const confirmData =
            await confirmResponse
              .json()
              .catch(
                () => ({})
              );


          if (
            confirmResponse.ok
          ) {

            paymentConfirmed =
              true;

            confirmationData =
              confirmData;

            break;
          }


          const canRetry =
            confirmResponse.status ===
              502 ||
            confirmResponse.status ===
              429 ||
            (
              confirmResponse.status ===
                409 &&
              String(
                confirmData?.error ??
                ""
              )
              .includes(
                "пока не подтвердил"
              )
            );


          if (!canRetry) {

            console.error(
              "[UrgentGeneration] payment confirmation rejected:",
              confirmResponse.status,
              confirmData
            );

            break;
          }


          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                2000
              )
          );
        }


        /*
         * Платёж уже мог пройти.
         * При проблеме проверки не предлагаем
         * пользователю платить ещё раз.
         */
        if (
          !paymentConfirmed
        ) {

          setPaymentMessage(
            "Платёж выполнен, но автоматическое подтверждение пока не получено. Повторно оплачивать не нужно."
          );

          return;
        }


        if (
          confirmationData?.status ===
            "test_paid"
        ) {

          setPaymentMessage(
            "Тестовый платёж подтверждён. Публикация в тестовом режиме отключена."
          );

          return;
        }


        if (
            confirmationData?.status ===
              "generated"
          ) {

            if (
              showGeneratedInstruction(
                confirmationData
                  ?.instruction
              )
            ) {
              return;
            }


            setPaymentMessage(
              "Инструкция готова. Получаем документ..."
            );

          }


          if (
          confirmationData?.status ===
            "manual_review"
        ) {

          setPaymentMessage(
            "Платёж подтверждён. Заказ передан на ручную проверку. Повторно оплачивать не нужно."
          );

          return;
        }


        if (
          confirmationData?.status ===
            "published" &&
          confirmationData
            ?.instructionId
        ) {

          clearUrgentOrderSession();


          navigate(
            `/instrukciya-po-ohrane-truda/${encodeURIComponent(
              confirmationData
                .instructionId
            )}`
          );

          return;
        }


        /*
         * PUBLIC_REFUND_STATUS_UI_V3
         */
        switch (
          confirmationData?.status
        ) {

          case "moderating":

            setPaymentMessage(
              "Платёж подтверждён. Проверяем допустимость запроса..."
            );

            break;


          case "refunding":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Оформляем возврат оплаты..."
            );

            break;


          case "refund_pending":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Возврат оплаты оформляется..."
            );

            break;


          case "refunded":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Возврат оплаты оформлен. Срок зачисления зависит от банка."
            );

            return;


          default:

            setPaymentMessage(
              "Платёж подтверждён. Подготавливаем инструкцию..."
            );

            break;
        }


      const maxAttempts =
        180;

      const delayMs =
        2000;


      for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt += 1
      ) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              delayMs
            )
        );


        let statusResponse;


        try {

          statusResponse =
            await fetch(
              `/api/public-generation/orders/${encodeURIComponent(
                orderId
              )}`,
              {
                headers: {
                  "x-order-token":
                    orderToken
                },

                cache:
                  "no-store"
              }
            );

        }
        catch {

          continue;
        }


        if (
          !statusResponse.ok
        ) {

          continue;
        }


        const statusData =
          await statusResponse
            .json()
            .catch(
              () => ({})
            );


        switch (
          statusData?.status
        ) {

          case "pending_payment":

            setPaymentMessage(
              "Ожидаем серверное подтверждение платежа..."
            );

            break;


          case "paid":

            setPaymentMessage(
              "Платёж подтверждён. Запускаем подготовку инструкции..."
            );

            break;


          case "moderating":

            setPaymentMessage(
              "Платёж подтверждён. Проверяем допустимость запроса..."
            );

            break;


          case "generating":

            setPaymentMessage(
              "Платёж подтверждён. Инструкция формируется..."
            );

            break;


          case "refunding":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Оформляем возврат оплаты..."
            );

            break;


          case "refund_pending":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Возврат оплаты оформляется..."
            );

            break;


          case "refunded":

            setPaymentMessage(
              "Запрос не прошёл дополнительную проверку. Возврат оплаты оформлен. Срок зачисления зависит от банка."
            );

            return;


          case "generated":

              if (
                showGeneratedInstruction(
                  statusData
                    ?.instruction
                )
              ) {
                return;
              }


              setPaymentMessage(
                "Инструкция готова. Получаем документ..."
              );

              break;


            case "published":

            if (
              statusData?.instructionId
            ) {

              clearUrgentOrderSession();


              navigate(
                `/instrukciya-po-ohrane-truda/${encodeURIComponent(
                  statusData.instructionId
                )}`
              );

              return;
            }

            break;


          case "test_paid":

            setPaymentMessage(
              "Тестовый платёж принят. Публикация в тестовом режиме отключена."
            );

            return;


          case "manual_review":

            setPaymentMessage(
              "Платёж подтверждён. Заказ передан на ручную проверку. Повторно оплачивать не нужно."
            );

            return;


          default:
            break;
        }
      }


      setPaymentMessage(
        "Платёж принят. Подготовка инструкции занимает больше обычного. Повторно оплачивать не нужно."
      );

    }
    catch (paymentError) {

      setError(
        paymentError?.message ||
        "Оплата не завершена."
      );

    }
    finally {

      setIsPaying(
        false
      );

    }

  }


  return (
    <div
      className={
        styles.page
      }
    >

      <SEO
        title="Срочная инструкция по охране труда за 50 ₽ | БОЙКОВГРУПП"
        description="Срочная подготовка проекта инструкции по охране труда для нужной профессии с опорой на требования законодательства РФ."
      />


      <div
        className={
          styles.siteHeader
        }
      >

        <Header
          query={headerQuery}
          onQueryChange={setHeaderQuery}
        />

        <Navigation />

      </div>


      <main
        className={
          styles.content
        }
      >

        <Link
          to="/"
          className={
            styles.back
          }
        >
          ← Все инструкции
        </Link>


        <section
          className={
            styles.hero
          }
        >

          <div
            className={
              styles.heroCopy
            }
          >

            <div
              className={
                styles.eyebrow
              }
            >
              [ срочная подготовка ]
            </div>


            <h1
              className={
                styles.title
              }
            >
              Срочная инструкция
              по охране труда
            </h1>


            <p
              className={
                styles.lead
              }
            >
              Укажите профессию —
              подготовим проект инструкции
              с опорой на требования
              законодательства Российской
              Федерации и принятую структуру
              документов по охране труда.
            </p>


            <div
              className={
                styles.notice
              }
            >
              Перед утверждением инструкции
              работодателем документ необходимо
              проверить с учётом конкретных
              условий труда, оборудования
              и локальных требований организации.
            </div>

          </div>


          <div
            className={
              styles.heroProfile
            }
          >

            <HeroPortrait
              compact
            />

          </div>


          <div
            className={
              styles.priceCard
            }
          >

            <div
              className={
                styles.priceLabel
              }
            >
              Стоимость
            </div>


            <div
              className={
                styles.price
              }
            >
              50 ₽
            </div>


            <div
              className={
                styles.priceDescription
              }
            >
              за подготовку
              одной инструкции
            </div>

          </div>

        </section>


        <section
          className={
            styles.orderSection
          }
        >

          <div
            className={
              styles.orderIntro
            }
          >

            <div
              className={
                styles.orderNumber
              }
            >
              01
            </div>


            <div>

              <h2
                className={
                  styles.orderTitle
                }
              >
                Укажите профессию
              </h2>


              <p
                className={
                  styles.orderText
                }
              >
                Напишите точное название
                профессии или вида работ,
                для которых необходима
                инструкция.
              </p>

            </div>

          </div>


          <form
            className={
              styles.form
            }
            onSubmit={
              handleSubmit
            }
          >

            <label
              className={
                styles.label
              }
              htmlFor="urgent-profession"
            >
              Профессия
            </label>


            <input
              id="urgent-profession"
              className={
                styles.input
              }
              type="text"
              value={
                profession
              }
              onChange={
                (event) => {
                  setProfession(
                    event.target.value
                  );

                  setError("");
                }
              }
              placeholder="Например: электромонтёр по ремонту оборудования"
              autoComplete="off"
              maxLength={180}
            />


            <div
              className={
                styles.summary
              }
            >

              <span>
                Срочная инструкция
              </span>

              <strong>
                50 ₽
              </strong>

            </div>


            {error && (
              <div
                className={
                  styles.error
                }
              >
                {error}
              </div>
            )}


            {isPaymentComplete && (
              <div
                className={
                  styles.success
                }
              >
                {
                    paymentMessage ||
                    "Проверяем состояние заказа..."
                  }
              </div>
            )}


            <button
              type="submit"
              className={
                styles.submit
              }
              disabled={
                isPaying ||
                isPaymentComplete
              }
            >
              {
                isPaying
                  ? "Открываем оплату..."
                  : isPaymentComplete
                    ? "Оплачено"
                    : "Заказать инструкцию"
              }
            </button>


            <p
              className={
                styles.paymentNote
              }
            >
              Сумма оплаты:
              {" "}
              <strong>
                50 российских рублей
              </strong>
            </p>

          </form>

        </section>

      
          {
            generatedInstruction &&
            (
              <section
                id="urgent-generated-instruction"
                className={
                  styles.generatedResult
                }
              >

                <div
                  className={
                    styles.generatedResultHeader
                  }
                >

                  <div
                    className={
                      styles.generatedResultEyebrow
                    }
                  >
                    [ оплачено · готово ]
                  </div>


                  <h2
                    className={
                      styles.generatedResultTitle
                    }
                  >
                    Ваша инструкция готова
                  </h2>


                  <p
                    className={
                      styles.generatedResultText
                    }
                  >
                    Документ доступен вам сразу.
                    Решение о публикации в общем
                    каталоге принимается
                    администратором отдельно.
                  </p>

                </div>


                <PrivateInstructionView
                  instruction={
                    generatedInstruction
                  }
                />

              </section>
            )
          }


</main>

    </div>
  );
}
