import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContainerPortal = () => (
  <ToastContainer
    position="top-left"
    rtl
    newestOnTop
    pauseOnFocusLoss
    pauseOnHover
    closeOnClick
    autoClose={4000}
    theme="dark"
  />
);

export default ToastContainerPortal;
