import {
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

import AdminVisitorStats from "../AdminVisitorStats/AdminVisitorStats.jsx";
import AdminInstructionTop10 from "../AdminInstructionTop10/AdminInstructionTop10.jsx";
import AdminPromoCodes from "../AdminPromoCodes/AdminPromoCodes.jsx";
import AdminDashboardTabs from "../AdminDashboardTabs/AdminDashboardTabs.jsx";
import AdminPublicationInbox from "../AdminPublicationInbox/AdminPublicationInbox.jsx";
import AdminGenerationStats from "../AdminGenerationStats/AdminGenerationStats.jsx";
import useAdminPublicationInbox from "./hooks/useAdminPublicationInbox.js";
import useAdminGenerationStats from "./hooks/useAdminGenerationStats.js";
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


  const {
    publicationInbox,
    publicationInboxLoading,
    publicationInboxError,
    publicationReviewBusy,

    selectedPublicationInstruction,
    setSelectedPublicationInstruction,

    reviewPublication
  } =
    useAdminPublicationInbox({
      isAdmin,
      token
    });


  const {
    stats,
    statsError
  } =
    useAdminGenerationStats({
      isAdmin,
      token
    });



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
