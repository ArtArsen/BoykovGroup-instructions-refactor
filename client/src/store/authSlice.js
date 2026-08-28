import {
  login as loginRequest,
  register as registerRequest,
  fetchMe
} from "../api/authApi.js";


/*
 * Пока сохраняем историческое имя ключа.
 *
 * Некоторые существующие админские функции
 * читают его напрямую из localStorage.
 * Поэтому его переименование сейчас могло бы
 * сломать административные запросы.
 */
const TOKEN_STORAGE_KEY =
  "boykovgroup_admin_token";


const AUTH_START =
  "auth/start";

const AUTH_SUCCESS =
  "auth/success";

const AUTH_FAIL =
  "auth/fail";

const AUTH_LOGOUT =
  "auth/logout";

const AUTH_CLEAR_ERROR =
  "auth/clearError";


const initialState = {
  token: null,
  user: null,
  isRestoring: true,
  isAuthenticating: false,
  error: null
};


export function authReducer(
  state = initialState,
  action
) {
  switch (
    action.type
  ) {
    case AUTH_START:
      return {
        ...state,
        isAuthenticating:
          true,
        error:
          null
      };

    case AUTH_SUCCESS:
      return {
        ...state,
        isAuthenticating:
          false,
        isRestoring:
          false,
        token:
          action.payload.token,
        user:
          action.payload.user,
        error:
          null
      };

    case AUTH_FAIL:
      return {
        ...state,
        isAuthenticating:
          false,
        isRestoring:
          false,
        token:
          null,
        user:
          null,
        error:
          action.payload
      };

    case AUTH_LOGOUT:
      return {
        ...state,
        token:
          null,
        user:
          null,
        isRestoring:
          false,
        isAuthenticating:
          false,
        error:
          null
      };

    case AUTH_CLEAR_ERROR:
      return {
        ...state,
        error:
          null
      };

    default:
      return state;
  }
}


const authStart =
  () => ({
    type:
      AUTH_START
  });

const authSuccess =
  (
    token,
    user
  ) => ({
    type:
      AUTH_SUCCESS,
    payload: {
      token,
      user
    }
  });

const authFail =
  (message) => ({
    type:
      AUTH_FAIL,
    payload:
      message
  });


function persistAuth(
  data,
  dispatch
) {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    data.token
  );

  dispatch(
    authSuccess(
      data.token,
      data.user
    )
  );
}


/*
 * Вход администратора или пользователя.
 */
export function login(
  loginValue,
  password
) {
  return async (
    dispatch
  ) => {
    dispatch(
      authStart()
    );

    try {
      const data =
        await loginRequest(
          loginValue,
          password
        );

      persistAuth(
        data,
        dispatch
      );

      return true;
    } catch (error) {
      dispatch(
        authFail(
          error.message
        )
      );

      return false;
    }
  };
}


/*
 * Регистрация обычного пользователя.
 * Backend сразу возвращает JWT,
 * поэтому регистрация автоматически
 * авторизует пользователя.
 */
export function register(
  email,
  password
) {
  return async (
    dispatch
  ) => {
    dispatch(
      authStart()
    );

    try {
      const data =
        await registerRequest(
          email,
          password
        );

      persistAuth(
        data,
        dispatch
      );

      return true;
    } catch (error) {
      dispatch(
        authFail(
          error.message
        )
      );

      return false;
    }
  };
}


export function clearAuthError() {
  return {
    type:
      AUTH_CLEAR_ERROR
  };
}


export function logout() {
  return (
    dispatch
  ) => {
    localStorage.removeItem(
      TOKEN_STORAGE_KEY
    );

    dispatch({
      type:
        AUTH_LOGOUT
    });
  };
}


/*
 * Восстановление сессии после F5.
 * Работает одинаково для admin и user.
 */
export function restoreSession() {
  return async (
    dispatch
  ) => {
    const token =
      localStorage.getItem(
        TOKEN_STORAGE_KEY
      );

    if (!token) {
      dispatch({
        type:
          AUTH_LOGOUT
      });

      return;
    }

    try {
      const data =
        await fetchMe(
          token
        );

      dispatch(
        authSuccess(
          token,
          data.user
        )
      );
    } catch {
      localStorage.removeItem(
        TOKEN_STORAGE_KEY
      );

      dispatch({
        type:
          AUTH_LOGOUT
      });
    }
  };
}


export const selectAuthToken =
  (state) =>
    state.auth.token;

export const selectAuthUser =
  (state) =>
    state.auth.user;

export const selectIsAdmin =
  (state) =>
    state.auth.user?.role ===
    "admin";

export const selectIsUser =
  (state) =>
    state.auth.user?.role ===
    "user";

export const selectIsAuthenticated =
  (state) =>
    Boolean(
      state.auth.user &&
      state.auth.token
    );

export const selectIsAuthenticating =
  (state) =>
    state.auth.isAuthenticating;

export const selectIsRestoringSession =
  (state) =>
    state.auth.isRestoring;

export const selectAuthError =
  (state) =>
    state.auth.error;
