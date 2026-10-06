import {
  Link
} from "react-router-dom";

import {
  useSelector
} from "react-redux";

import Header
  from "../Header/Header.jsx";

import Navigation
  from "../Navigation/Navigation.jsx";


import InstructionSort
  from "../InstructionSort/InstructionSort.jsx";

import GeneratedInstructionBadge
  from "../GeneratedInstructionBadge/GeneratedInstructionBadge.jsx";

import {
  selectIsAdmin
} from "../../store/authSlice.js";

import SEO
  from "../SEO/SEO.jsx";

import useInstructionsCatalog
  from "./hooks/useInstructionsCatalog.js";

import styles
  from "./InstructionsCatalog.module.css";


export default function InstructionsCatalog() {

  const isAdmin =
    useSelector(
      selectIsAdmin
    );


  const {
    items,
    loading,
    page,
    totalPages,
    error,
    paginationItems,
    changePage
  } =
    useInstructionsCatalog();


  return (
    <div
      className={
        styles.page
      }
    >

      <SEO
        title="Инструкции по охране труда | БОЙКОВГРУПП"
        description="Готовые инструкции по охране труда для различных профессий. База документов по охране труда для организаций."
      />


      <div
        className={
          styles.siteHeader
        }
      >

        <Header
          query=""
          onQueryChange={
            () => {}
          }
        />

        <Navigation />

      </div>


      <main
        className={
          styles.content
        }
      >

        <a
          id="boykovCatalogHomeButton"
          className="boykovCatalogHomeButton"
          href="/"
        >
          ← На главную
        </a>


        <h1>
          Инструкции по охране труда
        </h1>


        <p
          className={
            styles.description
          }
        >
          Готовые инструкции по охране труда для работников различных профессий.
        </p>


        {
          loading &&
          (
            <p
              className="catalogLoading"
            >
              Загрузка...
            </p>
          )
        }


        {
          error &&
          (
            <p
              className="catalogError"
            >
              {error}
            </p>
          )
        }


        {
          !loading &&
          !error &&
          (
            <>

              <InstructionSort />


              <div
                className={
                  styles.grid
                }
              >

                {
                  items.map(
                    item => (

                      <Link
                        key={
                          item.id
                        }
                        to={`/instrukciya-po-ohrane-truda/${item.id}`}
                        className={
                          styles.card
                        }
                      >

                        <h2>
                          {item.title}
                        </h2>


                        {
                          isAdmin &&
                          item?.source ===
                            "generated" &&
                          (
                            <GeneratedInstructionBadge />
                          )
                        }


                        <span>
                          Открыть инструкцию →
                        </span>

                      </Link>

                    )
                  )
                }


                <div
                  className="generationCatalogCard generationCatalogStandalone"
                >

                  <div
                    className="generationCatalogEyebrow"
                  >
                    Нужной инструкции нет?
                  </div>

                  <h2
                    className="generationCatalogTitle"
                  >
                    Не нашли нужную инструкцию?
                  </h2>

                  <p
                    className="generationCatalogText"
                  >
                    Сгенерируйте её!
                  </p>

                  <Link
                    to="/srochnaya-generaciya-instrukcii"
                    className="generationCatalogButton"
                  >
                    Сгенерировать
                  </Link>

                </div>

              </div>


              {
                totalPages > 1 &&
                (
                  <nav
                    className="catalogPagination"
                    aria-label="Пагинация инструкций"
                  >

                    <button
                      type="button"
                      className="catalogPaginationArrow"
                      disabled={
                        page === 1
                      }
                      onClick={
                        () =>
                          changePage(
                            page - 1
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
                                  className={[
                                    "catalogPaginationPage",

                                    item ===
                                      page
                                      ? "catalogPaginationPageActive"
                                      : ""
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  onClick={
                                    () =>
                                      changePage(
                                        item
                                      )
                                  }
                                  aria-current={
                                    item ===
                                      page
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
                                  className="catalogPaginationDots"
                                >
                                  …
                                </span>
                              )

                        )
                      )
                    }


                    <button
                      type="button"
                      className="catalogPaginationArrow"
                      disabled={
                        page ===
                          totalPages
                      }
                      onClick={
                        () =>
                          changePage(
                            page + 1
                          )
                      }
                      aria-label="Следующая страница"
                    >
                      →
                    </button>

                  </nav>
                )
              }

            </>
          )
        }

      </main>

    </div>
  );

}
