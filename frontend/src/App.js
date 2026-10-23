import React from "react";
import {BrowserRouter,Navigate,Route,Routes} from "react-router-dom";
import Login from "./components/login";import Register from "./components/register";import AppShell from "./components/AppShell";import Home from "./pages/Home";import Saved from "./pages/Saved";import AddItem from "./pages/AddItem";import Profile from "./pages/Profile";import "./App.css";
function ProtectedApp(){return localStorage.getItem("token")?<AppShell/>:<Navigate to="/" replace/>}
export default function App(){return <BrowserRouter><Routes><Route path="/" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<ProtectedApp/>}><Route path="/home" element={<Home/>}/><Route path="/saved" element={<Saved/>}/><Route path="/add" element={<AddItem/>}/><Route path="/profile" element={<Profile/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter>}
