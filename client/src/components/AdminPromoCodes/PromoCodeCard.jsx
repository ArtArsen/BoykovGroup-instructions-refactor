import {
  useEffect,
  useState
} from "react";

import {
  deletePromoCode,
  updatePromoCode
} from "../../api/promoCodesApi.js";

import {
  fromLocalInput,
  formatDate,
  typeLabel,
  toDraft
} from "./promoCodeAdminUtils.js";

import "./AdminPromoCodes.css";


export default function PromoCodeCard({
  promo,
  token,
  onReload,
  onMessage
}) {

  const [
    draft,
    setDraft
  ] =
    useState(
      () =>
        toDraft(
          promo
        )
    );


  const [
    busy,
    setBusy
  ] =
    useState(false);


  useEffect(() => {

    setDraft(
      toDraft(
        promo
      )
    );

  }, [
    promo
  ]);


  function change(
    name,
    value
  ) {

    setDraft(
      current => ({
        ...current,
        [name]:
          value
      })
    );

  }


  function payload() {

    const maxUsesText =
      String(
        draft.maxUses ?? ""
      )
        .trim();


    return {
      code:
        String(
          draft.code || ""
        )
          .trim()
          .toUpperCase(),

      type:
        draft.type ||
        "fixed_price",

      value:
        Number(
          draft.value
        ),

      maxUses:
        maxUsesText
          ? Number(
              maxUsesText
            )
          : null,

      expiresAt:
        fromLocalInput(
          draft.expiresAt
        ),

      active:
        draft.active ===
        true
    };

  }


  async function save() {

    setBusy(
      true
    );

    onMessage(
      "",
      ""
    );


    try {

      await updatePromoCode(
        promo.id,
        payload(),
        token
      );


      onMessage(
        `Промокод ${promo.code} сохранён.`,
        "success"
      );


      await onReload();

    }
    catch(error) {

      onMessage(
        error?.message ||
        "Не удалось сохранить промокод.",
        "error"
      );

    }
    finally {

      setBusy(
        false
      );

    }

  }


  async function toggle() {

    setBusy(
      true
    );

    onMessage(
      "",
      ""
    );


    try {

      await updatePromoCode(
        promo.id,
        {
          active:
            promo.active !==
            true
        },
        token
      );


      await onReload();

    }
    catch(error) {

      onMessage(
        error?.message ||
        "Не удалось изменить состояние промокода.",
        "error"
      );

    }
    finally {

      setBusy(
        false
      );

    }

  }


  async function remove() {

    const confirmed =
      window.confirm(
        `Удалить промокод ${promo.code}?`
      );


    if (!confirmed) {
      return;
    }


    setBusy(
      true
    );

    onMessage(
      "",
      ""
    );


    try {

      await deletePromoCode(
        promo.id,
        token
      );


      onMessage(
        `Промокод ${promo.code} удалён.`,
        "success"
      );


      await onReload();

    }
    catch(error) {

      onMessage(
        error?.message ||
        "Не удалось удалить промокод.",
        "error"
      );

    }
    finally {

      setBusy(
        false
      );

    }

  }


  const usage =
    promo.maxUses
      ? `${promo.usedCount} / ${promo.maxUses}`
      : `${promo.usedCount} / ∞`;


  return (
    <article
      className="boykovPromoCard"
    >

      <div
        className="boykovPromoCard__top"
      >

        <div>

          <div
            className="boykovPromoCard__name"
          >

            <span
              className="boykovPromoCard__code"
            >
              {promo.code}
            </span>


            <span
              className="boykovPromoCard__badge"
            >
              {
                typeLabel(
                  promo
                )
              }
            </span>


            <span
              className={[
                "boykovPromoCard__badge",

                promo.active
                  ? "boykovPromoCard__badge--active"
                  : "boykovPromoCard__badge--disabled"
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {
                promo.active
                  ? "Активен"
                  : "Выключен"
              }
            </span>

          </div>


          <div
            className="boykovPromoCard__meta"
          >
            Создан:{" "}
            {
              formatDate(
                promo.createdAt
              )
            }
            {" · "}
            Срок:{" "}
            {
              formatDate(
                promo.expiresAt
              )
            }
          </div>

        </div>


        <div
          className="boykovPromoCard__usage"
        >

          <div
            className="boykovPromoCard__usageValue"
          >
            {usage}
          </div>

          <div
            className="boykovPromoCard__usageLabel"
          >
            использовано
          </div>

        </div>

      </div>


      <div
        className="boykovPromoCard__grid"
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
            value={
              draft.code
            }
            onChange={
              event =>
                change(
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
              draft.type
            }
            onChange={
              event =>
                change(
                  "type",
                  event.target.value
                )
            }
          >
            <option value="fixed_price">
              Итоговая цена
            </option>

            <option value="percent">
              Скидка %
            </option>
          </select>
        </label>


        <label
          className="boykovPromoAdmin__field"
        >
          <span
            className="boykovPromoAdmin__label"
          >
            Значение
          </span>

          <input
            className="boykovPromoAdmin__input"
            type="number"
            min="0.01"
            step="0.01"
            value={
              draft.value
            }
            onChange={
              event =>
                change(
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
            Лимит
          </span>

          <input
            className="boykovPromoAdmin__input"
            type="number"
            min="1"
            step="1"
            placeholder="Без лимита"
            value={
              draft.maxUses
            }
            onChange={
              event =>
                change(
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
              draft.expiresAt
            }
            onChange={
              event =>
                change(
                  "expiresAt",
                  event.target.value
                )
            }
          />
        </label>

      </div>


      <div
        className="boykovPromoCard__footer"
      >

        <label
          className="boykovPromoAdmin__checkbox"
        >

          <input
            type="checkbox"
            checked={
              draft.active
            }
            onChange={
              event =>
                change(
                  "active",
                  event.target.checked
                )
            }
          />

          Промокод активен

        </label>


        <div
          className="boykovPromoCard__actions"
        >

          <button
            type="button"
            className="boykovPromoAdmin__button"
            disabled={
              busy
            }
            onClick={
              save
            }
          >
            Сохранить
          </button>


          <button
            type="button"
            className="boykovPromoAdmin__button"
            disabled={
              busy
            }
            onClick={
              toggle
            }
          >
            {
              promo.active
                ? "Выключить"
                : "Включить"
            }
          </button>


          <button
            type="button"
            className="
              boykovPromoAdmin__button
              boykovPromoAdmin__button--danger
            "
            disabled={
              busy
            }
            onClick={
              remove
            }
          >
            Удалить
          </button>

        </div>

      </div>

    </article>
  );

}
