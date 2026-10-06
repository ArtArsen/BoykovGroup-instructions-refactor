import {
  useLayoutEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import Header from "../Header/Header.jsx";
import Navigation from "../Navigation/Navigation.jsx";
import HeroPortrait from "../HeroPortrait/HeroPortrait.jsx";

import SEO
  from "../SEO/SEO.jsx";

import useUrgentGenerationPromo
  from "./hooks/useUrgentGenerationPromo.js";

import useUrgentGenerationPayment
  from "./hooks/useUrgentGenerationPayment.js";
import {
  formatAmount
} from "./urgentGenerationUtils.js";

import styles
  from "./UrgentGenerationPage.module.css";


export default function UrgentGenerationPage() {

  const [
    profession,
    setProfession
  ] = useState("");

  const [
    headerQuery,
    setHeaderQuery
  ] = useState("");

  const {
    promoInput,
    appliedPromo,
    promoMessage,
    promoMessageType,
    isPromoChecking,

    handlePromoApply,
    handlePromoInputChange,

    displayOriginalAmount,
    displayAmount,
    hasPromoDiscount
  } =
    useUrgentGenerationPromo();


  const {
    isPaying,
    error,
    setError,

    isPaymentComplete,
    paymentMessage,

    offerAccepted,
    setOfferAccepted,

    personalDataAccepted,
    setPersonalDataAccepted,

    consentError,
    setConsentError,

    handleSubmit
  } =
    useUrgentGenerationPayment({
      profession,
      appliedPromo
    });


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


    /*
     * LEGACY ORDER STORAGE CLEANUP
     *
     * Старое восстановление заказа больше
     * не используется. Удаляем оставшиеся
     * ключи у пользователей после обновления.
     */
    try {

      window.sessionStorage.removeItem(
        "boykovgroup_urgent_generation_order_v1"
      );

      window.sessionStorage.removeItem(
        "boykovdocs_thanks_order_v1"
      );

    }
    catch {
      /* storage может быть недоступен */
    }

  }, []);




  return (
    <div
      className={
        styles.page
      }
    >

      <SEO
        title="Срочная инструкция по охране труда за 500 ₽ | БОЙКОВГРУПП"
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
              [ профессия или вид работ ]
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
              Укажите профессию, должность
              или вид работ — подготовим
              проект инструкции с опорой
              на требования законодательства
              Российской Федерации и принятую
              структуру документов по охране труда.
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
              {
                hasPromoDiscount
                  ? (
                      <>
                        <span
                          className={
                            styles.promoPriceOld
                          }
                        >
                          {formatAmount(
                            displayOriginalAmount
                          )} ₽
                        </span>

                        {" "}

                        <span
                          className={
                            styles.promoPriceNew
                          }
                        >
                          {formatAmount(
                            displayAmount
                          )} ₽
                        </span>
                      </>
                    )
                  : `${formatAmount(
                      displayAmount
                    )} ₽`
              }
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

            <div>

              <h2
                className={
                  styles.orderTitle
                }
              >
                Укажите профессию или вид работ
              </h2>


              <p
                className={
                  styles.orderText
                }
              >
                Напишите точное название
                профессии, должности
                или вида работ, для которых
                необходима инструкция.
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
              Профессия или вид работ
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
              placeholder="Например: электромонтёр или при работе на высоте"
              autoComplete="off"
              maxLength={180}
            />


            <div
              className={
                styles.generationScopeHint
              }
            >
              <span>
                Можно указать:
              </span>{" "}

              <strong>
                профессию
              </strong>{" "}

              <span>
                или
              </span>{" "}

              <strong>
                конкретный вид работ
              </strong>

              <span
                className={
                  styles.generationScopeExamples
                }
              >
                Например: водитель погрузчика · при работе на высоте · при эксплуатации электрооборудования
              </span>
            </div>


            <div
              className={
                styles.promoCheckout
              }
            >

              <label
                className={
                  styles.promoLabel
                }
                htmlFor="urgent-promo-code"
              >
                Промокод
              </label>


              <div
                className={
                  styles.promoRow
                }
              >

                <input
                  id="urgent-promo-code"
                  className={
                    styles.promoInput
                  }
                  type="text"
                  value={
                    promoInput
                  }
                  placeholder="Введите промокод"
                  autoComplete="off"
                  maxLength={40}
                  spellCheck={false}
                  onChange={
                    (event) =>
                      handlePromoInputChange(
                        event.target.value
                      )
                  }
                  onKeyDown={
                    (event) => {

                      if (
                        event.key ===
                          "Enter"
                      ) {

                        event.preventDefault();

                        void handlePromoApply();

                      }

                    }
                  }
                />


                <button
                  type="button"
                  className={
                    styles.promoButton
                  }
                  disabled={
                    isPromoChecking
                  }
                  onClick={
                    () => {
                      void handlePromoApply();
                    }
                  }
                >
                  {
                    isPromoChecking
                      ? "Проверяем..."
                      : "Применить"
                  }
                </button>

              </div>


              <div
                className={[
                  styles.promoMessage,

                  promoMessageType ===
                    "success"
                    ? styles.promoMessageSuccess
                    : "",

                  promoMessageType ===
                    "error"
                    ? styles.promoMessageError
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-live="polite"
              >
                {promoMessage}
              </div>

            </div>


            <div
              className={
                styles.summary
              }
            >

              <span>
                Срочная инструкция
              </span>

              <strong>
                {
                  hasPromoDiscount
                    ? (
                        <span
                          className={
                            styles.promoPrice
                          }
                        >
                          <span
                            className={
                              styles.promoPriceOld
                            }
                          >
                            {formatAmount(
                              displayOriginalAmount
                            )} ₽
                          </span>

                          <span
                            className={
                              styles.promoPriceNew
                            }
                          >
                            {formatAmount(
                              displayAmount
                            )} ₽
                          </span>
                        </span>
                      )
                    : `${formatAmount(
                        displayAmount
                      )} ₽`
                }
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


            <div
              className={
                styles.paymentConsents
              }
            >

              <div
                className={
                  styles.paymentConsentsHeading
                }
              >
                Перед оплатой
              </div>


              <div
                className={
                  styles.paymentConsentRows
                }
              >

                <label
                  className={
                    styles.paymentConsentRow
                  }
                >

                  <input
                    type="checkbox"
                    className={
                      styles.paymentConsentCheckbox
                    }
                    checked={
                      personalDataAccepted
                    }
                    onChange={
                      (event) => {

                        setPersonalDataAccepted(
                          event.target.checked
                        );

                        setConsentError("");

                      }
                    }
                  />

                  <span
                    className={
                      styles.paymentConsentBox
                    }
                  />

                  <span
                    className={
                      styles.paymentConsentText
                    }
                  >
                    Я даю{" "}
                    <a
                      href="/personal-data-consent/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      согласие на обработку персональных данных
                    </a>
                    .
                  </span>

                </label>


                <label
                  className={
                    styles.paymentConsentRow
                  }
                >

                  <input
                    type="checkbox"
                    className={
                      styles.paymentConsentCheckbox
                    }
                    checked={
                      offerAccepted
                    }
                    onChange={
                      (event) => {

                        setOfferAccepted(
                          event.target.checked
                        );

                        setConsentError("");

                      }
                    }
                  />

                  <span
                    className={
                      styles.paymentConsentBox
                    }
                  />

                  <span
                    className={
                      styles.paymentConsentText
                    }
                  >
                    Я ознакомился и принимаю условия{" "}
                    <a
                      href="/offer/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Публичной оферты
                    </a>
                    .
                  </span>

                </label>

              </div>


              <p
                className={
                  styles.paymentConsentNote
                }
              >
                Оба согласия обязательны для перехода к оплате.
              </p>


              {
                consentError &&
                (
                  <p
                    className={
                      styles.paymentConsentError
                    }
                  >
                    {consentError}
                  </p>
                )
              }

            </div>


            <button
              type="submit"
              className={
                styles.submit
              }
              disabled={
                isPaying ||
                isPaymentComplete ||
                !offerAccepted ||
                !personalDataAccepted
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
                {formatAmount(
                  displayAmount
                )} российских рублей
              </strong>
            </p>

          </form>

        </section>

      

      </main>

    </div>
  );
}
