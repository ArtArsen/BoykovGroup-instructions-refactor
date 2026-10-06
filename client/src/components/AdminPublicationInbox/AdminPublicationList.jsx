import styles from "../AdminPanel/AdminPanel.module.css";


export default function AdminPublicationList({

  publicationInbox,
  publicationInboxLoading,
  publicationReviewBusy,

  onSelect,
  reviewPublication

}) {

  if (
    publicationInboxLoading &&
    publicationInbox.length === 0
  ) {

    return (

      <div
        className={
          styles.publicationEmpty
        }
      >
        Загружаем новые инструкции...
      </div>

    );

  }


  if (
    publicationInbox.length === 0
  ) {

    return (

      <div
        className={
          styles.publicationEmpty
        }
      >
        Новых инструкций
        на публикацию нет.
      </div>

    );

  }


  return (

    <div
      className={
        styles.publicationList
      }
    >

      {
        publicationInbox.map(
          item => (

            <div
              className={
                styles.publicationCard
              }
              key={
                item.id
              }
            >

              <div
                className={
                  styles.publicationCardMain
                }
              >

                <div
                  className={
                    styles.publicationMeta
                  }
                >
                  {
                    item.generatedAt
                      ? new Date(
                          item.generatedAt
                        )
                        .toLocaleString(
                          "ru-RU"
                        )
                      : "Дата не указана"
                  }
                </div>

                <h3
                  className={
                    styles.publicationProfession
                  }
                >
                  {
                    item.profession
                  }
                </h3>

                <div
                  className={
                    styles.publicationOrderId
                  }
                >
                  {
                    item.id
                  }
                </div>

              </div>


              <div
                className={
                  styles.publicationActions
                }
              >

                <button
                  type="button"
                  className={
                    styles.publicationSecondaryButton
                  }
                  onClick={
                    () => {

                      onSelect({
                        orderId:
                          item.id,

                        instruction:
                          item.instruction
                      });

                    }
                  }
                >
                  Просмотреть
                </button>


                <button
                  type="button"
                  className={
                    styles.publicationApproveButton
                  }
                  disabled={
                    publicationReviewBusy ===
                      item.id
                  }
                  onClick={
                    () =>
                      reviewPublication(
                        item.id,
                        "approve"
                      )
                  }
                >
                  Опубликовать
                </button>


                <button
                  type="button"
                  className={
                    styles.publicationRejectButton
                  }
                  disabled={
                    publicationReviewBusy ===
                      item.id
                  }
                  onClick={
                    () =>
                      reviewPublication(
                        item.id,
                        "reject"
                      )
                  }
                >
                  Отклонить
                </button>

              </div>

            </div>

          )
        )
      }

    </div>

  );

}
