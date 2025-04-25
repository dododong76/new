<script>
  import { page } from '$app/stores';
</script>

<nav>
  <ul>
    <li class:active={$page.url.pathname === '/'}>
      <a href="/">홈</a>
    </li>
    <li class:active={$page.url.pathname === '/about'}>
      <a href="/about">소개</a>
    </li>
    <li class:active={$page.url.pathname === '/contact'}>
      <a href="/contact">연락처</a>
    </li>
    <li class:active={$page.url.pathname === '/game'}>
      <a href="/game">게임</a>
    </li>
    <li class:active={$page.url.pathname === '/students'}>
      <a href="/students">학생 관리</a>
    </li>
  </ul>
</nav>

<main>
  <slot />
</main>

<style>
  nav {
    background-color: #333;
    padding: 1rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1rem;
  }

  a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
  }

  a:hover {
    background-color: #555;
  }

  .active a {
    background-color: #666;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style> 