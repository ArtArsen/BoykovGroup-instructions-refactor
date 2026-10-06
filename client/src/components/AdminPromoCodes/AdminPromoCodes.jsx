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

import PromoCodeCreateForm
  from "./PromoCodeCreateForm.jsx";

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


      <PromoCodeCreateForm
        createForm={
          createForm
        }
        creating={
          creating
        }
        changeCreate={
          changeCreate
        }
        handleCreate={
          handleCreate
        }
      />


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
