<h1>연락처</h1>

<div class="contact-container">
  <div class="contact-info">
    <h2>연락처 정보</h2>
    <div class="info-item">
      <h3>주소</h3>
      <p>서울특별시 강남구 테헤란로 123</p>
    </div>
    <div class="info-item">
      <h3>전화</h3>
      <p>02-123-4567</p>
    </div>
    <div class="info-item">
      <h3>이메일</h3>
      <p>contact@example.com</p>
    </div>
  </div>

  <form class="contact-form">
    <h2>문의하기</h2>
    <div class="form-group">
      <label for="name">이름</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-group">
      <label for="email">이메일</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="message">메시지</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit">보내기</button>
  </form>
</div>

<style>
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .contact-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
  }

  .contact-info, .contact-form {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  h2 {
    color: #444;
    margin-bottom: 1.5rem;
  }

  .info-item {
    margin-bottom: 1.5rem;
  }

  h3 {
    color: #555;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
    margin: 0;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
  }

  input, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  button {
    background-color: #333;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background-color: #444;
  }

  @media (max-width: 768px) {
    .contact-container {
      grid-template-columns: 1fr;
    }
  }
</style> 