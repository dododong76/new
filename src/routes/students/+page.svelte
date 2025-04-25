<script>
  import { onMount } from 'svelte';

  let students = [];
  let formData = {
    name: '',
    student_phone: '',
    mother_phone: ''
  };
  let editingId = null;
  let error = '';

  async function fetchStudents() {
    try {
      const response = await fetch('/api/students');
      students = await response.json();
    } catch (e) {
      error = '학생 정보를 불러오는데 실패했습니다.';
    }
  }

  async function handleSubmit() {
    try {
      const url = editingId ? `/api/students` : '/api/students';
      const method = editingId ? 'PUT' : 'POST';
      const data = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchStudents();
        resetForm();
      } else {
        error = '저장에 실패했습니다.';
      }
    } catch (e) {
      error = '저장에 실패했습니다.';
    }
  }

  async function handleDelete(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch('/api/students', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id })
        });

        if (response.ok) {
          await fetchStudents();
        } else {
          error = '삭제에 실패했습니다.';
        }
      } catch (e) {
        error = '삭제에 실패했습니다.';
      }
    }
  }

  function handleEdit(student) {
    editingId = student.id;
    formData = { ...student };
  }

  function resetForm() {
    formData = {
      name: '',
      student_phone: '',
      mother_phone: ''
    };
    editingId = null;
  }

  onMount(fetchStudents);
</script>

<h1>학생 정보 관리</h1>

{#if error}
  <div class="error">{error}</div>
{/if}

<div class="form-container">
  <h2>{editingId ? '학생 정보 수정' : '새 학생 추가'}</h2>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="name">이름</label>
      <input
        type="text"
        id="name"
        bind:value={formData.name}
        required
      />
    </div>
    <div class="form-group">
      <label for="student_phone">학생 전화번호</label>
      <input
        type="tel"
        id="student_phone"
        bind:value={formData.student_phone}
        required
      />
    </div>
    <div class="form-group">
      <label for="mother_phone">어머니 전화번호</label>
      <input
        type="tel"
        id="mother_phone"
        bind:value={formData.mother_phone}
        required
      />
    </div>
    <div class="form-actions">
      <button type="submit">{editingId ? '수정' : '추가'}</button>
      {#if editingId}
        <button type="button" on:click={resetForm}>취소</button>
      {/if}
    </div>
  </form>
</div>

<div class="students-list">
  <h2>학생 목록</h2>
  <table>
    <thead>
      <tr>
        <th>이름</th>
        <th>학생 전화번호</th>
        <th>어머니 전화번호</th>
        <th>작업</th>
      </tr>
    </thead>
    <tbody>
      {#each students as student}
        <tr>
          <td>{student.name}</td>
          <td>{student.student_phone}</td>
          <td>{student.mother_phone}</td>
          <td>
            <button on:click={() => handleEdit(student)}>수정</button>
            <button on:click={() => handleDelete(student.id)}>삭제</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .error {
    color: red;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    border-radius: 4px;
  }

  .form-container {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    background-color: #333;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background-color: #444;
  }

  .students-list {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  @media (max-width: 768px) {
    .form-actions {
      flex-direction: column;
    }

    button {
      width: 100%;
    }

    table {
      display: block;
      overflow-x: auto;
    }
  }
</style> 