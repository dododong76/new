<script>
  let formData = {
    name: '',
    studentPhone: '',
    parentPhone: '',
    email: '',
    message: ''
  };

  function handleSubmit() {
    // 폼 제출 로직
    alert('메시지가 전송되었습니다!');
    formData = {
      name: '',
      studentPhone: '',
      parentPhone: '',
      email: '',
      message: ''
    };
  }
</script>

<div class="contact-container">
  <div class="contact-header">
    <h1>연락하기</h1>
    <p>궁금하신 점이나 문의사항이 있으시다면 아래 양식을 작성해주세요.</p>
  </div>

  <div class="contact-content">
    <div class="contact-info">
      <div class="info-card">
        <i class="fas fa-envelope"></i>
        <h3>이메일</h3>
        <p>method917@naver.com</p>
      </div>
      <div class="info-card">
        <i class="fas fa-clock"></i>
        <h3>응답 시간</h3>
        <p>평일 09:00 - 18:00</p>
      </div>
      <div class="info-card">
        <i class="fas fa-map-marker-alt"></i>
        <h3>블로그</h3>
        <a href="https://blog.naver.com/method917" target="_blank">https://blog.naver.com/method917</a>
      </div>
    </div>

    <form class="contact-form" on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">이름</label>
        <input 
          type="text" 
          id="name" 
          bind:value={formData.name} 
          required
          placeholder="이름을 입력해주세요"
        />
      </div>

      <div class="form-group">
        <label for="studentPhone">학생 전화번호</label>
        <input 
          type="tel" 
          id="studentPhone" 
          bind:value={formData.studentPhone} 
          required
          placeholder="010-0000-0000"
          pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
        />
      </div>

      <div class="form-group">
        <label for="parentPhone">학부모 전화번호</label>
        <input 
          type="tel" 
          id="parentPhone" 
          bind:value={formData.parentPhone} 
          required
          placeholder="010-0000-0000"
          pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
        />
      </div>

      <div class="form-group">
        <label for="email">이메일</label>
        <input 
          type="email" 
          id="email" 
          bind:value={formData.email} 
          required
          placeholder="이메일을 입력해주세요"
        />
      </div>

      <div class="form-group">
        <label for="message">문의사항</label>
        <textarea 
          id="message" 
          bind:value={formData.message} 
          rows="5" 
          required
          placeholder="문의사항을 입력해주세요"
        ></textarea>
      </div>

      <button type="submit" class="submit-btn">
        메시지 보내기
      </button>
    </form>
  </div>
</div>

<style>
  .contact-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .contact-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .contact-header h1 {
    font-size: 2.5rem;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .contact-header p {
    color: #718096;
    font-size: 1.1rem;
  }

  .contact-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .info-card {
    background: #f7fafc;
    padding: 1.5rem;
    border-radius: 10px;
    text-align: center;
  }

  .info-card i {
    font-size: 1.5rem;
    color: #4299e1;
    margin-bottom: 1rem;
  }

  .info-card h3 {
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .info-card p, .info-card a {
    color: #718096;
    text-decoration: none;
  }

  .info-card a:hover {
    color: #4299e1;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    color: #4a5568;
    font-weight: 500;
  }

  .form-group input, .form-group textarea {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .submit-btn {
    background: #4299e1;
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-btn:hover {
    background: #3182ce;
  }

  @media (max-width: 768px) {
    .contact-content {
      grid-template-columns: 1fr;
    }

    .contact-info {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .info-card {
      flex: 1 1 calc(33.333% - 1rem);
      min-width: 200px;
    }
  }
</style> 