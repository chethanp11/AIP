
            const seedReports = [
                { name: 'NIM Breakdown Q1', query: 'SELECT (interest_income - interest_expense) / earning_assets FROM branch_ledger', usage: 120, owner: 'Finance' },
                { name: 'Interest Spread Review', query: 'SELECT (interest_income-interest_expense)/earning_assets FROM branch_ledger', usage: 8, owner: 'ALCO Committee' },
                { name: 'Regional LDR Ledger', query: 'SELECT total_loans / total_deposits FROM customer_deposits', usage: 84, owner: 'Treasury' }
            ];

            document.getElementById('prism-btn').addEventListener('click', async () => {
                const btn = document.getElementById('prism-btn');
                const resBox = document.getElementById('prism-results');
                const ul = document.getElementById('prism-recom');
                
                btn.disabled = true;
                btn.innerText = "Analyzing Report SQL Queries...";
                
                try {
                    const res = await fetch(`${API_BASE}/workflows/reporting/prism-lite`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reports: seedReports })
                    });
                    const data = await res.json();
                    
                    ul.innerHTML = data.recommendations.map(r => `<li>👉 ${r}</li>`).join('');
                    resBox.classList.remove('hide');
                } catch(err) {
                    alert("Rationalization failed: " + err.message);
                } finally {
                    btn.disabled = false;
                    btn.innerText = "Catalog Rationalized";
                }
            });
        