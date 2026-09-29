import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  fileURLToPath
} from "node:url";


const __dirname =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );


const ORDERS_DIR =
  path.join(
    __dirname,
    "..",
    "data",
    "publicGenerationOrders"
  );


export const PUBLIC_GENERATION_PRICE_RUB =
  500;


export const PUBLIC_GENERATION_CURRENCY =
  "RUB";


const ORDER_TTL_MS =
  60 * 60 * 1000;


fs.mkdirSync(
  ORDERS_DIR,
  {
    recursive:
      true
  }
);


function createId() {

  return (
    "pg_" +
    Date.now()
      .toString(36) +
    "_" +
    crypto
      .randomBytes(10)
      .toString("hex")
  );
}


function createAccessToken() {

  return crypto
    .randomBytes(32)
    .toString("hex");
}


function isValidOrderId(
  value
) {

  return (
    typeof value ===
      "string" &&
    /^pg_[a-z0-9_-]{10,100}$/iu
      .test(value)
  );
}


function getOrderPath(
  id
) {

  if (
    !isValidOrderId(id)
  ) {
    return null;
  }


  return path.join(
    ORDERS_DIR,
    `${id}.json`
  );
}


function writeOrder(
  order
) {

  const filepath =
    getOrderPath(
      order.id
    );


  if (!filepath) {
    throw new Error(
      "Некорректный ID заказа"
    );
  }


  const tempPath =
    `${filepath}.${process.pid}.${Date.now()}.tmp`;


  fs.writeFileSync(
    tempPath,
    JSON.stringify(
      order,
      null,
      2
    ),
    "utf8"
  );


  fs.renameSync(
    tempPath,
    filepath
  );


  return order;
}


export function getPublicGenerationOrder(
  id
) {

  const filepath =
    getOrderPath(id);


  if (
    !filepath ||
    !fs.existsSync(filepath)
  ) {
    return null;
  }


  try {

    return JSON.parse(
      fs.readFileSync(
        filepath,
        "utf8"
      )
    );

  }
  catch(error) {

    console.error(
      "[PublicGenerationOrder] read error:",
      id,
      error.message
    );


    return null;
  }
}


export function createPublicGenerationOrder(
  profession
) {

  const now =
    new Date();


  const order = {
    id:
      createId(),

    accessToken:
      createAccessToken(),

    profession:
      String(
        profession ?? ""
      ).trim(),

    amount:
      PUBLIC_GENERATION_PRICE_RUB,

    currency:
      PUBLIC_GENERATION_CURRENCY,

    status:
      "pending_payment",

    transactionId:
      null,

    instructionId:
      null,


    /*
     * ADMIN_PUBLICATION_INBOX_V2
     *
     * Готовый оплаченный документ сначала
     * принадлежит только покупателю.
     */
    generatedInstruction:
      null,

    generatedAt:
      null,

    publicationStatus:
      null,

    reviewedAt:
      null,

    reviewedBy:
      null,

    rejectionReason:
      null,

    createdAt:
      now.toISOString(),

    updatedAt:
      now.toISOString(),

    expiresAt:
      new Date(
        now.getTime() +
        ORDER_TTL_MS
      )
      .toISOString(),

    paidAt:
      null,

    publishedAt:
      null,

    moderationStatus:
      null,

    moderationReason:
      null,

    moderatedAt:
      null,

    refundTransactionId:
      null,

    refundStartedAt:
      null,

    refundedAt:
      null,

    failureCode:
      null,

    internalError:
      null
  };


  return writeOrder(
    order
  );
}


export function updatePublicGenerationOrder(
  id,
  patch = {}
) {

  const current =
    getPublicGenerationOrder(
      id
    );


  if (!current) {
    return null;
  }


  const updated = {
    ...current,
    ...patch,

    id:
      current.id,

    accessToken:
      current.accessToken,

    profession:
      current.profession,

    amount:
      current.amount,

    currency:
      current.currency,

    updatedAt:
      new Date()
        .toISOString()
  };


  return writeOrder(
    updated
  );
}


function safeTokenEqual(
  first,
  second
) {

  if (
    typeof first !==
      "string" ||
    typeof second !==
      "string"
  ) {
    return false;
  }


  const left =
    Buffer.from(
      first,
      "utf8"
    );

  const right =
    Buffer.from(
      second,
      "utf8"
    );


  if (
    left.length !==
    right.length
  ) {
    return false;
  }


  return crypto.timingSafeEqual(
    left,
    right
  );
}


export function getPublicGenerationOrderView(
  id,
  accessToken
) {

  const order =
    getPublicGenerationOrder(
      id
    );


  if (!order) {
    return null;
  }


  if (
    !safeTokenEqual(
      order.accessToken,
      accessToken
    )
  ) {
    return null;
  }


  return {
    id:
      order.id,

    profession:
      order.profession,

    amount:
      order.amount,

    currency:
      order.currency,

    status:
      order.status,

    instructionId:
      order.instructionId,


    /*
     * Полный результат доступен только владельцу,
     * прошедшему проверку x-order-token.
     */
    instruction:
      order.generatedInstruction ??
      null,

    generatedAt:
      order.generatedAt ??
      null,

    publicationStatus:
      order.publicationStatus ??
      null,

    createdAt:
      order.createdAt,

    expiresAt:
      order.expiresAt,

    paidAt:
      order.paidAt,

    publishedAt:
      order.publishedAt,

      refundedAt:
        order.refundedAt ??
        null,

    failureCode:
      order.failureCode
  };
}


export function findPublicGenerationOrderByTransactionId(
  transactionId
) {

  const target =
    String(
      transactionId ?? ""
    ).trim();


  if (!target) {
    return null;
  }


  const files =
    fs.readdirSync(
      ORDERS_DIR
    )
    .filter(
      name =>
        name.endsWith(
          ".json"
        )
    );


  for (
    const filename
    of files
  ) {

    try {

      const order =
        JSON.parse(
          fs.readFileSync(
            path.join(
              ORDERS_DIR,
              filename
            ),
            "utf8"
          )
        );


      if (
        String(
          order.transactionId ??
          ""
        ) === target
      ) {
        return order;
      }

    }
    catch(error) {

      console.error(
        "[PublicGenerationOrder] scan error:",
        filename,
        error.message
      );

    }

  }


  return null;
}


export function listRecoverablePublicGenerationOrders() {

  const result = [];


  const files =
    fs.readdirSync(
      ORDERS_DIR
    )
    .filter(
      name =>
        name.endsWith(
          ".json"
        )
    );


  for (
    const filename
    of files
  ) {

    try {

      const order =
        JSON.parse(
          fs.readFileSync(
            path.join(
              ORDERS_DIR,
              filename
            ),
            "utf8"
          )
        );


      if (
        [
          "paid",
          "moderating",
          "generating",
          "refunding",
          "refund_pending"
        ].includes(
          order.status
        )
      ) {
        result.push(
          order
        );
      }

    }
    catch(error) {

      console.error(
        "[PublicGenerationOrder] recovery scan error:",
        filename,
        error.message
      );

    }

  }


  return result;
}



/*
 * ============================================================
 * ADMIN_PUBLICATION_INBOX_V2
 * ============================================================
 */

export function listPublicationInboxOrders() {

  const result = [];

  const files =
    fs.readdirSync(
      ORDERS_DIR
    )
    .filter(
      filename =>
        filename.endsWith(
          ".json"
        )
    );


  for (
    const filename
    of files
  ) {

    try {

      const current =
        JSON.parse(
          fs.readFileSync(
            path.join(
              ORDERS_DIR,
              filename
            ),
            "utf8"
          )
        );


      if (
        current.status !==
          "generated" ||
        current.publicationStatus !==
          "pending" ||
        !current.generatedInstruction
      ) {
        continue;
      }


      result.push({
        id:
          current.id,

        profession:
          current.profession,

        status:
          current.status,

        publicationStatus:
          current.publicationStatus,

        paidAt:
          current.paidAt ??
          null,

        generatedAt:
          current.generatedAt ??
          null,

        instruction:
          current.generatedInstruction
      });

    }
    catch(error) {

      console.error(
        "[PublicGenerationOrder] publication inbox scan:",
        filename,
        error.message
      );

    }

  }


  result.sort(
    (left, right) =>
      String(
        right.generatedAt ??
        right.paidAt ??
        ""
      )
      .localeCompare(
        String(
          left.generatedAt ??
          left.paidAt ??
          ""
        )
      )
  );


  return result;
}
