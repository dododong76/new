<script>
  import { onMount } from 'svelte';
  import * as pdfjsLib from 'pdfjs-dist';
  import { PDFDocument } from 'pdf-lib';

  let pdfFile = null;
  let highlightText = '';
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

  onMount(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdfDoc = await loadingTask.promise;
      numPages = pdfDoc.numPages;
      
      // 텍스트 추출 개선
      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => {
            // 텍스트 아이템의 특수한 속성 확인
            if (item.str && item.str.trim()) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' '); // 연속된 공백 제거
        
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

  async function renderPage(pageNum) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      if (!canvas) return;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // 하이라이트된 텍스트가 있다면 그리기
      if (highlightText) {
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        
        context.fillStyle = 'rgba(255, 255, 0, 0.3)';
        
        for (const item of textItems) {
          const itemText = item.str.toLowerCase();
          if (itemText.includes(highlightText.toLowerCase())) {
            const transform = viewport.transform;
            const [x, y] = applyTransform(item.transform, transform);
            
            context.fillRect(
              x,
              y - item.height,
              item.width * viewport.scale,
              item.height * viewport.scale
            );
          }
        }
      }
      
      currentPage = pageNum;
    } catch (error) {
      console.error('페이지 렌더링 오류:', error);
    }
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
    
    if (!highlightText.trim()) {
      errorMessage = '하이라이트할 텍스트를 입력해주세요.';
      return;
    }

    try {
      loading = true;
      errorMessage = '';

      // 현재 페이지 다시 렌더링 (하이라이트 포함)
      await renderPage(currentPage);
      
      // 검색 로직 개선
      const searchText = highlightText.toLowerCase().trim();
      const contentText = pdfContent.toLowerCase();
      
      console.log('검색 텍스트:', searchText); // 디버깅용
      
      const textPositions = [];
      let pos = contentText.indexOf(searchText);
      
      while (pos !== -1) {
        textPositions.push(pos);
        pos = contentText.indexOf(searchText, pos + 1);
      }

      if (textPositions.length === 0) {
        // 부분 검색 시도
        const words = searchText.split(/\s+/);
        let found = false;
        
        for (const word of words) {
          if (word.length > 1 && contentText.includes(word)) {
            found = true;
            errorMessage = `"${highlightText}"와 정확히 일치하는 텍스트는 없지만, "${word}"가 포함된 부분이 있습니다.`;
            break;
          }
        }
        
        if (!found) {
          errorMessage = '검색된 텍스트가 없습니다.';
        }
        return;
      }

      errorMessage = `"${highlightText}"가 총 ${textPositions.length}개 발견되었습니다.`;
      
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
            bind:value={highlightText}
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
      
      <div class="info-card">
        <i class="fas fa-envelope"></i>
        <h3>문의하기</h3>
        <p>이메일: method917@naver.com</p>
        <p>블로그: <a href="https://blog.naver.com/method917" target="_blank">https://blog.naver.com/method917</a></p>
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

  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }
    
    .button-group {
      flex-direction: column;
    }
  }
</style> 