import {
  useEffect,
  useState
} from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

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

import useHomeCompactHeader
  from "./hooks/useHomeCompactHeader.js";

import useInfiniteInstructions
  from "./hooks/useInfiniteInstructions.js";

import useInstructionEditor
  from "./hooks/useInstructionEditor.js";

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
  selectIsAdmin
} from "../../store/authSlice.js";

import {
  PAGE_SIZE
} from "../../constants.js";

import styles
  from "../../App.module.css";


export default function HomePage() {
  const dispatch = useDispatch();

  const isAdmin =
    useSelector(
      selectIsAdmin
    );

  const [importId,setImportId] = useState(null);
  const [queryInput, setQueryInput] = useState(
    () =>
      new URLSearchParams(
        window.location.search
      ).get("q") ?? ""
  );
  const {
    isCompactHeader,
    stickyIntroRef,
    stickyTriggerRef
  } =
    useHomeCompactHeader();
  const debouncedQuery = useDebouncedValue(queryInput, 350);

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


  //         .
  /*
   * ==========================================================
   * BOYKOVDOCS INITIAL SEARCH
   * ==========================================================
   *
   * Первый запрос и каждый новый поисковый запрос
   * всегда начинаются с первой страницы.
   */


  const {
    hasMore,
    loadMore,
    loadMoreRef
  } =
    useInfiniteInstructions({
      query:
        debouncedQuery,

      page:
        resultPage,

      totalPages,

      isSearching,
      isLoadingMore,
      loadMoreError
    });


  async function handleGenerate() {
    if (!isAdmin) return;
    await dispatch(generateInstruction(debouncedQuery));
  }

  function handleDelete(id) {
    if (!isAdmin) return;
    dispatch(deleteInstruction(id));
  }

  const {
    editingInstruction,
    openInstructionEditor,
    closeInstructionEditor,
    saveInstruction
  } =
    useInstructionEditor({
      query:
        debouncedQuery,

      isAdmin
    });


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
          openInstructionEditor
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
              closeInstructionEditor
            }
            onSave={
              saveInstruction
            }
          />
        )
      }

    </div>
  );

}
