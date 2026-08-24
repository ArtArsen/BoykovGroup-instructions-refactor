import {
  generateInstructionWithYandexGpt
} from "./yandexGptService.js";



export async function repairInstruction(
  instruction,
  errors
) {


  const repairPrompt = `

Ты являешься редактором инструкций по охране труда.

Исправь документ согласно требованиям.

Ошибки проверки:

${errors.join("\n")}


Текущий документ:

${JSON.stringify(
  instruction,
  null,
  2
)}


Требования:

1. Название:
"Инструкция по охране труда для ..."

2. Должна быть профессия.

3. Должно быть 5 разделов:

1. Общие требования охраны труда

2. Требования охраны труда перед началом работы

3. Требования охраны труда во время работы

4. Требования охраны труда в аварийных ситуациях

5. Требования охраны труда по окончании работы


4. Не добавляй:
- реквизиты организации;
- ФИО;
- подписи;
- даты;
- номера приказов;
- шаблонные поля.


Верни только JSON.

`;



const repaired =
await generateInstructionWithYandexGpt(
  repairPrompt
);



return {

  ...instruction,

  ...repaired

};


}