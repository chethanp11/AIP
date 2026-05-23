"""
Product 1: PRISM Report Rationalizer (Stateful Agentic AI)
Assigned Banking Agent: PRISM Agent
"""

import time
from typing import List, Dict, Any
from shared.intelligence import invoke_capability, call_llm

async def run_prism_workflow(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    print(f"[Workflow: Reporting - PRISM] Launching banking report rationalizer for {len(reports)} audit sheets.")
    
    duplicates = []
    overlaps = []
    usage_insights = []
    
    cleaned = []
    for r in reports:
        name = r.get('name', 'Unnamed Report')
        query_str = (r.get('query', '') or '').strip()
        cleaned_query = ' '.join(query_str.split()).lower()
        usage = int(r.get('usage', 0) or 0)
        owner = r.get('owner', 'Unknown')
        cleaned.append({
            'name': name,
            'query': cleaned_query,
            'rawQuery': query_str,
            'usage': usage,
            'owner': owner
        })

    # 1. Audit duplicates (exact same SQL query)
    seen_queries = {}
    for rep in cleaned:
        q = rep['query']
        if q in seen_queries:
            original = seen_queries[q]
            duplicates.append({
                'reportA': original['name'],
                'reportB': rep['name'],
                'querySnippet': rep['rawQuery'][:50] + '...',
                'matchType': 'Exact SQL query match'
            })
        else:
            seen_queries[q] = rep

    # 2. Audit overlap (Jaccard similarity coefficient based on query tokens overlap)
    for i in range(len(cleaned)):
        for j in range(i + 1, len(cleaned)):
            rep_a = cleaned[i]
            rep_b = cleaned[j]
            
            tokens_a = set(rep_a['query'].split(' '))
            tokens_b = set(rep_b['query'].split(' '))
            
            intersection = tokens_a.intersection(tokens_b)
            union = tokens_a.union(tokens_b)
            
            if union:
                similarity = len(intersection) / len(union)
            else:
                similarity = 0.0
                
            if similarity > 0.5 and rep_a['query'] != rep_b['query']:
                overlaps.append({
                    'reportA': rep_a['name'],
                    'reportB': rep_b['name'],
                    'coefficient': round(similarity * 100, 1),
                    'action': 'Recommended for Consolidation'
                })

    # 3. Highlight low-usage reports for consolidation
    for rep in cleaned:
        if rep['usage'] < 15:
            usage_insights.append({
                'name': rep['name'],
                'usage': rep['usage'],
                'owner': rep['owner'],
                'status': 'Audit Target (Low Usage)'
            })

    # 4. Summarize and generate rationalization recommendations
    raw_logs = f"PRISM rationalizer analyzed {len(cleaned)} banking metrics reports. Duplicates detected: {len(duplicates)}. Overlap items: {len(overlaps)}. Low usage targets: {len(usage_insights)}."
    
    # Use live LLM or offline fallback for summarizations
    system_prompt = "You are a professional banking database auditor. Distill report duplication telemetry into a single-sentence recommendation."
    summary_text = f"PRISM completed auditing. Found {len(duplicates)} duplicate query patterns and {len(overlaps)} high Jaccard coefficient conflicts."
    
    ai_summary = await call_llm(system_prompt, raw_logs)
    if ai_summary:
        summary_text = ai_summary.strip()
    else:
        # Shared capability reuse fallback
        summary_result = await invoke_capability('summarization', {'text': raw_logs})
        summary_text = summary_result.get('summary', summary_text)

    recommendations = []
    if duplicates:
        recommendations.append(f"Consolidate {len(duplicates)} duplicate interest-margin queries into a single audited ledger report.")
    if overlaps:
        recommendations.append(f"Merge visual panels sharing {overlaps[0]['coefficient']}% query overlap between {overlaps[0]['reportA']} and {overlaps[0]['reportB']}.")
    if usage_insights:
        recommendations.append(f"Deprecate {len(usage_insights)} low-usage retail loan trackers to recover database resources.")

    return {
        'duplicates': duplicates,
        'overlaps': overlaps,
        'usageInsights': usage_insights,
        'summary': summary_text,
        'recommendations': recommendations
    }
