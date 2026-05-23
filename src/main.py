"""
FastAPI Server Gateway Entrypoint (Python)
AIM Intelligence Platform (AIP)
"""

import os
import sys

# Ensure workspace root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import random
import string
import time
from typing import Dict, Any, List
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import intelligence operating layer
from shared.intelligence import (
    register_capability,
    invoke_capability,
    list_capabilities,
    get_logs,
    clear_logs,
    active_agent_context
)

# Import stateless capabilities
import shared.capabilities.knowledge_retrieval as knowledge_retrieval_cap
import shared.capabilities.context_management as context_management_cap
import shared.capabilities.summarization as summarization_cap
import shared.capabilities.narrative_generation as narrative_generation_cap
import shared.capabilities.metric_interpretation as metric_interpretation_cap
import shared.capabilities.visualization as visualization_cap
import shared.capabilities.orchestration as orchestration_cap
import shared.capabilities.mcp_integration as mcp_integration_cap

# Import stateful banking suites agent workflows
from src.reporting.prism.main import run_prism_workflow
from src.reporting.report_building.main import (
    run_report_builder_workflow,
    initiate_report_build,
    advance_workflow_step,
    list_published_reports
)
from src.reporting.conversational_bi.main import run_conversational_bi_workflow
from src.reporting.proactive_insights.main import run_proactive_insights_workflow

from src.business_analytics.insight_discovery.main import run_insight_discovery_workflow
from src.business_analytics.root_cause_analysis.main import run_rca_workflow
from src.business_analytics.what_if_analysis.main import run_whatif_workflow
from src.business_analytics.business_narratives.main import run_business_narratives_workflow

from src.workflow_automation.workflow_design.main import validate_pipeline_config
from src.workflow_automation.workflow_orchestration.main import run_custom_workflow
from src.workflow_automation.task_automation.main import get_active_approvals, resume_approval_workflow
from src.workflow_automation.monitoring.main import run_monitoring_workflow

from src.data_science_ml.data_preparation.main import run_data_preparation_workflow
from src.data_science_ml.model_development.main import get_model_experiments
from src.data_science_ml.model_documentation.main import run_model_documentation_workflow
from src.data_science_ml.model_pulse.main import run_model_pulse_workflow

from shared.lms import get_lms_table

# Initialize and register all stateless capabilities
register_capability('knowledge_retrieval', knowledge_retrieval_cap.config, knowledge_retrieval_cap.handler)
register_capability('context_management', context_management_cap.config, context_management_cap.handler)
register_capability('summarization', summarization_cap.config, summarization_cap.handler)
register_capability('narrative_generation', narrative_generation_cap.config, narrative_generation_cap.handler)
register_capability('metric_interpretation', metric_interpretation_cap.config, metric_interpretation_cap.handler)
register_capability('visualization', visualization_cap.config, visualization_cap.handler)
register_capability('orchestration', orchestration_cap.config, orchestration_cap.handler)
register_capability('mcp_integration', mcp_integration_cap.config, mcp_integration_cap.handler)

app = FastAPI(title="AIM Intelligence Platform API")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================================
# 🔒 REQUEST-SCOPE AUTHENTICATION & THREAD-SAFE CONTEXT TRACING MIDDLEWARE
# ==========================================================================
@app.middleware("http")
async def context_and_auth_middleware(request: Request, call_next):
    path = request.url.path
    
    # Bypass auth verification for static UI pages and login POSTs
    if (
        request.method == "OPTIONS"
        or path == "/"
        or path.startswith("/index.")
        or path.startswith("/static")
        or path == "/api/v1/auth/login"
        or path == "/api/v1/auth/sme-login"
        or not path.startswith("/api/v1")
    ):
        return await call_next(request)

    # Validate Authorization Header Bearer prefix
    auth_header = request.headers.get('Authorization')
    api_key = ''
    if auth_header and auth_header.startswith('Bearer '):
        api_key = auth_header.split(' ', 1)[1]

    if not api_key or not api_key.startswith('AIP-'):
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized: Missing or invalid API key. Must start with 'AIP-'"}
        )

    # Map endpoint paths to calling Agent personae (telemetry grounding)
    agent_name = "Platform Routing Agent"
    if "/workflows/reporting/conversational-bi" in path:
        agent_name = "Conversational BI Agent"
    elif "/workflows/reporting/build" in path:
        agent_name = "Report Builder Agent"
    elif "/workflows/reporting/proactive" in path:
        agent_name = "Proactive Monitor Agent"
    elif "/workflows/reporting/prism-lite" in path:
        agent_name = "PRISM Agent"
    elif "/workflows/analytics/rca" in path:
        agent_name = "RCA Diagnostic Agent"
    elif "/workflows/analytics/insight-discovery" in path:
        agent_name = "Insight Discovery Agent"
    elif "/workflows/analytics/what-if" in path:
        agent_name = "What-if Simulator Agent"
    elif "/workflows/analytics/business-narratives" in path:
        agent_name = "Narrative Storyteller Agent"
    elif "/workflows/automation/run" in path:
        agent_name = "Workflow Designer Agent"
    elif "/workflows/automation/approve" in path:
        agent_name = "Approval Routing Agent"
    elif "/workflows/automation/telemetry" in path:
        agent_name = "System Monitor Agent"
    elif "/workflows/ds/prep" in path:
        agent_name = "Data Prep Profiler Agent"
    elif "/workflows/ds/experiments" in path:
        agent_name = "Model Developer Agent"
    elif "/workflows/ds/document" in path:
        agent_name = "Model Documenter Agent"
    elif "/workflows/ds/model-pulse" in path:
        agent_name = "Model Pulse Agent"
    elif "/lms/query" in path or "/knowledge" in path:
        agent_name = "Analytical Grounding Agent"

    # Set thread-safe request-scope contextvars
    token = active_agent_context.set({'agent': agent_name, 'api_key': api_key})
    try:
        response = await call_next(request)
        return response
    finally:
        active_agent_context.reset(token)

# ==========================================================================
# 🔑 ANALYST LOGIN ROUTE
# ==========================================================================
@app.post("/api/v1/auth/login")
async def login(payload: Dict[str, Any]):
    username = payload.get('username')
    password = payload.get('password')
    
    user = authenticate_kms_user(username, password, required_role='Analyst')
    if user:
        session_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
        secure_token = f"AIP-ANALYST-SESSION-{session_suffix}"
        print(f"[Auth Success] Authenticated Analyst. Issued secure session token: {secure_token}")
        return {'success': True, 'token': secure_token, 'role': user['role'], 'clearance': user['clearance']}

    raise HTTPException(
        status_code=401,
        detail="Invalid analyst credentials."
    )

@app.post("/api/v1/auth/sme-login")
async def sme_login(payload: Dict[str, Any]):
    username = payload.get('username')
    password = payload.get('password')
    user = authenticate_kms_user(username, password, required_role='SME')
    if user:
        session_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
        secure_token = f"AIP-SME-SESSION-{session_suffix}"
        print(f"[Auth Success] Authenticated SME. Issued secure session token: {secure_token}")
        return {'success': True, 'token': secure_token, 'role': user['role'], 'clearance': user['clearance']}

    raise HTTPException(
        status_code=401,
        detail="Invalid SME credentials."
    )

# ==========================================================================
# 📊 LMS DATABASE ROUTE
# ==========================================================================
@app.get("/api/v1/lms/query")
async def query_lms(table: str = None):
    if table:
        records = get_lms_table(table)
        if not records:
            raise HTTPException(status_code=404, detail=f"Table '{table}' not found in LMS.")
        return records
    else:
        return {
            'deposits': get_lms_table('deposits'),
            'loans': get_lms_table('loans'),
            'liquidity_buffers': get_lms_table('liquidity_buffers'),
            'branch_performance': get_lms_table('branch_performance')
        }

# ==========================================================================
# 📚 KMS KNOWLEDGE ROUTES (SQLite Vector & Graph DB)
# ==========================================================================
from src.kms.index import (
    ingest_custom_file_to_kms,
    search_kms_vector_and_graph,
    list_canonical_knowledge,
    approve_canonical_knowledge,
    rollback_knowledge_version,
    get_kms_observability_data,
    generate_context_package,
    advanced_retrieval_orchestration,
    list_source_connectors,
    list_candidate_knowledge,
    update_candidate_details,
    act_on_candidate_knowledge,
    sync_source_connector,
    generate_context_zip,
    get_business_domains_list,
    get_kms_filter_options,
    authenticate_kms_user
)


@app.get("/api/v1/kms/domains")
async def kms_business_domains_list():
    try:
        return get_business_domains_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kms/options")
async def kms_options_list():
    try:
        return get_kms_filter_options()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/knowledge/search")
async def knowledge_search(q: str = ''):
    return await invoke_capability('knowledge_retrieval', {'question': q})

@app.get("/api/v1/knowledge/context")
async def knowledge_context(q: str = ''):
    res = await invoke_capability('knowledge_retrieval', {'question': q})
    return {'context': res.get('context', '')}

@app.post("/api/v1/kms/upload")
async def kms_upload_document(payload: Dict[str, Any]):
    filename = payload.get('filename', 'custom_regulation.txt')
    content = payload.get('content', '')
    owner = payload.get('owner', 'System Ingestion')
    security_class = payload.get('securityClassification', 'Internal')
    sme = payload.get('sme', 'Marcus Vance')
    domain = payload.get('businessDomain', 'Corporate Analytics')
    if not content:
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")
    try:
        return await ingest_custom_file_to_kms(filename, content, owner, security_class, sme, domain)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/query")
async def kms_query_grounding(payload: Dict[str, Any]):
    query = payload.get('query', '')
    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    try:
        res = search_kms_vector_and_graph(query)
        return {
            'groundedContext': res['context'],
            'matchedNodes': res['matched_nodes'],
            'matchedChunks': res['matched_chunks']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kms/connectors")
async def kms_connectors_list():
    try:
        return list_source_connectors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/connectors")
async def kms_connectors_create(payload: Dict[str, Any]):
    import uuid
    name = payload.get('name')
    type = payload.get('type')
    auth = payload.get('authPlaceholder')
    sync_method = payload.get('syncMethod', 'Manual')
    owner = payload.get('owner')
    domain = payload.get('domain')
    if not name or not type:
        raise HTTPException(status_code=400, detail="Missing name or type parameter.")
    try:
        from src.kms.index import get_kms_db
        conn = get_kms_db()
        cursor = conn.cursor()
        connector_id = "conn_" + uuid.uuid4().hex[:6]
        cursor.execute("""
            INSERT INTO source_connectors (connector_id, name, type, auth_placeholder, sync_method, owner, domain, status, error_logs, ingestion_history)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (connector_id, name, type, auth, sync_method, owner, domain, 'Active', '', 'Established Connection'))
        conn.commit()
        return {'success': True, 'connectorId': connector_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/connectors/sync")
async def kms_connectors_sync(payload: Dict[str, Any]):
    connector_id = payload.get('connectorId')
    if not connector_id:
        raise HTTPException(status_code=400, detail="Missing connectorId parameter.")
    try:
        return await sync_source_connector(connector_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kms/candidates")
async def kms_candidates_list():
    try:
        return list_candidate_knowledge()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/candidates/edit")
async def kms_candidates_edit(payload: Dict[str, Any]):
    candidate_id = payload.get('candidateId')
    title = payload.get('title')
    summary = payload.get('summary')
    domain = payload.get('domain')
    tags = payload.get('tags')
    relationships = payload.get('relationships')
    if not candidate_id:
        raise HTTPException(status_code=400, detail="Missing candidateId parameter.")
    try:
        return update_candidate_details(candidate_id, title, summary, domain, tags, relationships)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/candidates/action")
async def kms_candidates_action(payload: Dict[str, Any]):
    candidate_id = payload.get('candidateId')
    status = payload.get('status')
    comments = payload.get('comments', '')
    if not candidate_id or not status:
        raise HTTPException(status_code=400, detail="Missing candidateId or status parameters.")
    try:
        return act_on_candidate_knowledge(candidate_id, status, comments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kms/canonical")
async def kms_canonical_list():
    try:
        return list_canonical_knowledge()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/approve")
async def kms_approve_knowledge(payload: Dict[str, Any]):
    knowledge_id = payload.get('knowledgeId')
    approved = payload.get('approved', False)
    if not knowledge_id:
        raise HTTPException(status_code=400, detail="Missing knowledgeId parameter.")
    try:
        return approve_canonical_knowledge(knowledge_id, approved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/rollback")
async def kms_rollback_knowledge(payload: Dict[str, Any]):
    knowledge_id = payload.get('knowledgeId')
    if not knowledge_id:
        raise HTTPException(status_code=400, detail="Missing knowledgeId parameter.")
    try:
        return rollback_knowledge_version(knowledge_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kms/observability")
async def kms_observability_metrics():
    try:
        return get_kms_observability_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/context-package")
async def kms_context_package(payload: Dict[str, Any]):
    query = payload.get('query', '')
    user_role = payload.get('userRole', 'Analyst')
    clearance = payload.get('clearance', 'Internal')
    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    try:
        return generate_context_package(query, user_role, clearance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/query-advanced")
async def kms_query_advanced(payload: Dict[str, Any]):
    query = payload.get('query', '')
    user_role = payload.get('userRole', 'Analyst')
    clearance = payload.get('clearance', 'Internal')
    limit = payload.get('limit', 4)
    search_mode = payload.get('searchMode', 'Hybrid')
    filters = payload.get('filters', {})
    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    try:
        res = advanced_retrieval_orchestration(query, user_role, clearance, limit, search_mode, filters)
        return {
            'groundedContext': res['context'],
            'matchedNodes': res['matched_nodes'],
            'matchedChunks': res['matched_chunks'],
            'agentTraces': res['agent_traces'],
            'contradictions': res['contradictions'],
            'missingContext': res['missing_context'],
            'latencyMs': res['latency_ms']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/kms/retriever/download")
async def kms_retriever_download(payload: Dict[str, Any]):
    query = payload.get('query', '')
    user_role = payload.get('userRole', 'Analyst')
    clearance = payload.get('clearance', 'Internal')
    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    try:
        res = advanced_retrieval_orchestration(query, user_role, clearance)
        pkg = generate_context_package(query, user_role, clearance)
        zip_data = generate_context_zip(query, res, pkg)
        
        from fastapi.responses import Response
        import urllib.parse
        safe_filename = urllib.parse.quote(f"context_pack_{query[:15].replace(' ', '_')}.zip")
        return Response(
            content=zip_data,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={safe_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================================================
# ⚙️ CAPABILITY REGISTRY & AUDIT TRAILS ROUTES
# ==========================================================================
@app.get("/api/v1/capabilities")
async def capabilities_list():
    return list_capabilities()

@app.post("/api/v1/capabilities/invoke")
async def capability_invoke(payload: Dict[str, Any]):
    name = payload.get('name')
    inputs = payload.get('input', {})
    try:
        output = await invoke_capability(name, inputs)
        return {'success': True, 'output': output}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/execution-logs")
async def execution_logs_get():
    return get_logs()

@app.delete("/api/v1/execution-logs")
async def execution_logs_clear():
    clear_logs()
    return {'success': True}

# ==========================================================================
# 📰 REPORTING SUITE ROUTES
# ==========================================================================
@app.post("/api/v1/workflows/reporting/prism-lite")
async def prism_lite(payload: Dict[str, Any]):
    reports = payload.get('reports', [])
    return await run_prism_workflow(reports)

@app.post("/api/v1/workflows/reporting/build")
async def build_report(payload: Dict[str, Any]):
    metric_id = payload.get('metricId')
    val = payload.get('value')
    comp = payload.get('compareValue')
    note = payload.get('note', '')
    return await run_report_builder_workflow(metric_id, val, comp, note)

@app.post("/api/v1/workflows/reporting/build/initiate")
async def build_report_initiate(payload: Dict[str, Any]):
    mode = payload.get('mode', 'create')
    report_id = payload.get('reportId')
    requirements = payload.get('requirements', '')
    context = payload.get('context', '')
    try:
        return await initiate_report_build(mode, report_id, requirements, context)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/workflows/reporting/build/step")
async def build_report_step(payload: Dict[str, Any]):
    session_id = payload.get('sessionId')
    step = payload.get('step', 1)
    approved = payload.get('approved', False)
    feedback = payload.get('feedback', '')
    try:
        return await advance_workflow_step(session_id, step, approved, feedback)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/workflows/reporting/build/reports")
async def build_report_list():
    try:
        return list_published_reports()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/workflows/reporting/conversational-bi")
async def conversational_bi(payload: Dict[str, Any]):
    question = payload.get('question', '')
    return await run_conversational_bi_workflow(question)

@app.get("/api/v1/workflows/reporting/proactive-insights")
async def proactive_insights():
    return await run_proactive_insights_workflow()

# ==========================================================================
# 📈 BUSINESS ANALYTICS SUITE ROUTES
# ==========================================================================
@app.post("/api/v1/workflows/analytics/insight-discovery")
async def insight_discovery(payload: Dict[str, Any]):
    segments = payload.get('segmentsData', [])
    return await run_insight_discovery_workflow(segments)

@app.post("/api/v1/workflows/analytics/rca")
async def rca(payload: Dict[str, Any]):
    dataset = payload.get('datasetName', '')
    metrics = payload.get('metricsData', [])
    return await run_rca_workflow(dataset, metrics)

@app.post("/api/v1/workflows/analytics/what-if")
async def what_if(payload: Dict[str, Any]):
    loan_rate = payload.get('loanRate')
    deposit_rate = payload.get('depositRate')
    assets = payload.get('assets')
    npl_rate = payload.get('nplRate')
    return run_whatif_workflow(loan_rate, deposit_rate, assets, npl_rate)

@app.post("/api/v1/workflows/analytics/business-narratives")
async def narratives(payload: Dict[str, Any]):
    channel = payload.get('channel', 'slack')
    metric = payload.get('metricName', 'NIM Compression')
    val = payload.get('value', '3.60')
    growth = payload.get('growthRate', '0.0')
    driver = payload.get('primaryDriver', 'Retail Loans')
    return await run_business_narratives_workflow(channel, metric, val, growth, driver)

# ==========================================================================
# ⚡ WORKFLOW AUTOMATION SUITE ROUTES
# ==========================================================================
@app.post("/api/v1/workflows/automation/run")
async def run_workflow(payload: Dict[str, Any]):
    config = payload.get('config', {})
    
    # Visual validator checkpoint
    validation = validate_pipeline_config(config)
    if not validation.get('structuralValid'):
        raise HTTPException(status_code=400, detail=f"Structural Config Errors: {', '.join(validation['errors'])}")
        
    return await run_custom_workflow(config)

@app.get("/api/v1/workflows/automation/approvals")
async def approvals_list():
    return get_active_approvals()

@app.post("/api/v1/workflows/automation/approve")
async def approvals_route(payload: Dict[str, Any]):
    approval_id = payload.get('approvalId')
    approved = payload.get('approved', False)
    try:
        return await resume_approval_workflow(approval_id, approved)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/workflows/automation/telemetry")
async def telemetry_get():
    return await run_monitoring_workflow()

# ==========================================================================
# 🧪 DATA SCIENCE & ML SUITE ROUTES
# ==========================================================================
@app.post("/api/v1/workflows/ds/prep")
async def ds_prep(payload: Dict[str, Any]):
    cols = payload.get('columns', [])
    ds = payload.get('dataset', [])
    return run_data_preparation_workflow(cols, ds)

@app.get("/api/v1/workflows/ds/experiments")
async def ds_experiments():
    return get_model_experiments()

@app.post("/api/v1/workflows/ds/document")
async def ds_document(payload: Dict[str, Any]):
    model_id = payload.get('modelId')
    framework = payload.get('framework')
    run_id = payload.get('championRun')
    return await run_model_documentation_workflow(model_id, framework, run_id)

@app.post("/api/v1/workflows/ds/model-pulse")
async def ds_pulse(payload: Dict[str, Any]):
    metrics = payload.get('accuracyMetrics', [])
    return await run_model_pulse_workflow(metrics)

# ==========================================================================
# 🌐 MOUNT STATIC FRONTEND PLATFORM CLIENT SHELL & MICRO-FRONTENDS
# ==========================================================================
# 1. Mount published HTML report briefing folder at "/reports"
reports_dir = os.path.abspath('src/reporting/report_building/reports')
os.makedirs(reports_dir, exist_ok=True)
app.mount("/reports", StaticFiles(directory=reports_dir, html=True), name="reports_pub")

# 2. Mount all 17 micro-frontend static sub-UIs dynamically
sub_apps_paths = [
    ("/ui/kms", "src/kms/ui"),
    ("/ui/reporting/prism", "src/reporting/prism/ui"),
    ("/ui/reporting/report_building", "src/reporting/report_building/ui"),
    ("/ui/reporting/conversational_bi", "src/reporting/conversational_bi/ui"),
    ("/ui/reporting/proactive_insights", "src/reporting/proactive_insights/ui"),
    ("/ui/business_analytics/insight_discovery", "src/business_analytics/insight_discovery/ui"),
    ("/ui/business_analytics/root_cause_analysis", "src/business_analytics/root_cause_analysis/ui"),
    ("/ui/business_analytics/what_if_analysis", "src/business_analytics/what_if_analysis/ui"),
    ("/ui/business_analytics/business_narratives", "src/business_analytics/business_narratives/ui"),
    ("/ui/workflow_automation/workflow_design", "src/workflow_automation/workflow_design/ui"),
    ("/ui/workflow_automation/workflow_orchestration", "src/workflow_automation/workflow_orchestration/ui"),
    ("/ui/workflow_automation/task_automation", "src/workflow_automation/task_automation/ui"),
    ("/ui/workflow_automation/monitoring", "src/workflow_automation/monitoring/ui"),
    ("/ui/data_science_ml/data_preparation", "src/data_science_ml/data_preparation/ui"),
    ("/ui/data_science_ml/model_development", "src/data_science_ml/model_development/ui"),
    ("/ui/data_science_ml/model_documentation", "src/data_science_ml/model_documentation/ui"),
    ("/ui/data_science_ml/model_pulse", "src/data_science_ml/model_pulse/ui")
]

for mount_url, local_dir in sub_apps_paths:
    abs_local_dir = os.path.abspath(local_dir)
    os.makedirs(abs_local_dir, exist_ok=True)
    app.mount(mount_url, StaticFiles(directory=abs_local_dir, html=True))

# 3. Mount the master UI platform shell onto root "/"
master_ui_dir = os.path.abspath('src/ui')
if os.path.exists(master_ui_dir):
    app.mount("/", StaticFiles(directory=master_ui_dir, html=True), name="ui_master")
else:
    @app.get("/")
    async def index():
        return {'status': 'active', 'message': 'AIP Master Shell not loaded.'}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
