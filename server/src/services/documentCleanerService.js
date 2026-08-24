const REMOVE_PATTERNS = [

  /name_full/gi,
  /inndoc/gi,
  /uridicheskiy_adress/gi,
  /date_doc/gi,
  /obj_name/gi,
  /address_object/gi,
  /dolzn_shortcompname/gi,
  /podpisant_ot/gi,
  /NMBP/gi,
  /AUTOZAMENA[_\w]*/gi,
  /autozamena[_\w]*/gi,

];


export function cleanDocumentText(text = "") {

  let cleaned = text;


  for (const pattern of REMOVE_PATTERNS) {

    cleaned = cleaned.replace(
      pattern,
      ""
    );

  }


  cleaned = cleaned.replace(
    /УТВЕРЖДАЮ[\s\S]{0,300}/gi,
    ""
  );


  cleaned = cleaned.replace(
    /Приложение[\s\S]{0,300}/gi,
    ""
  );


  cleaned = cleaned.replace(
    /Номер документа[\s\S]{0,100}/gi,
    ""
  );


  cleaned = cleaned.replace(
    /Дата составления[\s\S]{0,100}/gi,
    ""
  );


  cleaned = cleaned.replace(
    /\n{3,}/g,
    "\n\n"
  );


  return cleaned.trim();

}



export function normalizeProfession(filename, text = "") {


  const source = (
    filename +
    " " +
    text.substring(0, 1000)
  )
    .toLowerCase();



  const professions = [

    "сварщик",
    "электромонтер",
    "электромонтер по ремонту и обслуживанию электрооборудования",
    "маляр",
    "бетонщик",
    "слесарь",
    "водитель",
    "плотник",
    "администратор данных",
    "повар",
    "стропальщик"

  ];



  for (const profession of professions) {

    if (source.includes(profession)) {

      return profession;

    }

  }


  return filename

    .replace(/\.[^/.]+$/, "")

    .replace(/[_-]/g, " ")

    .replace(/иот/gi, "")

    .trim();

}



export function buildInstructionTitle(profession) {

  return (
    "Инструкция по охране труда для " +
    profession
  );

}