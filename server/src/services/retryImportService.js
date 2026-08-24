import path from "node:path";

import {
  getFailedImportFiles,
  updateImportFile,
  updateImport
} from "./importHistoryService.js";

import {
  readImportFile
} from "./importFileStorage.js";

import {
  extractTextFromUpload,
  splitIntoParagraphs
} from "./documentTextExtractor.js";

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
  instructionsRepository
} from "./instructionsRepository.js";

import {
  nanoid
} from "nanoid";

import {
  slugify
} from "../utils/slug.js";





export async function retryFailedImport(importId){


  const failedFiles =
    getFailedImportFiles(
      importId
    );



  if(!failedFiles.length){

    throw new Error(
      "Нет файлов для повторной обработки"
    );

  }



  updateImport(
    importId,
    {
      status:"processing"
    }
  );





  for(
    const file of failedFiles
  ){


    try {


      updateImportFile(
        importId,
        file.id,
        {
          status:"processing",
          startedAt:
            new Date().toISOString(),
          error:null
        }
      );



      const buffer =
        await readImportFile(
          importId,
          file.name
        );



      const rawText =
        await extractTextFromUpload({

          buffer,

          originalName:
            file.name

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
          "Не удалось извлечь текст"
        );

      }





      const profession =
        normalizeProfession(
          file.name,
          cleanedText
        );



      let formatted = null;



      if(isFormatterConfigured()){

        formatted =
          await formatInstructionDocument(
            cleanedText,
            file.name
          );

      }




      const finalProfession =
        formatted?.profession
        ||
        profession;




      const instruction = {


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



        source:
        "retry-import",



        uploadedBy:
        "admin",



        version:
        "1.0",



        createdAt:
        new Date().toISOString(),


        updatedAt:
        new Date().toISOString()

      };





      let finalInstruction =
        instruction;



      try{


        assertInstructionQuality(
          finalInstruction
        );


      }
      catch(error){


        finalInstruction =
          await repairInstruction(
            finalInstruction,
            error.qualityErrors
          );


        assertInstructionQuality(
          finalInstruction
        );


      }






      instructionsRepository.save(
        finalInstruction
      );





      updateImportFile(
        importId,
        file.id,
        {
          status:"completed",
          instructionId:
            finalInstruction.id,
          finishedAt:
            new Date().toISOString()
        }
      );



    }
    catch(error){



      updateImportFile(
        importId,
        file.id,
        {
          status:"failed",
          error:
            error.message,
          finishedAt:
            new Date().toISOString()
        }
      );


    }


  }


}