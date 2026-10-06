import {
  Link
} from "react-router-dom";

import cardStyles
  from "../InstructionButton/InstructionButton.module.css";

import RevealItem
  from "./InstructionListRevealItem.jsx";


export default function InstructionGenerationCard({
  delay
}) {

  return (
    <RevealItem
      delay={
        delay
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
  );

}
