import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 전체현장리스트 (데이터베이스 1)
export const sitesCollection = collection(db, 'sites');

// 기성현황 전체리스트 (데이터베이스 2)
export const progressCollection = collection(db, 'progress');

// 협의하기 (데이터베이스 3)
export const discussionsCollection = collection(db, 'discussions');

// 회원현황 및 메뉴권한 (데이터베이스 4)
export const usersCollection = collection(db, 'users');

// 거래처현황 컬렉션
export const vendorsCollection = collection(db, 'vendors');

// 전체현장리스트 관련 함수
export function subscribeToSites(callback) {
  return onSnapshot(collection(db, "sites"), callback);
}

export async function addSite(site) {
  const docRef = await addDoc(sitesCollection, {
    ...site,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateSite(id, data) {
  const siteRef = doc(db, "sites", id);
  await updateDoc(siteRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSite(id) {
  await deleteDoc(doc(db, "sites", id));
}

// 기성현황 관련 함수
export async function addProgress(progress) {
  const docRef = await addDoc(progressCollection, {
    ...progress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateProgress(id, data) {
  const progressRef = doc(db, "progress", id);
  await updateDoc(progressRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteProgress(id) {
  await deleteDoc(doc(db, "progress", id));
}

export const getProgressBySite = (siteId) => 
  query(progressCollection, where('siteId', '==', siteId));

export const subscribeToProgress = (callback) => 
  onSnapshot(progressCollection, callback);

// 협의하기 관련 함수
export async function addDiscussion(discussion) {
  const docRef = await addDoc(discussionsCollection, {
    ...discussion,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateDiscussion(id, data) {
  const discussionRef = doc(db, "discussions", id);
  await updateDoc(discussionRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteDiscussion(id) {
  await deleteDoc(doc(db, "discussions", id));
}

export const getDiscussionsBySite = (siteId) => 
  query(discussionsCollection, where('siteId', '==', siteId));

export const subscribeToDiscussions = (callback) => 
  onSnapshot(discussionsCollection, callback);

// 회원관리 관련 함수
export const addUser = (userData) => addDoc(usersCollection, userData);
export async function updateUser(id, data) {
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export const getUserByEmail = (email) => 
  query(usersCollection, where('email', '==', email));

export const subscribeToUsers = (callback) => 
  onSnapshot(usersCollection, callback);

// 거래처현황 관련 함수
export async function addVendor(vendor) {
  const docRef = await addDoc(vendorsCollection, {
    ...vendor,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateVendor(id, data) {
  const vendorRef = doc(db, 'vendors', id);
  await updateDoc(vendorRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteVendor(id) {
  await deleteDoc(doc(db, 'vendors', id));
}

export const subscribeToVendors = (callback) => onSnapshot(vendorsCollection, callback);

// 모든 예시 데이터 삭제
export async function deleteAllExampleData() {
  try {
    // sites 컬렉션의 모든 문서 삭제
    const sitesSnapshot = await getDocs(sitesCollection);
    const sitesDeletePromises = sitesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(sitesDeletePromises);

    // progress 컬렉션의 모든 문서 삭제
    const progressSnapshot = await getDocs(progressCollection);
    const progressDeletePromises = progressSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(progressDeletePromises);

    // discussions 컬렉션의 모든 문서 삭제
    const discussionsSnapshot = await getDocs(discussionsCollection);
    const discussionsDeletePromises = discussionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(discussionsDeletePromises);

    console.log('모든 예시 데이터가 삭제되었습니다.');
  } catch (error) {
    console.error('데이터 삭제 중 오류 발생:', error);
    throw error;
  }
}

// 협의하기 이미지 업로드
export async function uploadDiscussionImage(file, userEmail) {
  const ext = file.name.split('.').pop();
  const fileName = `discussion/${userEmail}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
} 