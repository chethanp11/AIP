# Knowledge Management System (KMS)

This directory acts as the centralized semantic definition repository. It holds version-controlled declarative files representing business definitions, metrics definitions, and relational schema mappings.

## 📁 Directory Structure
*   `metrics/`: Declares KPI metrics, hierarchical metric trees, mathematical formulas, and variance properties (YAML/JSON schemas).
*   `glossary/`: Declares enterprise terminology and synonyms.
*   `schemas/`: Data catalog descriptions mapping physical database columns to semantic attributes.

## 📐 Governance Guidelines
1.  All metric calculations must reference formulas configured in this directory.
2.  Do not embed calculation logic inside prompt code or capabilities directly; declare them in the metric trees here.
3.  Any modification to the metrics schemas must be validated programmatically through schema-checking suites.
