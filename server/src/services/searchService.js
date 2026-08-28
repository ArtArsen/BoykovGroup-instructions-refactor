import Fuse from "fuse.js";

import {
  instructionsRepository
} from "./instructionsRepository.js";

import {
  getInstructionPopularity
} from "./instructionPopularityService.js";


const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,

  keys: [
    {
      name: "title",
      weight: 0.6
    },
    {
      name: "profession",
      weight: 0.35
    },
    {
      name: "intro",
      weight: 0.05
    }
  ]
};


function timestamp(value) {

  const result =
    Date.parse(
      String(value ?? "")
    );

  return Number.isFinite(result)
    ? result
    : 0;
}


function compareNewest(a, b) {

  const difference =
    timestamp(b?.createdAt)
    -
    timestamp(a?.createdAt);

  if (difference !== 0) {
    return difference;
  }

  return String(a?.title ?? "")
    .localeCompare(
      String(b?.title ?? ""),
      "ru"
    );
}


function getPopularityMap(
  instructionCount
) {

  try {

    const result =
      getInstructionPopularity({
        period: "total",

        limit:
          Math.max(
            5000,
            instructionCount
          )
      });


    const rows =
      Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result)
          ? result
          : [];


    const map =
      new Map();


    for (const row of rows) {

      const id =
        String(row?.id ?? "");

      if (!id) {
        continue;
      }


      const views =
        Number(
          row?.total
          ??
          row?.views
          ??
          row?.viewCount
          ??
          row?.count
          ??
          0
        );


      map.set(
        id,
        Number.isFinite(views)
          ? views
          : 0
      );
    }


    return map;

  } catch (error) {

    console.error(
      "Instruction popularity sorting error:",
      error
    );

    return new Map();
  }
}


function sortInstructions(
  instructions,
  sortMode,
  allCount
) {

  const items =
    [...instructions];


  if (sortMode === "popular") {

    const popularity =
      getPopularityMap(
        allCount
      );


    items.sort(
      (a, b) => {

        const aViews =
          popularity.get(
            String(a?.id ?? "")
          ) ?? 0;

        const bViews =
          popularity.get(
            String(b?.id ?? "")
          ) ?? 0;


        if (aViews !== bViews) {
          return bViews - aViews;
        }


        return compareNewest(
          a,
          b
        );
      }
    );


    return items;
  }


  return items.sort(
    compareNewest
  );
}


function toSummary(
  instruction
) {

  return {
    id:
      instruction.id,

    title:
      instruction.title,

    profession:
      instruction.profession,

    source:
      instruction.source,

    createdAt:
      instruction.createdAt
  };
}


export function searchInstructions(
  query,
  {
    page = 1,
    pageSize = 6,
    sort = "newest"
  } = {}
) {

  const all =
    instructionsRepository
      .getAll();


  const trimmed =
    String(query ?? "")
      .trim();


  const sortMode =
    sort === "popular"
      ? "popular"
      : "newest";


  let matched;


  if (!trimmed) {

    matched =
      [...all];

  } else {

    const fuse =
      new Fuse(
        all,
        FUSE_OPTIONS
      );


    matched =
      fuse
        .search(trimmed)
        .map(
          result =>
            result.item
        );
  }


  /*
   * Сортируем весь результат,
   * и только потом применяем pagination.
   */
  matched =
    sortInstructions(
      matched,
      sortMode,
      all.length
    );


  const normalizedPageSize =
    Math.max(
      1,
      Math.min(
        200,
        Number.parseInt(
          pageSize,
          10
        ) || 6
      )
    );


  const total =
    matched.length;


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        normalizedPageSize
      )
    );


  const safePage =
    Math.min(
      Math.max(
        1,
        Number.parseInt(
          page,
          10
        ) || 1
      ),
      totalPages
    );


  const start =
    (safePage - 1)
    *
    normalizedPageSize;


  const items =
    matched
      .slice(
        start,
        start + normalizedPageSize
      )
      .map(toSummary);


  return {
    items,
    page:
      safePage,

    pageSize:
      normalizedPageSize,

    total,
    totalPages,

    query:
      trimmed,

    sort:
      sortMode
  };
}
