import {
  useState
} from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

import LoginModal from
  "../LoginModal/LoginModal.jsx";

import {
  logout,
  selectAuthUser,
  selectIsAdmin,
  selectIsRestoringSession
} from "../../store/authSlice.js";

import styles from
  "./AuthControl.module.css";


export default function AuthControl() {
  const dispatch =
    useDispatch();

  const isAdmin =
    useSelector(
      selectIsAdmin
    );

  const user =
    useSelector(
      selectAuthUser
    );

  const isRestoring =
    useSelector(
      selectIsRestoringSession
    );

  const [
    isModalOpen,
    setModalOpen
  ] =
    useState(false);


  if (isRestoring) {
    return null;
  }


  if (user) {
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
          {isAdmin
            ? `[ админ: ${user.login} ]`
            : `[ ${user.email || user.login} ]`}
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

      {isModalOpen && (
        <LoginModal
          onClose={
            () =>
              setModalOpen(
                false
              )
          }
        />
      )}
    </>
  );
}
