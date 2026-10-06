import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import InstructionButton
  from "../InstructionButton/InstructionButton.jsx";

import cardStyles
  from "../InstructionButton/InstructionButton.module.css";

import InstructionListPagination
  from "./InstructionListPagination.jsx";

import useInstructionListPagination
  from "./hooks/useInstructionListPagination.js";

import styles
  from "./InstructionList.module.css";


function RevealItem({
  children,
  delay = 0
}) {

  const itemRef =
    useRef(null);

  const [
    isVisible,
    setIsVisible
  ] = useState(false);


  useEffect(() => {

    const node =
      itemRef.current;


    if (!node) {
      return undefined;
    }


    const prefersReducedMotion =
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )?.matches;


    if (
      prefersReducedMotion ||
      typeof IntersectionObserver ===
        "undefined"
    ) {

      setIsVisible(
        true
      );

      return undefined;

    }


    const observer =
      new IntersectionObserver(
        ([entry]) => {

          if (
            !entry.isIntersecting
          ) {

            return;

          }


          setIsVisible(
            true
          );


          observer.unobserve(
            entry.target
          );

        },

        {
          threshold:
            0.06,

          rootMargin:
            "0px 0px -2% 0px"
        }
      );


    observer.observe(
      node
    );


    return () => {

      observer.disconnect();

    };

  }, []);


  return (
    <li
      ref={
        itemRef
      }
      className={[
        styles.item,

        isVisible
          ? styles.visible
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--reveal-delay":
          `${delay}ms`
      }}
    >
      {children}
    </li>
  );

}


export default function InstructionList({
  instructions,
  total = 0,
  query = "",
  isAdmin,
  onDelete,
  deletingId,
  onEdit
}) {

  const {
    currentPage,
    visibleItems,
    isPageLoading,
    paginationError,
    totalPages,
    paginationItems,
    changePage
  } =
    useInstructionListPagination({
      instructions,
      total,
      query
    });


  return (
    <>

      <ul
        className={
          styles.list
        }
      >

        {
          visibleItems.map(
            (
              instruction,
              index
            ) => (

              <RevealItem
                key={
                  instruction.id
                }
                delay={
                  (
                    index % 3
                  )
                  *
                  90
                }
              >

                <InstructionButton
                  instruction={
                    instruction
                  }
                  isAdmin={
                    isAdmin
                  }
                  onDelete={
                    onDelete
                  }
                  onEdit={
                    onEdit
                  }
                  isDeleting={
                    deletingId ===
                    instruction.id
                  }
                />

              </RevealItem>

            )
          )
        }


        <RevealItem
          key="generation-card"
          delay={
            (
              visibleItems.length %
              3
            )
            *
            90
          }
        >

          <div
            className={`${cardStyles.card} generationListCard boykovCardSearchShadow`}
          >

            <div
              className={`${cardStyles.clickArea} generationListCardInner`}
            >

              <span
                className={`${cardStyles.body} generationListBody`}
              >

                <span
                  className="generationListEyebrow"
                >
                  [ своя инструкция ]
                </span>


                <span
                  className={`${cardStyles.title} generationListTitle`}
                >
                  Не нашли нужную инструкцию?
                </span>


                <span
                  className="generationListText"
                >
                  Создадим её за 2 минуты!
                </span>


                <Link
                  to="/srochnaya-generaciya-instrukcii"
                  className="generationListButton"
                >
                  Сгенерировать
                </Link>

              </span>

            </div>

          </div>

        </RevealItem>

      </ul>


      <InstructionListPagination
        currentPage={
          currentPage
        }
        totalPages={
          totalPages
        }
        paginationItems={
          paginationItems
        }
        isPageLoading={
          isPageLoading
        }
        paginationError={
          paginationError
        }
        onChangePage={
          changePage
        }
      />


    </>
  );

}
