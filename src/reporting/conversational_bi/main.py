"""
Product 3: Conversational BI Assistant (Stateful Agentic AI)
Assigned Banking Agent: Conversational BI Agent
"""

import json
from typing import Dict, Any
from shared.intelligence import invoke_capability, call_llm
from shared.lms import get_lms_table

async def run_conversational_bi_workflow(question: str) -> Dict[str, Any]:
    print(f'[Workflow: Reporting - Conversational BI] Answering banking analytics query: "{question}"')

    # 1. Gather KMS context mapping
    retrieve_result = await invoke_capability('knowledge_retrieval', {'question': question})
    
    # 2. Fetch live data from LMS tables
    deposits = get_lms_table('deposits')
    loans = get_lms_table('loans')
    buffers = get_lms_table('liquidity_buffers')
    performance = get_lms_table('branch_performance')
    
    lms_data_summary = json.dumps({
        'deposits': deposits,
        'loans': loans,
        'buffers': buffers,
        'performance': performance
    })

    # 3. Draft AI prompts linking Report context, LMS Database, and KMS
    system_prompt = """You are a professional Banking Executive BI Assistant. Your sole objective is to answer conversational analytical queries.
You must ground your calculations and answers strictly in the central KMS metrics configurations and the live LMS Database records.
Answer the question concisely in clean Markdown. Include inline tables, bullet points, and calculations if necessary.
Avoid guessing. Cite specific branches (North Plaza, Metro Hub, South Bay, West Valley) or HQLA categories based on actual LMS details."""

    user_prompt = f"""Analyst Query: "{question}"
KMS Semantics Definitions matched: {retrieve_result.get('context', '')}
Live LMS Database Records: {lms_data_summary}

Provide a comprehensive, executive-grade analysis response."""

    response_narrative = ''
    ai_answer = await call_llm(system_prompt, user_prompt)
    
    if ai_answer:
        response_narrative = ai_answer
        print('[Workflow: Reporting - Conversational BI] Live OpenAI BI response generated successfully.')
    else:
        # High-fidelity fallback heuristic mapping
        print('[Workflow: Reporting - Conversational BI] OpenAI key offline, using offline capabilities.')
        
        q_lower = question.lower()
        metric_id = 'net_interest_margin'
        trends = [3.12, 3.08, 3.15, 2.95, 2.88, 2.82, 2.65]
        metric_name = 'Net Interest Margin (NIM)'
        formula = '(interest_income - interest_expense) / average_earning_assets'
        
        if 'npl' in q_lower or 'performing' in q_lower or 'credit' in q_lower or 'default' in q_lower:
            metric_id = 'npl_ratio'
            trends = [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85]
            metric_name = 'Non-Performing Loans (NPL) Ratio'
            formula = '(total_non_performing_loans / total_outstanding_loans) * 100'
        elif 'ldr' in q_lower or 'deposit' in q_lower or 'liquidity' in q_lower:
            metric_id = 'loan_to_deposit_ratio'
            trends = [78.5, 79.2, 80.5, 81.2, 80.8, 82.5, 85.8]
            metric_name = 'Loan-to-Deposit Ratio (LDR)'
            formula = '(total_outstanding_loans / total_deposits) * 100'
        elif 'cac' in q_lower or 'card' in q_lower or 'acquisition' in q_lower:
            metric_id = 'banking_card_cac'
            trends = [180, 175, 192, 185, 178, 172, 215]
            metric_name = 'Credit Card Acquisition Cost (CAC)'
            formula = 'credit_sales_marketing_spend / total_new_cardholders'

        interpret_result = await invoke_capability('metric_interpretation', {
            'metricId': metric_id,
            'trends': trends,
            'analysisType': 'anomaly'
        })

        generate_result = await invoke_capability('narrative_generation', {
            'templateId': 'briefing_brief',
            'variables': {
                'metricName': metric_name,
                'metricValue': f"{trends[-1]}{'%' if metric_id != 'banking_card_cac' else ''}",
                'compareValue': f"{trends[-2]}{'%' if metric_id != 'banking_card_cac' else ''}",
                'metricFormula': formula,
                'explanation': interpret_result.get('explanation', ''),
                'summaryText': retrieve_result.get('context', '')[:150] + '...'
            }
        })

        response_narrative = generate_result.get('narrative', '')

    # Generate the line spec to visualize the trend
    q_lower = question.lower()
    selected_trends = [3.12, 3.08, 3.15, 2.95, 2.88, 2.82, 2.65]
    if 'npl' in q_lower or 'default' in q_lower:
        selected_trends = [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85]
    elif 'ldr' in q_lower or 'deposit' in q_lower:
        selected_trends = [78.5, 79.2, 80.5, 81.2, 80.8, 82.5, 85.8]
    elif 'cac' in q_lower or 'card' in q_lower:
        selected_trends = [180, 175, 192, 185, 178, 172, 215]

    viz_result = await invoke_capability('visualization', {
        'chartType': 'line',
        'trends': selected_trends
    })

    return {
        'narrative': response_narrative,
        'vegaSpec': viz_result.get('vegaSpec')
    }
