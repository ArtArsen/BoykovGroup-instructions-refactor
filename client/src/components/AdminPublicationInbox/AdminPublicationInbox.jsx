import PrivateInstructionView from "../PrivateInstructionView/PrivateInstructionView.jsx";
import styles from "../AdminPanel/AdminPanel.module.css";


export default function AdminPublicationInbox({

  adminDashboardTab,

  publicationInbox,
  publicationInboxLoading,
  publicationInboxError,
  publicationReviewBusy,

  selectedPublicationInstruction,
  setSelectedPublicationInstruction,

  reviewPublication

}) {

  return (

    <div
      data-boykov-admin-tab-section="publications"
      className={[
        styles.publicationInbox,

        adminDashboardTab !==
          "publications"
          ? "boykovAdminDashboardSection--hidden"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <div
        className={
          styles.publicationInboxHeader
        }
      >

        <div>

          <div
            className={
              styles.publicationInboxEyebrow
            }
          >
            Публикации
          </div>

          <h2
            className={
              styles.publicationInboxTitle
            }
          >
            Ящик инструкций
          </h2>

          <p
            className={
              styles.publicationInboxDescription
            }
          >
            Оплаченные инструкции уже
            выданы пользователям.
            Здесь вы решаете только,
            публиковать ли их
            в общем каталоге.
          </p>

        </div>


        <div
          className={
            styles.publicationInboxCount
          }
        >
          {
            publicationInbox.length
          }
        </div>

      </div>


      {
        publicationInboxError &&
        (
          <div
            className={
              styles.statsError
            }
          >
            {
              publicationInboxError
            }
          </div>
        )
      }


      {
        publicationInboxLoading &&
        publicationInbox.length === 0
          ? (
            <div
              className={
                styles.publicationEmpty
              }
            >
              Загружаем новые инструкции...
            </div>
          )
          : publicationInbox.length === 0
            ? (
              <div
                className={
                  styles.publicationEmpty
                }
              >
                Новых инструкций
                на публикацию нет.
              </div>
            )
            : (
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

                                setSelectedPublicationInstruction({
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
            )
      }


      {
        selectedPublicationInstruction &&
        (
          <div
            className={
              styles.publicationModalOverlay
            }
            onMouseDown={
              event => {

                if (
                  event.target ===
                    event.currentTarget
                ) {

                  setSelectedPublicationInstruction(
                    null
                  );

                }

              }
            }
          >

            <div
              className={
                styles.publicationModal
              }
            >

              <div
                className={
                  styles.publicationModalHeader
                }
              >

                <strong>
                  Просмотр инструкции
                </strong>

                <button
                  type="button"
                  className={
                    styles.publicationModalClose
                  }
                  onClick={
                    () =>
                      setSelectedPublicationInstruction(
                        null
                      )
                  }
                  aria-label="Закрыть"
                >
                  ×
                </button>

              </div>


              <div
                className={
                  styles.publicationModalContent
                }
              >

                <PrivateInstructionView
                  compact
                  instruction={
                    selectedPublicationInstruction
                      .instruction
                  }
                />

              </div>

            </div>

          </div>
        )
      }

    </div>

  );

}
