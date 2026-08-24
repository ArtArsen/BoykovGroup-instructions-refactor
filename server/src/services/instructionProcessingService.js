import {
  extractTextFromUpload,
  splitIntoParagraphs
} from "./documentTextExtractor.js";

import {
    checkInstructionDuplicate
} from "./instructionDuplicateService.js";

import {
  createInstructionHash
} from "./instructionHashService.js";

import {
 compareInstruction
} from "./instructionVersionService.js";


import {
 instructionsRepository
} from "./instructionsRepository.js";

import {
  normalizeProfessionKey
} from "./professionNormalizer.js";

import {
  cleanDocumentText,
  normalizeProfession,
  buildInstructionTitle
} from "./documentCleanerService.js";

import {
  formatInstructionDocument,
  isFormatterConfigured
} from "./instructionFormatterService.js";

import {
  assertInstructionQuality
} from "./instructionQualityChecker.js";

import {
  repairInstruction
} from "./instructionRepairService.js";

import {
  nanoid
} from "nanoid";

import {
  slugify
} from "../utils/slug.js";




export async function processInstructionFile({
  buffer,
  filename,
  mimetype,
  source = "uploaded"
}) {


  const rawText =
    await extractTextFromUpload({

      buffer,

      originalName:
        filename,

      mimetype

    });




  const cleanedText =
    cleanDocumentText(
      rawText
    );




  const paragraphs =
    splitIntoParagraphs(
      cleanedText
    );



  if(!paragraphs.length){

    throw new Error(
      "Не удалось извлечь текст документа"
    );

  }




  const profession =
    normalizeProfession(
      filename,
      cleanedText
    );



  let formatted = null;



  if(isFormatterConfigured()){


    try{


      formatted =
        await formatInstructionDocument(
          cleanedText,
          filename
        );


    }
    catch(error){


      console.warn(
        "Formatter error:",
        error.message
      );


    }

  }




  const finalProfession =
    formatted?.profession
    ||
    profession;


const professionKey =
    normalizeProfessionKey(
        finalProfession
    );

let instruction = {


    id:
      `${slugify(
        buildInstructionTitle(finalProfession)
      )}-${nanoid(6)}`,


    title:
      formatted?.title
      ||
      buildInstructionTitle(
        finalProfession
      ),


    profession:
      finalProfession,


    professionKey:
      professionKey,


    intro:
      "Инструкция устанавливает требования охраны труда при выполнении работ по профессии.",


    sections:
      formatted?.sections?.length
      ?
      formatted.sections
      :
      [
        {
          number:1,
          heading:
          "Общие требования охраны труда",
          paragraphs
        }
      ],


    source,


    uploadedBy:
      "admin",


    version:
      "1.0",


    createdAt:
      new Date().toISOString(),


    updatedAt:
      new Date().toISOString()

};

instruction.contentHash =
    createInstructionHash(
        instruction
    );

  try{


    assertInstructionQuality(
      instruction
    );


  }
  catch(error){


    instruction =
      await repairInstruction(
        instruction,
        error.qualityErrors
      );


    assertInstructionQuality(
      instruction
    );


  }

instruction.contentHash =
    createInstructionHash(
        instruction
    );


  const existing =
    instructionsRepository.findByProfessionKey(
        instruction.professionKey
    );



if(existing){

    return compareInstruction(
        existing,
        instruction
    );

}


 return {

    action:
        "new",

    instruction

};

}