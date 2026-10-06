export default function InstructionListPagination({

  currentPage,
  totalPages,
  paginationItems,
  isPageLoading,
  paginationError,
  onChangePage

}) {

  return (
    <>

      {
        paginationError &&
        (
          <p
            className="realPaginationError"
          >
            {paginationError}
          </p>
        )
      }


      {
        totalPages > 1 &&
        (
          <nav
            className="realCatalogPagination"
            aria-label="Страницы каталога инструкций"
          >

            <button
              type="button"
              className="realPaginationArrow"
              disabled={
                currentPage === 1 ||
                isPageLoading
              }
              onClick={
                () =>
                  onChangePage(
                    currentPage - 1
                  )
              }
              aria-label="Предыдущая страница"
            >
              ←
            </button>


            {
              paginationItems.map(
                (
                  item,
                  index
                ) => (

                  typeof item ===
                    "number"
                    ? (
                        <button
                          key={`page-${item}`}
                          type="button"
                          disabled={
                            isPageLoading
                          }
                          className={[
                            "realPaginationPage",

                            item ===
                              currentPage
                              ? "realPaginationPageActive"
                              : ""
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={
                            () =>
                              onChangePage(
                                item
                              )
                          }
                          aria-current={
                            item ===
                              currentPage
                              ? "page"
                              : undefined
                          }
                        >
                          {item}
                        </button>
                      )
                    : (
                        <span
                          key={`dots-${item}-${index}`}
                          className="realPaginationDots"
                        >
                          …
                        </span>
                      )

                )
              )
            }


            <button
              type="button"
              className="realPaginationArrow"
              disabled={
                currentPage ===
                  totalPages ||
                isPageLoading
              }
              onClick={
                () =>
                  onChangePage(
                    currentPage + 1
                  )
              }
              aria-label="Следующая страница"
            >
              →
            </button>

          </nav>
        )
      }


      {
        isPageLoading &&
        (
          <div
            className="realPaginationLoading"
          >
            Загрузка...
          </div>
        )
      }

    </>
  );

}
