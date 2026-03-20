import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from "react-hot-toast";
import HomePage from './pages/home/index.js';
import './utils/tailwind.css';

const root = ReactDOM.createRoot(document.getElementById("bucksh0t"));
root.render(
    <>
      <Toaster toastOptions={{
        duration: 5000,
        style: {
          backgroundColor: "rgb(21, 21, 21)",
          color: "white",
          fontSize: "14px"
        }
        }} position="bottom-right" />
      <HomePage />
    </>
);
