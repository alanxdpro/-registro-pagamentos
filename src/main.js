import './style.css';
import { auth, provider } from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { iniciarApp } from './app';

const loginBtn = document.getElementById("login-button");
const logoutBtn = document.getElementById("logout-button");
const appDiv = document.getElementById("app");
const filtrosDiv = document.getElementById("filtros");
const desfazerDiv = document.getElementById("desfazer-area");

const EMAIL_PERMITIDO = 'psxdpro@gmail.com'; // <-- coloque seu e-mail aqui

loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user && user.email !== EMAIL_PERMITIDO) {
    alert('Acesso não autorizado.');
    signOut(auth);
    return;
  }
  loginBtn.style.display = user ? "none" : "inline-block";
  logoutBtn.style.display = user ? "inline-block" : "none";
  appDiv.style.display = user ? "block" : "none";
  filtrosDiv.style.display = user ? "flex" : "none";
  desfazerDiv.style.display = user ? "flex" : "none";
  if (user) iniciarApp(user.uid);
});
