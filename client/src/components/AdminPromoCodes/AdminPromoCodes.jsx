import {
  useEffect,
  useState
} from "react";

import {
  createPromoCode,
  getPromoCodes
} from "../../api/promoCodesApi.js";

import PromoCodeCard
  from "./PromoCodeCard.jsx";

import {
  fromLocalInput
} from "./promoCodeAdminUtils.js";

import "./AdminPromoCodes.css";


export default function AdminPromoCodes({
  token,
  hidden = false
}) {

  const [
    items,
    setItems
  ] =
    useState([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    createForm,
    setCreateForm
  ] =
    useState({
      code:
        "",

      type:
        "fixed_price",

      value:
        "10",

      maxUses:
        "",

      expiresAt:
        "",

      active:
        true
    });

  const [
    creating,
    setCreating
  ] =
    useState(false);

  const [
    message,
    setMessage
  ] =
    useState({
      text:
        "",

      type:
        ""
    });


  function showMessage(
    text,
    type
  ) {

    setMessage({
      text:
        text || "",

      type:
        type || ""
    });

  }


  async function loadItems() {

    if (!token) {

      setItems(
        []
      );

      setLoading(
        false
      );

      return;

    }


    try {

      const data =
        await getPromoCodes(
          token
        );


      setItems(
        Array.isArray(
          data?.items
        )
          ? data.items
          : []
      );

    }
    catch(error) {

      showMessage(
        error?.message ||
        "Не удалось загрузить промокоды.",
        "error"
      );

    }
    finally {

      setLoading(
        false
      );

    }

  }


  useEffect(() => {

    void loadItems();

  }, [
    token
  ]);


  function changeCreate(
    name,
    value
  ) {

    setCreateForm(
      current => ({
        ...current,
        [name]:
          value
      })
    );

  }


  async function handleCreate(
    event
  ) {

    event.preventDefault();


    const maxUsesText =
      String(
        createForm.maxUses
      )
        .trim();


    const payload = {
      code:
        createForm.code
          .trim()
          .toUpperCase(),

      type:
        createForm.type,

      value:
        Number(
          createForm.value
        ),

      maxUses:
        maxUsesText
          ? Number(
              maxUsesText
            )
          : null,

      expiresAt:
        fromLocalInput(
          createForm.expiresAt
        ),

      active:
        createForm.active
    };


    setCreating(
      true
    );

    showMessage(
      "",
      ""
    );


    try {

      await createPromoCode(
        payload,
        token
      );


      setCreateForm({
        code:
          "",

        type:
          "fixed_price",

        value:
          "10",

        maxUses:
          "",

        expiresAt:
          "",

        active:
          true
      });


      showMessage(
        "Промокод создан.",
        "success"
      );


      await loadItems();

    }
    catch(error) {

      showMessage(
        error?.message ||
        "Не удалось создать промокод.",
        "error"
      );

    }
    finally {

      setCreating(
        false
      );

    }

  }


  return (
    <section
      id="boykovPromoAdmin"
      data-boykov-admin-tab-section="promocodes"
      className={[
        "boykovPromoAdmin",

        hidden
          ? "boykovAdminDashboardSection--hidden"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <div
        className="boykovPromoAdmin__header"
      >

        <div>

          <div
            className="boykovPromoAdmin__eyebrow"
          >
            Оплата
          </div>

          <h2
            className="boykovPromoAdmin__title"
          >
            Промокоды
          </h2>

          <p
            className="boykovPromoAdmin__description"
          >
            Создание и управление скидками для срочной генерации инструкций.
            Использование засчитывается только после подтверждённой оплаты.
          </p>

        </div>


        <div
          className="boykovPromoAdmin__count"
        >
          {items.length}
        </div>

      </div>


      <div
        className={[
          "boykovPromoAdmin__message",

          message.text
            ? "boykovPromoAdmin__message--visible"
            : "",

          message.type
            ? `boykovPromoAdmin__message--${message.type}`
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        aria-live="polite"
      >
        {message.text}
      </div>


      <form
        className="boykovPromoAdmin__create"
        onSubmit={
          handleCreate
        }
      >

        <h3
          className="boykovPromoAdmin__createTitle"
        >
          Новый промокод
        </h3>


        <div
          className="boykovPromoAdmin__grid"
        >

          <label
            className="boykovPromoAdmin__field"
          >
            <span
              className="boykovPromoAdmin__label"
            >
              Код
            </span>

            <input
              className="boykovPromoAdmin__input"
              maxLength="40"
              placeholder="Например: TEST10"
              required
              value={
                createForm.code
              }
              onChange={
                event =>
                  changeCreate(
                    "code",
                    event.target.value
                  )
              }
            />
          </label>


          <label
            className="boykovPromoAdmin__field"
          >
            <span
              className="boykovPromoAdmin__label"
            >
              Тип
            </span>

            <select
              className="boykovPromoAdmin__select"
              value={
                createForm.type
              }
              onChange={
                event =>
                  changeCreate(
                    "type",
                    event.target.value
                  )
              }
            >
              <option value="fixed_price">
                Итоговая цена
              </option>

              <option value="percent">
                Скидка в процентах
              </option>
            </select>
          </label>


          <label
            className="boykovPromoAdmin__field"
          >
            <span
              className="boykovPromoAdmin__label"
            >
              {
                createForm.type ===
                  "percent"
                  ? "Скидка, %"
                  : "Цена, ₽"
              }
            </span>

            <input
              className="boykovPromoAdmin__input"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={
                createForm.value
              }
              onChange={
                event =>
                  changeCreate(
                    "value",
                    event.target.value
                  )
              }
            />
          </label>


          <label
            className="boykovPromoAdmin__field"
          >
            <span
              className="boykovPromoAdmin__label"
            >
              Лимит использований
            </span>

            <input
              className="boykovPromoAdmin__input"
              type="number"
              min="1"
              step="1"
              placeholder="Без лимита"
              value={
                createForm.maxUses
              }
              onChange={
                event =>
                  changeCreate(
                    "maxUses",
                    event.target.value
                  )
              }
            />
          </label>


          <label
            className="boykovPromoAdmin__field"
          >
            <span
              className="boykovPromoAdmin__label"
            >
              Действует до
            </span>

            <input
              className="boykovPromoAdmin__input"
              type="datetime-local"
              value={
                createForm.expiresAt
              }
              onChange={
                event =>
                  changeCreate(
                    "expiresAt",
                    event.target.value
                  )
              }
            />
          </label>

        </div>


        <div
          className="boykovPromoAdmin__createActions"
        >

          <label
            className="boykovPromoAdmin__checkbox"
          >
            <input
              type="checkbox"
              checked={
                createForm.active
              }
              onChange={
                event =>
                  changeCreate(
                    "active",
                    event.target.checked
                  )
              }
            />

            Активировать сразу
          </label>


          <button
            className="
              boykovPromoAdmin__button
              boykovPromoAdmin__button--primary
            "
            type="submit"
            disabled={
              creating
            }
          >
            {
              creating
                ? "Создаём..."
                : "Создать промокод"
            }
          </button>

        </div>

      </form>


      <div
        className="boykovPromoAdmin__list"
      >

        {
          loading &&
          (
            <div
              className="boykovPromoAdmin__empty"
            >
              Загружаем промокоды...
            </div>
          )
        }


        {
          !loading &&
          items.length ===
            0 &&
          (
            <div
              className="boykovPromoAdmin__empty"
            >
              Промокодов пока нет.
            </div>
          )
        }


        {
          !loading &&
          items.map(
            promo => (

              <PromoCodeCard
                key={
                  promo.id
                }
                promo={
                  promo
                }
                token={
                  token
                }
                onReload={
                  loadItems
                }
                onMessage={
                  showMessage
                }
              />

            )
          )
        }

      </div>

    </section>
  );

}
