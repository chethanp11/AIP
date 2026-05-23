/**
 * KMS Workspace Micro-Frontend JS Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    setupKmsUploader();
    setupKmsSearchSandbox();
    
    // Check if query parameter exists (from global search redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
        document.getElementById('kms-search-inp').value = decodeURIComponent(queryParam);
        executeSearch(decodeURIComponent(queryParam));
    }
});

// ==========================================================
// 📥 KNOWLEDGE INGESTION: DRAG-AND-DROP FILE UPLOAD
// ==========================================================
function setupKmsUploader() {
    const dropzone = document.getElementById('kms-dropzone');
    const fileInput = document.getElementById('kms-file-input');
    const statusBox = document.getElementById('ingestion-status');
    
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(evt) {
            const content = evt.target.result;
            statusBox.innerHTML = `<span style="color:#6366f1;">⏳ Ingesting and vectorizing '${file.name}'...</span>`;
            
            try {
                const res = await fetch(`${API_BASE}/kms/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        content: content
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    statusBox.innerHTML = `
                        <span style="color:#10b981; font-weight:700;">✅ Ingestion Completed!</span><br/>
                        <span style="font-size:11px; color:#64748b;">Node ID: <code>${data.nodeId}</code> | Total DB Nodes: ${data.totalKmsNodes}</span>
                    `;
                } else {
                    statusBox.innerHTML = `<span style="color:#ef4444;">❌ Ingestion failed: ${data.detail}</span>`;
                }
            } catch(err) {
                statusBox.innerHTML = `<span style="color:#ef4444;">❌ Server Error: ${err.message}</span>`;
            }
        };
        reader.readAsText(file);
    });
}

// ==========================================================
// 🔍 KMS QUERY SANDBOX: VECTOR & GRAPH SEARCH
// ==========================================================
function setupKmsSearchSandbox() {
    const searchBtn = document.getElementById('kms-search-btn');
    const searchInp = document.getElementById('kms-search-inp');
    
    searchBtn.addEventListener('click', () => {
        const q = searchInp.value.trim();
        if (q) executeSearch(q);
    });
    
    searchInp.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const q = searchInp.value.trim();
            if (q) executeSearch(q);
        }
    });
}

async function executeSearch(queryStr) {
    const resultsBox = document.getElementById('kms-search-results');
    const vecGrid = document.getElementById('vector-matches');
    const graphGrid = document.getElementById('graph-matches');
    
    vecGrid.innerHTML = '<div class="loader">🔍 Querying SQLite vector similarity index...</div>';
    graphGrid.innerHTML = '';
    resultsBox.classList.remove('hide');
    
    try {
        const res = await fetch(`${API_BASE}/kms/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryStr })
        });
        const data = await res.json();
        
        vecGrid.innerHTML = '';
        graphGrid.innerHTML = '';
        
        if (!data.matchedChunks || data.matchedChunks.length === 0) {
            vecGrid.innerHTML = '<p class="warn">⚠️ Zero vector similarity matches found in database.</p>';
            graphGrid.innerHTML = '<p class="warn">⚠️ No graph node coordinate links matched.</p>';
            return;
        }
        
        // Render matched chunks
        vecGrid.innerHTML = data.matchedChunks.map(c => `
            <div class="chunk-card">
                <span style="color:#64748b; font-weight:600; font-size:10px;">Similarity score: ${c.score.toFixed(3)}</span>
                <p style="margin-top:2px;">"${c.text}"</p>
            </div>
        `).join('');
        
        // Render matched graph nodes
        graphGrid.innerHTML = data.matchedNodes.map(n => `
            <div class="node-card">
                <h5>📌 [${n.type}] ${n.title}</h5>
                <p>${n.content}</p>
            </div>
        `).join('');
        
    } catch(err) {
        vecGrid.innerHTML = `<p class="error">Query failed: ${err.message}</p>`;
    }
}