import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../features/authSlice';

const ProtectedRoute = ({ children }) => {
    // Authentication check disabled for now
    return children;
};

export default ProtectedRoute;
