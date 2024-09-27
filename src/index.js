/*
 * @Author: Azhou
 * @Date: 2021-05-10 21:41:22
 * @LastEditors: Azhou
 * @LastEditTime: 2021-05-11 23:20:18
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";
import App from './App';
import store from './redux/store';

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./language/en.json";
import zh from "./language/zh.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: "zh",
    fallbackLng: "zh",
    interpolation: {
      escapeValue: false
    }
  });

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
