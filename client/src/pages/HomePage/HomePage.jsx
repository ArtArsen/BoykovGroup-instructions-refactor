import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

import {
  useLocation
} from "react-router-dom";

import Header
  from "../../components/Header/Header.jsx";

import AdminPanel
  from "../../components/AdminPanel/AdminPanel.jsx";

import HomeCompactHeader
  from "./components/HomeCompactHeader/HomeCompactHeader.jsx";

import HomeIntro
  from "./components/HomeIntro/HomeIntro.jsx";

import InstructionResults
  from "./components/InstructionResults/InstructionResults.jsx";

import EditInstructionModal
  from "../../components/EditInstructionModal/EditInstructionModal.jsx";

import {
  useDebouncedValue
} from "../../hooks/useDebouncedValue.js";

import {
  searchInstructions,
  generateInstruction,
  deleteInstruction
} from "../../store/instructionsSlice.js";

import {
  selectAuthToken,
  selectIsAdmin
} from "../../store/authSlice.js";

import {
  updateInstruction
} from "../../api/instructionsApi.js";

import {
  PAGE_SIZE
} from "../../constants.js";

import styles
  from "../../App.module.css";


export default function HomePage() {
  const dispatch = useDispatch();

  const location =
    useLocation();
  const isAdmin =
    useSelector(
      selectIsAdmin
    );

  const authToken =
    useSelector(
      selectAuthToken
    );

  const [importId,setImportId] = useState(null);
  const [queryInput, setQueryInput] = useState(
    () =>
      new URLSearchParams(
        window.location.search
      ).get("q") ?? ""
  );
  const [editingInstruction, setEditingInstruction] = useState(null);

  const [
    isCompactHeader,
    setIsCompactHeader
  ] = useState(false);
  const debouncedQuery = useDebouncedValue(queryInput, 350);

  const stickyIntroRef =
    useRef(null);

  const stickyTriggerRef =
    useRef(null);

  const loadMoreRef =
    useRef(null);

  const loadMoreLockRef =
    useRef(false);

  /*
   * После одной автоматической загрузки
   * ждём, пока sentinel выйдет из viewport.
   *
   * Это предотвращает:
   * page 2 -> page 3 -> page 4 -> ...
   * без прокрутки пользователя.
   */
  const loadMoreArmedRef =
    useRef(true);
  const {
    items,
    total,
    page: resultPage,
    totalPages,
    isSearching,
    isLoadingMore,
    searchError,
    loadMoreError,
    isGenerating,
    generateError,
    deletingId,
  } = useSelector((state) => state.instructions);


  /*
   * ==========================================================
   * ROUTE SCROLL RESET
   * ==========================================================
   *
   * React Router сам не обязан возвращать
   * новый route к началу страницы.
   *
   * Сбрасываем позицию ДО отрисовки кадра,
   * чтобы пользователь не увидел старое
   * compact-состояние sticky-header.
   */
  useLayoutEffect(() => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    });

    document.documentElement.scrollTop =
      0;

    document.body.scrollTop =
      0;

  }, [
    location.pathname
  ]);


  //         .
  /*
   * ==========================================================
   * BOYKOVDOCS INITIAL SEARCH
   * ==========================================================
   *
   * Первый запрос и каждый новый поисковый запрос
   * всегда начинаются с первой страницы.
   */
  useEffect(() => {

    loadMoreLockRef.current =
      false;

    loadMoreArmedRef.current =
      true;


    dispatch(
      searchInstructions({
        query:
          debouncedQuery,

        page:
          1,

        pageSize:
          PAGE_SIZE,

        append:
          false
      })
    );

  }, [
    dispatch,
    debouncedQuery
  ]);


  /*
   * ==========================================================
   * MAIN ROUTE STICKY RESET
   * ==========================================================
   *
   * При любом route-переходе compact-состояние
   * сбрасывается до первого кадра.
   */
  useLayoutEffect(() => {

    setIsCompactHeader(
      false
    );


    if (
      location.pathname === "/"
    ) {

      loadMoreLockRef.current =
        false;

      loadMoreArmedRef.current =
        true;

    }

  }, [
    location.pathname
  ]);


  useEffect(() => {

    if (
      location.pathname !== "/"
    ) {
      setIsCompactHeader(false);
      return undefined;
    }

    const intro =
      stickyIntroRef.current;

    if (!intro) {
      setIsCompactHeader(false);
      return undefined;
    }

    let frameId =
      null;

    const update =
      () => {

        frameId =
          null;

        const top =
          intro
            .getBoundingClientRect()
            .top;

        setIsCompactHeader(
          (current) => {

            if (current) {

              if (
                top >= 16
              ) {
                return false;
              }

              return true;
            }

            if (
              top <= -4
            ) {
              return true;
            }

            return false;
          }
        );
      };

    const scheduleUpdate =
      () => {

        if (
          frameId !== null
        ) {
          return;
        }

        frameId =
          window.requestAnimationFrame(
            update
          );
      };

    update();

    window.addEventListener(
      "scroll",
      scheduleUpdate,
      {
        passive: true
      }
    );

    window.addEventListener(
      "resize",
      scheduleUpdate
    );

    return () => {

      window.removeEventListener(
        "scroll",
        scheduleUpdate
      );

      window.removeEventListener(
        "resize",
        scheduleUpdate
      );

      if (
        frameId !== null
      ) {
        window.cancelAnimationFrame(
          frameId
        );
      }
    };

  }, [
    location.pathname
  ]);


  const hasMore =
    resultPage <
    totalPages;


  useEffect(() => {

    loadMoreArmedRef.current =
      true;

  }, [
    debouncedQuery
  ]);


  const loadMore =
    useCallback(
      async () => {

        if (
          !loadMoreArmedRef.current
        ) {
          return;
        }


        if (
loadMoreLockRef.current ||
          isSearching ||
          isLoadingMore ||
          !hasMore
        ) {
          return;
        }


        loadMoreArmedRef.current =
          false;

        loadMoreLockRef.current =
          true;


        try {

          await dispatch(
            searchInstructions({
              query:
                debouncedQuery,

              page:
                resultPage + 1,

              pageSize:
                PAGE_SIZE,

              append:
                true
            })
          );

        }
        finally {

          loadMoreLockRef.current =
            false;

        }

      },
      [
        dispatch,
        debouncedQuery,
        resultPage,
        hasMore,
        isSearching,
        isLoadingMore
      ]
    );


  useEffect(() => {

    const target =
      loadMoreRef.current;


    if (
      !target ||
      !hasMore ||
      loadMoreError
    ) {
      return undefined;
    }


    const observer =
      new IntersectionObserver(
        ([entry]) => {

          /*
           * Новые карточки вытолкнули sentinel
           * за пределы viewport.
           *
           * Теперь пользователь может прокрутить
           * до него ещё раз и получить следующую страницу.
           */
          if (
            !entry.isIntersecting
          ) {
            loadMoreArmedRef.current =
              true;

            return;
          }


          if (
            entry.isIntersecting
          ) {
            void loadMore();
          }

        },
        {
          /*
           * Следующая порция начинает
           * загружаться заранее.
           */
          rootMargin:
            "120px 0px",

          threshold:
            0.01
        }
      );


    observer.observe(
      target
    );


    return () => {
      observer.disconnect();
    };

  }, [
    loadMore,
    hasMore,
    loadMoreError
  ]);


  async function handleGenerate() {
    if (!isAdmin) return;
    await dispatch(generateInstruction(debouncedQuery));
  }

  async function handleEditOpen(instruction) {

  const response = await fetch(
    `/api/instructions/${instruction.id}`
  );


  if (!response.ok) {
    return;
  }


  const fullInstruction = await response.json();


  setEditingInstruction(fullInstruction);

}

  function handleDelete(id) {
    if (!isAdmin) return;
    dispatch(deleteInstruction(id));
  }

  async function handleEditSave(updated) {

    if (
      !isAdmin ||
      !authToken
    ) {
      return;
    }


    try {

      await updateInstruction(
        updated.id,
        updated,
        authToken
      );


      setEditingInstruction(
        null
      );


      dispatch(
        searchInstructions({
          query:
            debouncedQuery,

          page:
            1,

          pageSize:
            PAGE_SIZE
        })
      );

    }
    catch(error) {

      console.error(
        "Instruction save error:",
        error
      );

    }

  }

  const showEmptyState = !isSearching && !searchError && debouncedQuery.trim() && items.length === 0;

  function handleImportRefresh(){

    dispatch(
        searchInstructions({
            query: debouncedQuery,
            page: 1,
            pageSize: PAGE_SIZE
        })
    );

}

return (
    <div
      className={
        styles.page
      }
    >

      <Header
        query={
          queryInput
        }
        onQueryChange={
          setQueryInput
        }
      />


      <AdminPanel
        importId={
          importId
        }
        onImportCreated={
          setImportId
        }
        onRefresh={
          handleImportRefresh
        }
      />


      <HomeCompactHeader
        visible={
          isCompactHeader
        }
        query={
          queryInput
        }
        onQueryChange={
          setQueryInput
        }
      />


      <div
        ref={
          stickyTriggerRef
        }
        className={
          styles.stickyTrigger
        }
        aria-hidden="true"
      />


      <HomeIntro
        query={
          queryInput
        }
        onQueryChange={
          setQueryInput
        }
        containerRef={
          stickyIntroRef
        }
      />


      <InstructionResults
        items={
          items
        }
        total={
          total
        }
        query={
          debouncedQuery
        }
        isAdmin={
          isAdmin
        }
        isSearching={
          isSearching
        }
        searchError={
          searchError
        }
        isLoadingMore={
          isLoadingMore
        }
        loadMoreError={
          loadMoreError
        }
        hasMore={
          hasMore
        }
        deletingId={
          deletingId
        }
        loadMoreRef={
          loadMoreRef
        }
        onLoadMore={
          loadMore
        }
        onDelete={
          handleDelete
        }
        onEdit={
          handleEditOpen
        }
        showEmptyState={
          showEmptyState
        }
        isGenerating={
          isGenerating
        }
        generateError={
          generateError
        }
        onGenerate={
          handleGenerate
        }
      />


      {
        editingInstruction &&
        (
          <EditInstructionModal
            instruction={
              editingInstruction
            }
            onClose={
              () =>
                setEditingInstruction(
                  null
                )
            }
            onSave={
              handleEditSave
            }
          />
        )
      }

    </div>
  );

}
