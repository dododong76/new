<h1>소개</h1>

<div class="about-content">
  <div class="profile">
    <h2>우리 회사 소개</h2>
    <p>
      우리 회사는 최신 웹 기술을 활용하여 혁신적인 솔루션을 제공하는 기업입니다.
      Svelte를 기반으로 한 웹 애플리케이션 개발에 특화되어 있으며,
      사용자 경험을 최우선으로 생각합니다.
    </p>
  </div>

  <div class="mission">
    <h2>미션</h2>
    <ul>
      <li>최고의 사용자 경험 제공</li>
      <li>혁신적인 기술 개발</li>
      <li>지속 가능한 성장</li>
      <li>고객 만족도 향상</li>
    </ul>
  </div>
</div>

<style>
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .about-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .profile, .mission {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  h2 {
    color: #444;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    line-height: 1.6;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    color: #666;
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
    position: relative;
  }

  li:before {
    content: "•";
    color: #333;
    position: absolute;
    left: 0;
  }
</style> 