import {
  useDispatch
} from "react-redux";
import LoginModal from
  "../LoginModal/LoginModal.jsx";

import {
  logout
} from "../../store/authSlice.js";

import useAuthControl
  from "./hooks/useAuthControl.js";

import styles from
  "./AuthControl.module.css";


export default function AuthControl() {

  const dispatch =
    useDispatch();

  const {
    isAdmin,
    user,
    isRestoring,
    isModalOpen,
    setModalOpen,
    isMenuOpen,
    setMenuOpen,
    dropdownRef
  } =
    useAuthControl();


  if (isRestoring) {
    return null;
  }


  /*
   * Админскую панель не меняем.
   */
  if (
    user &&
    isAdmin
  ) {

    return (
      <div
        className={
          styles.wrapper
        }
      >

        <span
          className={
            styles.badge
          }
        >
          [ админ: {user.login} ]
        </span>


        <button
          type="button"
          className={
            styles.logoutBtn
          }
          onClick={
            () =>
              dispatch(
                logout()
              )
          }
        >
          выйти
        </button>

      </div>
    );

  }


  /*
   * Обычный пользователь:
   * нормальный React dropdown вместо
   * production MutationObserver patch.
   */
  if (user) {

    const accountName =
      user.email ||
      user.login ||
      "аккаунт";


    return (
      <div
        ref={
          dropdownRef
        }
        className={
          styles.accountDropdown
        }
      >

        <button
          type="button"
          className={
            styles.accountTrigger
          }
          aria-haspopup="menu"
          aria-expanded={
            isMenuOpen
          }
          onClick={
            (event) => {

              event.stopPropagation();

              setMenuOpen(
                current =>
                  !current
              );

            }
          }
        >

          <span
            className={
              styles.accountTriggerEmail
            }
          >
            [ {accountName} ]
          </span>


          <span
            className={
              styles.accountTriggerChevron
            }
            aria-hidden="true"
          >
            ▾
          </span>

        </button>


        <div
          className={
            styles.accountMenu
          }
          hidden={
            !isMenuOpen
          }
          role="menu"
        >

          <div
            className={
              styles.accountMenuHead
            }
          >

            <div
              className={
                styles.accountMenuLabel
              }
            >
              АККАУНТ
            </div>


            <div
              className={
                styles.accountMenuEmail
              }
            >
              {accountName}
            </div>

          </div>


          <div
            className={
              styles.accountMenuDivider
            }
          />


          <a
            href="/account/"
            className={
              styles.accountMenuItem
            }
            role="menuitem"
            onClick={
              () =>
                setMenuOpen(
                  false
                )
            }
          >

            <span>
              Личный кабинет
            </span>


            <span
              className={
                styles.accountMenuArrow
              }
            >
              →
            </span>

          </a>


          <button
            type="button"
            className={[
              styles.accountMenuItem,
              styles.accountMenuLogout
            ]
              .filter(Boolean)
              .join(" ")}
            role="menuitem"
            onClick={
              () => {

                setMenuOpen(
                  false
                );

                dispatch(
                  logout()
                );

              }
            }
          >
            Выйти
          </button>

        </div>

      </div>
    );

  }


  return (
    <>

      <button
        type="button"
        className={
          styles.loginBtn
        }
        onClick={
          () =>
            setModalOpen(
              true
            )
        }
      >
        войти / регистрация
      </button>


      {
        isModalOpen &&
        (
          <LoginModal
            onClose={
              () =>
                setModalOpen(
                  false
                )
            }
          />
        )
      }

    </>
  );

}
