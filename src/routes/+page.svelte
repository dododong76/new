<h1>환영합니다!</h1>
<p>이 웹사이트는 SvelteKit으로 만들어진 예제입니다.</p>

<div class="features">
  <div class="feature">
    <h2>빠른 성능</h2>
    <p>Svelte의 컴파일러 기반 접근 방식으로 빠른 웹 애플리케이션을 구축할 수 있습니다.</p>
  </div>
  <div class="feature">
    <h2>간단한 문법</h2>
    <p>기존 프레임워크보다 더 적은 코드로 더 많은 것을 할 수 있습니다.</p>
  </div>
  <div class="feature">
    <h2>반응형</h2>
    <p>반응형 데이터 처리가 매우 직관적이고 쉽습니다.</p>
  </div>
</div>

<style>
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }

  .feature {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .feature h2 {
    color: #444;
    margin-bottom: 1rem;
  }

  .feature p {
    color: #666;
    line-height: 1.6;
  }
</style>
