import {
  useEffect,
  useState
} from "react";

import {
  useSelector
} from "react-redux";

import ImportManager from "../ImportManager/ImportManager.jsx";
import AddInstructionButton from "../AddInstructionButton/AddInstructionButton.jsx";
import GenerateInstructionButton from "../GenerateInstructionButton/GenerateInstructionButton.jsx";
import AutoGenerationToggle from "../AutoGenerationToggle/AutoGenerationToggle.jsx";

import {
  selectAuthToken,
  selectIsAdmin
} from "../../store/authSlice.js";

import {
  getGenerationStats
} from "../../api/instructionsApi.js";

import AdminVisitorStats from "../AdminVisitorStats/AdminVisitorStats.jsx";
import AdminInstructionTop10 from "../AdminInstructionTop10/AdminInstructionTop10.jsx";
import AdminPromoCodes from "../AdminPromoCodes/AdminPromoCodes.jsx";
import AdminDashboardTabs from "../AdminDashboardTabs/AdminDashboardTabs.jsx";
import AdminPublicationInbox from "../AdminPublicationInbox/AdminPublicationInbox.jsx";
import AdminGenerationStats from "../AdminGenerationStats/AdminGenerationStats.jsx";
import styles from "./AdminPanel.module.css";


const ADMIN_DASHBOARD_TAB_KEY =
  "boykov_admin_dashboard_tab_v1";

const ADMIN_DASHBOARD_TABS = [
  "publications",
  "visitors",
  "top10",
  "promocodes"
];


function getInitialAdminDashboardTab() {

  try {

    const saved =
      window.localStorage
        .getItem(
          ADMIN_DASHBOARD_TAB_KEY
        );


    return ADMIN_DASHBOARD_TABS
      .includes(
        saved
      )
      ? saved
      : "publications";

  }
  catch {

    return "publications";

  }

}



export default function AdminPanel({

  importId,
  onImportCreated,
  onRefresh

}) {

  const isAdmin =
    useSelector(
      selectIsAdmin
    );

  const token =
    useSelector(
      selectAuthToken
    );



  const [
    adminDashboardTab,
    setAdminDashboardTab
  ] =
    useState(
      getInitialAdminDashboardTab
    );


  function changeAdminDashboardTab(
    nextTab
  ) {

    const valid =
      ADMIN_DASHBOARD_TABS
        .includes(
          nextTab
        );


    const value =
      valid
        ? nextTab
        : "publications";


    setAdminDashboardTab(
      value
    );


    try {

      window.localStorage
        .setItem(
          ADMIN_DASHBOARD_TAB_KEY,
          value
        );

    }
    catch {
      /* UI state persistence is optional */
    }

  }


  /*
   * ADMIN_PUBLICATION_INBOX_UI_V1
   */
  const [
    publicationInbox,
    setPublicationInbox
  ] =
    useState([]);

  const [
    publicationInboxLoading,
    setPublicationInboxLoading
  ] =
    useState(false);

  const [
    publicationInboxError,
    setPublicationInboxError
  ] =
    useState("");

  const [
    publicationReviewBusy,
    setPublicationReviewBusy
  ] =
    useState(null);

  const [
    selectedPublicationInstruction,
    setSelectedPublicationInstruction
  ] =
    useState(null);


  const [
    stats,
    setStats
  ] =
    useState(null);

  const [
    statsError,
    setStatsError
  ] =
    useState(null);


  useEffect(() => {

    if (
      !isAdmin ||
      !token
    ) {

      setStats(null);

      return;
    }


    let cancelled =
      false;


    async function loadStats() {

      try {

        const data =
          await getGenerationStats(
            token
          );

        if (!cancelled) {

          setStats(data);

          setStatsError(null);

        }

      }
      catch(error) {

        if (!cancelled) {

          setStatsError(
            error.message
          );

        }

      }

    }


    loadStats();

    /*
     * Пока генерация идёт, стоимость
     * обновляется автоматически.
     */
    const timer =
      setInterval(
        loadStats,
        15000
      );


    return () => {

      cancelled = true;

      clearInterval(timer);

    };

  }, [
    isAdmin,
    token
  ]);



  async function loadPublicationInbox(
    silent = false
  ) {

    if (
      !isAdmin ||
      !token
    ) {

      setPublicationInbox([]);

      return;
    }


    if (!silent) {

      setPublicationInboxLoading(
        true
      );

    }


    try {

      const response =
        await fetch(
          "/api/public-generation/admin/inbox",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            },

            cache:
              "no-store"
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (!response.ok) {

        throw new Error(
          data?.error ||
          "Не удалось загрузить ящик публикаций."
        );

      }


      setPublicationInbox(
        Array.isArray(
          data?.items
        )
          ? data.items
          : []
      );

      setPublicationInboxError(
        ""
      );

    }
    catch(error) {

      setPublicationInboxError(
        error?.message ||
        "Не удалось загрузить ящик публикаций."
      );

    }
    finally {

      if (!silent) {

        setPublicationInboxLoading(
          false
        );

      }

    }

  }


  useEffect(
    () => {

      if (
        !isAdmin ||
        !token
      ) {

        setPublicationInbox([]);

        return undefined;
      }


      loadPublicationInbox();


      const timer =
        setInterval(
          () => {

            loadPublicationInbox(
              true
            );

          },
          15000
        );


      return () => {

        clearInterval(
          timer
        );

      };

    },
    [
      isAdmin,
      token
    ]
  );


  async function reviewPublication(
    orderId,
    action
  ) {

    if (
      !token ||
      !orderId
    ) {
      return;
    }


    const isApprove =
      action ===
        "approve";


    const confirmed =
      window.confirm(
        isApprove
          ? "Опубликовать эту инструкцию в общем каталоге?"
          : "Отклонить публикацию этой инструкции?"
      );


    if (!confirmed) {
      return;
    }


    setPublicationReviewBusy(
      orderId
    );

    setPublicationInboxError(
      ""
    );


    try {

      const response =
        await fetch(
          `/api/public-generation/admin/orders/${encodeURIComponent(
            orderId
          )}/${action}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify({})
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (!response.ok) {

        throw new Error(
          data?.error ||
          "Не удалось изменить статус публикации."
        );

      }


      setPublicationInbox(
        current =>
          current.filter(
            item =>
              item.id !==
                orderId
          )
      );


      if (
        selectedPublicationInstruction
          ?.orderId ===
        orderId
      ) {

        setSelectedPublicationInstruction(
          null
        );

      }

    }
    catch(error) {

      setPublicationInboxError(
        error?.message ||
        "Не удалось изменить статус публикации."
      );

    }
    finally {

      setPublicationReviewBusy(
        null
      );

    }

  }


  return (

    <section className={styles.panel}>

      <div className={styles.actions}>

        <AddInstructionButton
          onImportCreated={
            onImportCreated
          }
        />

        <GenerateInstructionButton />
                  <AutoGenerationToggle />

          {/*
            ADMIN_PUBLICATION_BADGE_V1
          */}
          {
            isAdmin &&
            (
              <div
                className={
                  styles.publicationBadge
                }
                title="Инструкции, ожидающие решения о публикации"
              >

                <span
                  className={
                    styles.publicationBadgeLabel
                  }
                >
                  На публикацию
                </span>

                <strong
                  className={
                    styles.publicationBadgeCount
                  }
                >
                  {
                    publicationInbox.length
                  }
                </strong>

              </div>
            )
          }

      </div>

        {
          isAdmin &&
          (
            <AdminDashboardTabs
              activeTab={
                adminDashboardTab
              }
              onChange={
                changeAdminDashboardTab
              }
            />
          )
        }


      {
        isAdmin &&
        (
          <AdminPublicationInbox
            adminDashboardTab={
              adminDashboardTab
            }
            publicationInbox={
              publicationInbox
            }
            publicationInboxLoading={
              publicationInboxLoading
            }
            publicationInboxError={
              publicationInboxError
            }
            publicationReviewBusy={
              publicationReviewBusy
            }
            selectedPublicationInstruction={
              selectedPublicationInstruction
            }
            setSelectedPublicationInstruction={
              setSelectedPublicationInstruction
            }
            reviewPublication={
              reviewPublication
            }
          />
        )
      }




      {
        isAdmin &&
        token &&
        (
          <>

            <AdminVisitorStats
              token={
                token
              }
              hidden={
                adminDashboardTab !==
                  "visitors"
              }
            />


            <AdminInstructionTop10
              token={
                token
              }
              hidden={
                adminDashboardTab !==
                  "top10"
              }
            />

          </>
        )
      }


      {
        isAdmin &&
        (
          <AdminGenerationStats
            stats={
              stats
            }
            statsError={
              statsError
            }
          />
        )
      }


      {
        importId &&
        (
          <div className={styles.importBlock}>

            <ImportManager

              importId={
                importId
              }

              onComplete={() => {
                onImportCreated(null);
              }}

              onRefresh={
                onRefresh
              }

            />

          </div>
        )
      }


      {
        isAdmin &&
        token &&
        (
          <AdminPromoCodes
            token={
              token
            }
            hidden={
              adminDashboardTab !==
                "promocodes"
            }
          />
        )
      }

    </section>

  );
}
