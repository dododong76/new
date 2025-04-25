<script>
  import { onMount } from 'svelte';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFDocument } from 'pdf-lib';

  let pdfFile = null;
  let searchText = '';
  let fileName = '';
  let errorMessage = '';
  let pdfContent = '';
  let pdfUrl = '';
  let loading = false;
  let canvas;
  let canvasContainer;
  let currentPage = 1;
  let numPages = 0;
  let scale = 1.5;
  let pdfDoc = null;
  let tetrisBoard = Array(20).fill().map(() => Array(10).fill(0));
  let currentPiece = null;
  let currentPiecePosition = { x: 0, y: 0 };
  let gameInterval;
  let gameOver = false;
  let score = 0;
  let isPaused = false;

  const PIECES = [
    // I piece
    [[1, 1, 1, 1]],
    // O piece
    [[1, 1], [1, 1]],
    // T piece
    [[0, 1, 0], [1, 1, 1]],
    // L piece
    [[1, 0], [1, 0], [1, 1]],
    // J piece
    [[0, 1], [0, 1], [1, 1]],
    // S piece
    [[0, 1, 1], [1, 1, 0]],
    // Z piece
    [[1, 1, 0], [0, 1, 1]]
  ];

  const COLORS = [
    '#000000', // empty cell
    '#00f0f0', // cyan
    '#f0f000', // yellow
    '#a000f0', // purple
    '#f0a000', // orange
    '#0000f0', // blue
    '#00f000', // green
    '#f00000'  // red
  ];

  onMount(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return () => {
      if (gameInterval) {
        clearInterval(gameInterval);
        window.removeEventListener('keydown', handleKeyPress);
      }
    };
  });

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        pdfFile = file;
        fileName = file.name;
        errorMessage = '';
        await loadPdfContent();
      } else {
        pdfFile = null;
        fileName = '';
        errorMessage = 'PDF 파일만 업로드 가능합니다.';
      }
    }
  }

  async function loadPdfContent() {
    try {
      loading = true;
      errorMessage = '';
      
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
      });
      
      pdfDoc = await loadingTask.promise;
      numPages = pdfDoc.numPages;
      
      // 텍스트 추출 개선
      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        // 텍스트 아이템을 위치 정보와 함께 저장
        const textItems = textContent.items.map(item => ({
          text: item.str.normalize('NFC'),
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height
        }));

        // y좌표로 정렬하여 같은 줄의 텍스트끼리 그룹화
        const lineThreshold = 5; // 같은 줄로 인식할 y좌표 차이 임계값
        const lines = [];
        let currentLine = [];
        
        textItems.sort((a, b) => b.y - a.y).forEach(item => {
          if (currentLine.length === 0) {
            currentLine.push(item);
          } else {
            const lastItem = currentLine[currentLine.length - 1];
            if (Math.abs(lastItem.y - item.y) < lineThreshold) {
              currentLine.push(item);
            } else {
              // x좌표로 정렬하여 같은 줄의 텍스트를 왼쪽에서 오른쪽으로 정렬
              currentLine.sort((a, b) => a.x - b.x);
              lines.push(currentLine);
              currentLine = [item];
            }
          }
        });
        
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          lines.push(currentLine);
        }

        // 각 줄의 텍스트를 결합
        const pageText = lines.map(line => {
          return line.map(item => {
            // 불필요한 공백 제거 후 텍스트 반환
            return item.text.trim();
          }).join('');
        }).join('\n');

        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
      }
      
      pdfContent = fullText.trim();
      console.log('추출된 텍스트:', pdfContent); // 디버깅용
      
      // 첫 페이지 렌더링
      await renderPage(1);
      
    } catch (error) {
      errorMessage = '파일을 처리하는 중 오류가 발생했습니다: ' + error.message;
      console.error('PDF 처리 오류:', error);
    } finally {
      loading = false;
    }
  }

  async function renderPage(pageNum, alternativeSearchText = null) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      if (!canvas) return;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enhanceTextSelection: true
      };
      
      // PDF 페이지 렌더링
      await page.render(renderContext).promise;
      
      // 하이라이트 처리
      if (searchText || alternativeSearchText) {
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        const searchPattern = (alternativeSearchText || searchText).normalize('NFC').toLowerCase().trim();
        
        // 밝은 노란색 배경으로 변경
        context.fillStyle = '#fff94c';
        
        for (const item of textContent.items) {
          const itemText = item.str.normalize('NFC').toLowerCase();
          
          if (itemText.includes(searchPattern)) {
            const transform = viewport.transform;
            const tx = transform[0] * item.transform[4] + transform[2] * item.transform[5] + transform[4];
            const ty = transform[1] * item.transform[4] + transform[3] * item.transform[5] + transform[5];
            
            // 하이라이트 영역을 약간 키워서 텍스트를 완전히 덮도록 함
            const padding = 2;
            context.fillRect(
              tx - padding,
              ty - (item.height * scale) - padding,
              (item.width * scale) + (padding * 2),
              (item.height * scale) + (padding * 2)
            );
          }
        }
      }
      
      currentPage = pageNum;
    } catch (error) {
      console.error('페이지 렌더링 오류:', error);
    }
  }

  // 텍스트 아이템 하이라이트 함수 이름 변경
  function drawHighlight(item, viewport, context) {
    const transform = viewport.transform;
    const [x, y] = applyTransform(item.transform, transform);
    
    context.fillRect(
      x,
      y - item.height,
      item.width * viewport.scale,
      item.height * viewport.scale
    );
  }

  function applyTransform(itemTransform, viewportTransform) {
    const x = itemTransform[4];
    const y = itemTransform[5];
    return [
      x * viewportTransform[0] + viewportTransform[4],
      y * viewportTransform[3] + viewportTransform[5]
    ];
  }

  async function handleHighlight() {
    if (!pdfFile) {
      errorMessage = 'PDF 파일을 먼저 업로드해주세요.';
      return;
    }
    
    if (!searchText.trim()) {
      errorMessage = '하이라이트할 텍스트를 입력해주세요.';
      return;
    }

    try {
      loading = true;
      errorMessage = '';

      // 이전 하이라이트 제거
      if (canvasContainer) {
        const oldTextLayer = canvasContainer.querySelector('div');
        if (oldTextLayer) {
          canvasContainer.removeChild(oldTextLayer);
        }
      }

      // 검색 로직 개선
      const normalizedSearchText = searchText.normalize('NFC').toLowerCase().trim();
      const contentText = pdfContent.normalize('NFC').toLowerCase();
      
      console.log('검색할 텍스트:', normalizedSearchText);
      console.log('문서 내용:', contentText);

      // 정확한 검색을 위해 특수문자와 공백을 처리
      const cleanSearchText = normalizedSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 부분 일치 검색을 위한 정규식
      const partialRegex = new RegExp(cleanSearchText, 'gi');
      const matches = contentText.match(partialRegex) || [];
      
      if (matches.length === 0) {
        // 단어 단위로 분리하여 검색
        const words = normalizedSearchText.split(/\s+/).filter(word => word.length > 1);
        let found = false;
        
        for (const word of words) {
          const cleanWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(cleanWord, 'gi');
          const wordMatches = contentText.match(wordRegex) || [];
          
          if (wordMatches.length > 0) {
            found = true;
            errorMessage = `"${searchText}"와 정확히 일치하는 텍스트는 없지만, "${word}"가 ${wordMatches.length}개 발견되었습니다.`;
            await renderPage(currentPage, word);
            break;
          }
        }
        
        if (!found) {
          errorMessage = '검색된 텍스트가 없습니다.';
          return;
        }
      } else {
        errorMessage = `"${searchText}"가 총 ${matches.length}개 발견되었습니다.`;
        await renderPage(currentPage);
      }
      
    } catch (error) {
      errorMessage = '하이라이트 처리 중 오류가 발생했습니다: ' + error.message;
      console.error('하이라이트 오류:', error);
    } finally {
      loading = false;
    }
  }

  async function handlePrevPage() {
    if (currentPage > 1) {
      await renderPage(currentPage - 1);
    }
  }

  async function handleNextPage() {
    if (currentPage < numPages) {
      await renderPage(currentPage + 1);
    }
  }

  async function handleDownload() {
    try {
      loading = true;
      errorMessage = '';

      // 캔버스 내용을 이미지로 변환
      const imageData = canvas.toDataURL('image/png');
      
      // 새 PDF 문서 생성
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      
      // 이미지를 PDF에 삽입
      const image = await pdfDoc.embedPng(imageData);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
      
      // PDF 파일 저장
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a');
      link.href = url;
      link.download = `highlighted_${fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      errorMessage = '하이라이트된 PDF가 다운로드되었습니다.';
    } catch (error) {
      errorMessage = 'PDF 다운로드 중 오류가 발생했습니다: ' + error.message;
      console.error('다운로드 오류:', error);
    } finally {
      loading = false;
    }
  }

  function getRandomPiece() {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: piece,
      color: Math.floor(Math.random() * (COLORS.length - 1)) + 1
    };
  }

  function startGame() {
    if (gameInterval) return;
    resetGame();
    spawnPiece();
    gameInterval = setInterval(gameLoop, 1000);
    window.addEventListener('keydown', handleKeyPress);
  }

  function resetGame() {
    tetrisBoard = Array(20).fill().map(() => Array(10).fill(0));
    currentPiece = null;
    currentPiecePosition = { x: 0, y: 0 };
    gameOver = false;
    score = 0;
    isPaused = false;
  }

  function pauseGame() {
    if (gameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
      clearInterval(gameInterval);
      gameInterval = null;
    } else {
      gameInterval = setInterval(gameLoop, 1000);
    }
  }

  function spawnPiece() {
    currentPiece = getRandomPiece();
    currentPiecePosition = {
      x: Math.floor((10 - currentPiece.shape[0].length) / 2),
      y: 0
    };

    if (!canMove(0, 0)) {
      gameOver = true;
      clearInterval(gameInterval);
      window.removeEventListener('keydown', handleKeyPress);
    }
  }

  function canMove(deltaX, deltaY) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const newX = currentPiecePosition.x + x + deltaX;
          const newY = currentPiecePosition.y + y + deltaY;
          
          if (newX < 0 || newX >= 10 || newY >= 20) return false;
          if (newY >= 0 && tetrisBoard[newY][newX]) return false;
        }
      }
    }
    return true;
  }

  function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiecePosition.y + y;
          if (boardY >= 0) {
            tetrisBoard[boardY][currentPiecePosition.x + x] = currentPiece.color;
          }
        }
      }
    }
  }

  function clearLines() {
    let linesCleared = 0;
    for (let y = 19; y >= 0; y--) {
      if (tetrisBoard[y].every(cell => cell !== 0)) {
        tetrisBoard.splice(y, 1);
        tetrisBoard.unshift(Array(10).fill(0));
        linesCleared++;
        y++;
      }
    }
    if (linesCleared > 0) {
      score += [0, 100, 300, 500, 800][linesCleared];
    }
  }

  function rotatePiece() {
    const rotated = Array(currentPiece.shape[0].length).fill()
      .map((_, i) => currentPiece.shape.map(row => row[row.length - 1 - i]));
    
    const originalPiece = currentPiece.shape;
    currentPiece.shape = rotated;
    
    if (!canMove(0, 0)) {
      currentPiece.shape = originalPiece;
    }
  }

  function gameLoop() {
    if (gameOver || isPaused) return;
    
    if (canMove(0, 1)) {
      currentPiecePosition.y++;
    } else {
      mergePiece();
      clearLines();
      spawnPiece();
    }
    tetrisBoard = [...tetrisBoard];
  }

  function handleKeyPress(event) {
    if (gameOver || isPaused) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        if (canMove(-1, 0)) currentPiecePosition.x--;
        break;
      case 'ArrowRight':
        if (canMove(1, 0)) currentPiecePosition.x++;
        break;
      case 'ArrowDown':
        if (canMove(0, 1)) currentPiecePosition.y++;
        break;
      case 'ArrowUp':
        rotatePiece();
        break;
    }
    tetrisBoard = [...tetrisBoard];
  }
</script>

<div class="container">
  <div class="header">
    <h1>PDF 자동 하이라이터</h1>
    <p>PDF 파일을 업로드하고 하이라이트하고 싶은 단어를 입력하세요.</p>
  </div>

  <div class="content">
    <div class="upload-section">
      <div class="file-upload">
        <i class="fas fa-file-pdf"></i>
        <h3>PDF 파일 업로드</h3>
        <label for="pdf-upload" class="upload-btn">
          파일 선택
        </label>
        <input 
          type="file" 
          accept=".pdf" 
          on:change={handleFileUpload} 
          id="pdf-upload"
          class="file-input"
        />
        {#if fileName}
          <p class="file-name">{fileName}</p>
        {/if}
      </div>

      <div class="highlight-section">
        <div class="input-group">
          <label for="highlight-text">하이라이트할 텍스트</label>
          <input 
            type="text" 
            id="highlight-text"
            bind:value={searchText}
            placeholder="하이라이트할 단어나 문구를 입력하세요"
            class="highlight-input"
          />
        </div>

        <div class="button-group">
          <button 
            class="highlight-btn" 
            on:click={handleHighlight}
            disabled={loading}
          >
            {loading ? '처리중...' : '하이라이트 시작'}
          </button>

          <button 
            class="download-btn" 
            on:click={handleDownload}
            disabled={loading || !pdfDoc}
          >
            PDF 다운로드
          </button>
        </div>
      </div>

      {#if errorMessage}
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {errorMessage}
        </div>
      {/if}
    </div>

    <div class="pdf-viewer">
      <div class="canvas-container" bind:this={canvasContainer}>
        <canvas bind:this={canvas}></canvas>
      </div>
      
      {#if pdfDoc}
        <div class="page-controls">
          <button 
            on:click={handlePrevPage} 
            disabled={currentPage === 1}
          >
            이전 페이지
          </button>
          <span>{currentPage} / {numPages}</span>
          <button 
            on:click={handleNextPage} 
            disabled={currentPage === numPages}
          >
            다음 페이지
          </button>
        </div>
      {/if}
    </div>

    <div class="info-section">
      <div class="info-card">
        <i class="fas fa-info-circle"></i>
        <h3>사용 방법</h3>
        <ol>
          <li>PDF 파일을 업로드합니다.</li>
          <li>하이라이트하고 싶은 텍스트를 입력합니다.</li>
          <li>'하이라이트 시작' 버튼을 클릭합니다.</li>
          <li>'PDF 다운로드' 버튼을 클릭하여 하이라이트된 PDF를 저장합니다.</li>
        </ol>
      </div>
      
      <div class="info-card tetris-game">
        <h3>테트리스 게임</h3>
        <div class="game-container">
          <div class="game-board">
            {#each tetrisBoard as row, y}
              <div class="row">
                {#each row as cell, x}
                  <div 
                    class="cell"
                    style="background-color: {
                      currentPiece && 
                      y >= currentPiecePosition.y && 
                      y < currentPiecePosition.y + currentPiece.shape.length &&
                      x >= currentPiecePosition.x &&
                      x < currentPiecePosition.x + currentPiece.shape[0].length &&
                      currentPiece.shape[y - currentPiecePosition.y][x - currentPiecePosition.x]
                        ? COLORS[currentPiece.color]
                        : COLORS[cell]
                    }"
                  />
                {/each}
              </div>
            {/each}
          </div>
          <div class="game-info">
            <p>점수: {score}</p>
            {#if gameOver}
              <p class="game-over">게임 오버!</p>
            {/if}
            <div class="game-controls">
              <button on:click={startGame} disabled={gameInterval && !gameOver}>
                {gameOver ? '다시 시작' : '게임 시작'}
              </button>
              <button on:click={pauseGame} disabled={!gameInterval || gameOver}>
                {isPaused ? '계속하기' : '일시정지'}
              </button>
            </div>
            <div class="game-instructions">
              <p>조작 방법:</p>
              <ul>
                <li>← → : 좌우 이동</li>
                <li>↑ : 회전</li>
                <li>↓ : 빠른 하강</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .header p {
    color: #718096;
    font-size: 1.1rem;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .upload-section {
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .file-upload {
    text-align: center;
    padding: 2rem;
    border: 2px dashed #e2e8f0;
    border-radius: 10px;
    margin-bottom: 2rem;
  }

  .file-upload i {
    font-size: 3rem;
    color: #4299e1;
    margin-bottom: 1rem;
  }

  .file-upload input[type="file"] {
    display: none;
  }

  .upload-btn {
    display: inline-block;
    background: #4299e1;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .upload-btn:hover {
    background: #3182ce;
  }

  .file-name {
    margin-top: 1rem;
    color: #4a5568;
  }

  .highlight-section {
    margin-top: 2rem;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-group label {
    display: block;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .input-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
  }

  .button-group {
    display: flex;
    gap: 1rem;
  }

  .highlight-btn, .download-btn {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .highlight-btn {
    background: #48bb78;
    color: white;
  }

  .highlight-btn:hover {
    background: #38a169;
  }

  .download-btn {
    background: #4299e1;
    color: white;
  }

  .download-btn:hover {
    background: #3182ce;
  }

  .highlight-btn:disabled, .download-btn:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  .pdf-viewer {
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    margin-top: 2rem;
  }

  .canvas-container {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  canvas {
    display: block;
    margin: 0 auto;
  }

  .page-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .page-controls button {
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .page-controls button:hover {
    background: #3182ce;
  }

  .page-controls button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #fff5f5;
    color: #c53030;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 2rem;
  }

  .info-card {
    background: #f7fafc;
    padding: 1.5rem;
    border-radius: 10px;
  }

  .info-card i {
    font-size: 1.5rem;
    color: #4299e1;
    margin-bottom: 1rem;
  }

  .info-card h3 {
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .info-card ol {
    padding-left: 1.5rem;
    color: #4a5568;
  }

  .info-card li {
    margin-bottom: 0.5rem;
  }

  .info-card a {
    color: #4299e1;
    text-decoration: none;
  }

  .info-card a:hover {
    text-decoration: underline;
  }

  .tetris-game {
    padding: 1rem;
  }

  .game-container {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;
  }

  .game-board {
    border: 2px solid #2d3748;
    background: #1a202c;
    padding: 2px;
  }

  .row {
    display: flex;
  }

  .cell {
    width: 25px;
    height: 25px;
    border: 1px solid #2d3748;
  }

  .game-info {
    flex: 1;
  }

  .game-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .game-controls button {
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .game-controls button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  .game-over {
    color: #e53e3e;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .game-instructions {
    margin-top: 1rem;
    color: #4a5568;
  }

  .game-instructions ul {
    list-style-type: none;
    padding-left: 0;
  }

  .game-instructions li {
    margin: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }
    
    .button-group {
      flex-direction: column;
    }
  }
</style> 