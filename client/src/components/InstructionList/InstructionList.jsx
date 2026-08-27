import {
  useEffect,
  useRef,
  useState
} from "react";

import InstructionButton
  from "../InstructionButton/InstructionButton.jsx";

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
  ] =
    useState(false);


  useEffect(() => {

    const node =
      itemRef.current;


    if (!node) {
      return undefined;
    }


    /*
     * Уважаем системную настройку
     * уменьшения анимации.
     */
    const prefersReducedMotion =
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )?.matches;


    /*
     * Fallback:
     * если IntersectionObserver недоступен,
     * просто показываем карточку.
     */
    if (
      prefersReducedMotion ||
      typeof IntersectionObserver ===
        "undefined"
    ) {

      setIsVisible(true);

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


          setIsVisible(true);

          /*
           * Карточка анимируется только один раз.
           */
          observer.unobserve(
            entry.target
          );

        },
        {
          /*
           * Карточка должна действительно
           * войти в viewport, а не появляться
           * сильно заранее.
           */
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
      ref={itemRef}

      className={
        [
          styles.item,

          isVisible
            ? styles.visible
            : ""
        ]
          .filter(Boolean)
          .join(" ")
      }

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
  onSelect,
  isAdmin,
  onDelete,
  deletingId,
  onEdit
}) {

  return (
    <ul className={styles.list}>

      {instructions.map(
        (
          instruction,
          index
        ) => (

          <RevealItem
            key={instruction.id}

            /*
             * Небольшой каскад внутри группы.
             * Максимальная задержка всего 120ms.
             */
            delay={
              (index % 3) *
              90
            }
          >

            <InstructionButton
              instruction={instruction}
              onSelect={onSelect}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onEdit={onEdit}

              isDeleting={
                deletingId ===
                instruction.id
              }
            />

          </RevealItem>

        )
      )}

    </ul>
  );
}
