import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// 하드코딩된 로그인 정보 제거
const users = [];

// Firebase Authentication을 사용한 로그인
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 마스터 권한 확인
    if (isMasterUser(user.email)) {
      user.isMaster = true;
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function register(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestore에 사용자 데이터 저장
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Firestore에서 유저 정보 가져오기
export async function getUserData(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error("Get user data error:", error);
    throw error;
  }
}

// 인증 상태 변경 감지
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// 기존 사용자들을 Firebase Authentication에 등록
export async function migrateUsers() {
  // 하드코딩된 사용자 정보 제거
  const users = [];

  for (const user of users) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: user.email,
        role: user.role,
        name: user.name,
        org: user.org,
        status: "승인",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`User ${user.email} migrated successfully`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists`);
      } else {
        console.error(`Error migrating user ${user.email}:`, error);
      }
    }
  }
} 