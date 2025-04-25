<script>
  let targetNumber = Math.floor(Math.random() * 100) + 1;
  let guess = '';
  let message = '';
  let attempts = 0;
  let gameOver = false;

  function checkGuess() {
    attempts++;
    const numGuess = parseInt(guess);
    
    if (isNaN(numGuess)) {
      message = '숫자를 입력해주세요!';
      return;
    }

    if (numGuess < 1 || numGuess > 100) {
      message = '1부터 100 사이의 숫자를 입력해주세요!';
      return;
    }

    if (numGuess === targetNumber) {
      message = `축하합니다! ${attempts}번 만에 맞췄습니다!`;
      gameOver = true;
    } else if (numGuess < targetNumber) {
      message = '더 큰 숫자입니다!';
    } else {
      message = '더 작은 숫자입니다!';
    }
  }

  function resetGame() {
    targetNumber = Math.floor(Math.random() * 100) + 1;
    guess = '';
    message = '';
    attempts = 0;
    gameOver = false;
  }
</script>

<h1>숫자 맞추기 게임</h1>

<div class="game-container">
  <div class="game-info">
    <p>1부터 100 사이의 숫자를 맞춰보세요!</p>
    <p>시도 횟수: {attempts}</p>
    {#if message}
      <p class="message">{message}</p>
    {/if}
  </div>

  <div class="game-controls">
    {#if !gameOver}
      <input
        type="number"
        bind:value={guess}
        placeholder="숫자를 입력하세요"
        min="1"
        max="100"
      />
      <button on:click={checkGuess}>확인</button>
    {:else}
      <button on:click={resetGame}>새 게임</button>
    {/if}
  </div>
</div>

<style>
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .game-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: #f5f5f5;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .game-info {
    margin-bottom: 2rem;
  }

  .game-info p {
    color: #666;
    margin: 0.5rem 0;
  }

  .message {
    font-weight: bold;
    color: #333;
    margin-top: 1rem !important;
  }

  .game-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
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

  @media (max-width: 480px) {
    .game-controls {
      flex-direction: column;
    }

    input, button {
      width: 100%;
    }
  }
</style> 