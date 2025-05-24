import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function logout() {
  return signOut(auth);
}
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// 회원가입 + Firestore users 등록
export async function signup({ email, password, name, org }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    name,
    org,
    role: "user",
    status: "요청",
    createdAt: new Date().toISOString()
  });
  return user;
}

// Firestore에서 유저 정보 가져오기
export async function getUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
} 