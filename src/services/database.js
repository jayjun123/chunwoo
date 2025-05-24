import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// 전체현장리스트 (데이터베이스 1)
export const sitesCollection = collection(db, 'sites');

// 기성현황 전체리스트 (데이터베이스 2)
export const progressCollection = collection(db, 'progress');

// 협의하기 (데이터베이스 3)
export const discussionsCollection = collection(db, 'discussions');

// 회원현황 및 메뉴권한 (데이터베이스 4)
export const usersCollection = collection(db, 'users');

// 전체현장리스트 관련 함수
export function subscribeToSites(callback) {
  return onSnapshot(collection(db, "sites"), callback);
}

export async function addSite(site) {
  await addDoc(collection(db, "sites"), site);
}

export async function updateSite(id, data) {
  await updateDoc(doc(db, "sites", id), data);
}

export async function deleteSite(id) {
  await deleteDoc(doc(db, "sites", id));
}

// 기성현황 관련 함수
export const addProgress = (progressData) => addDoc(progressCollection, progressData);
export const updateProgress = (id, data) => updateDoc(doc(progressCollection, id), data);
export const getProgressBySite = (siteId) => 
  query(progressCollection, where('siteId', '==', siteId));
export const subscribeToProgress = (callback) => 
  onSnapshot(progressCollection, callback);

// 협의하기 관련 함수
export const addDiscussion = (discussionData) => addDoc(discussionsCollection, discussionData);
export const getDiscussionsBySite = (siteId) => 
  query(discussionsCollection, where('siteId', '==', siteId));
export const subscribeToDiscussions = (callback) => 
  onSnapshot(discussionsCollection, callback);

// 회원관리 관련 함수
export const addUser = (userData) => addDoc(usersCollection, userData);
export const updateUser = (id, data) => updateDoc(doc(usersCollection, id), data);
export const getUserByEmail = (email) => 
  query(usersCollection, where('email', '==', email));
export const subscribeToUsers = (callback) => 
  onSnapshot(usersCollection, callback); 