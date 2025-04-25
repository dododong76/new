import { json } from "@sveltejs/kit";
import { db } from "$lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export async function GET() {
  try {
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const students = studentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return json(students);
  } catch (error) {
    return json(
      { error: "학생 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST({ request }) {
  try {
    const { name, student_phone, mother_phone } = await request.json();
    const docRef = await addDoc(collection(db, "students"), {
      name,
      student_phone,
      mother_phone,
    });
    return json({ id: docRef.id });
  } catch (error) {
    return json(
      { error: "학생 정보를 저장하는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT({ request }) {
  try {
    const { id, name, student_phone, mother_phone } = await request.json();
    await updateDoc(doc(db, "students", id), {
      name,
      student_phone,
      mother_phone,
    });
    return json({ success: true });
  } catch (error) {
    return json(
      { error: "학생 정보를 수정하는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE({ request }) {
  try {
    const { id } = await request.json();
    await deleteDoc(doc(db, "students", id));
    return json({ success: true });
  } catch (error) {
    return json(
      { error: "학생 정보를 삭제하는데 실패했습니다." },
      { status: 500 }
    );
  }
}
