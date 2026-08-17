# i18n Glossary & Style Guide

## Target Audience & Official Context

This portal is built for the **Ministry of Labour, Employment Promotion and Social Security** (*Ministerio de Trabajo, Fomento de Empleo y Seguridad Social*) of the Republic of Equatorial Guinea (*República de Guinea Ecuatorial*).

- **Official Languages**: Spanish (*Español*) is the primary official and administrative language of government in Equatorial Guinea. French (*Français*) is also an official language.
- **Formality & Register**: Use a formal, professional administrative tone throughout all translations.
  - Spanish: Formal register (*usted* / *su* / *le*).
  - French: Formal register (*vous* / *votre* / *vos*).
- **Proper Nouns & Regional Entities**: Proper names of cities, provinces, demo individuals, registered companies, and brands are governed by `i18n/do-not-translate.json` and must remain unchanged across all locales.

---

## Core Terminology Matrix

| English Term | Spanish (*Español*) | French (*Français*) | Category | Usage Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Labour Market Portal** | *Portal del Mercado Laboral* | *Portail du Marché du Travail* | Core Brand | Official name of the platform |
| **Ministry of Labour, Employment Promotion and Social Security** | *Ministerio de Trabajo, Fomento de Empleo y Seguridad Social* | *Ministère du Travail, de la Promotion de l'Emploi et de la Sécurité Sociale* | Government Body | Official ministry title |
| **Equatorial Guinea** | *Guinea Ecuatorial* | *Guinée équatoriale* | Country | State name |
| **Sponsor Workspace** | *Espacio de Trabajo del Patrocinador* | *Espace de Travail du Promoteur* | Navigation | Workspace section title |
| **Executive Overview** | *Resumen Ejecutivo* | *Synthèse Exécutive* | Navigation | Dashboard overview page |
| **Registered Entities** | *Entidades Registradas* | *Entités Enregistrées* | Navigation | Employer directory |
| **Skill Gap Analysis** | *Análisis de Brecha de Competencias* | *Analyse du Déficit de Compétences* | Navigation | Labour skills analytics |
| **Jobs & Applications** | *Ofertas y Solicitudes* | *Offres et Candidatures* | Navigation | Recruitment monitoring |
| **General Report** | *Informe General* | *Rapport Général* | Navigation | Consolidated reporting |
| **Users Management** | *Gestión de Usuarios* | *Gestion des Utilisateurs* | Navigation | Administration |
| **Activity Logs** | *Registros de Actividad* | *Journaux d'Activité* | Navigation | Audit trail |
| **Report Recipients** | *Destinatarios de Informes* | *Destinataires des Rapports* | Navigation | Report distribution |
| **Notification Preferences** | *Preferencias de Notificación* | *Préférences de Notification* | Navigation | User settings |
| **Tenant Branding** | *Personalización Institucional* | *Personnalisation Institutionnelle* | Navigation | Brand settings |
| **Supported Countries** | *Países Admitidos* | *Pays Pris en Charge* | Navigation | System configuration |

---

## Statuses & State Indicators

| English Term | Spanish (*Español*) | French (*Français*) | Context |
| :--- | :--- | :--- | :--- |
| **Pending Review** | *Pendiente de revisión* | *En attente d'examen* | Entity moderation / verification |
| **Verified** | *Verificado* | *Vérifié* | Entity status badge |
| **Suspended** | *Suspendido* | *Suspendu* | Moderation action & status |
| **Invited** | *Invitado* | *Invité* | Entity / User invitation status |
| **Active** | *Activo* | *Actif* | User / Entity active status |
| **Deactivated** / **Inactive** | *Desactivado* / *Inactivo* | *Désactivé* / *Inactif* | User / Entity status |
| **Closed** | *Cerrado* | *Clôturé* | Job vacancy status |
| **Shortage** | *Escasez* | *Pénurie* | Skill gap status badge |
| **Surplus** | *Superávit* | *Surplus* | Skill gap status badge |
| **Balanced** | *Equilibrado* | *Équilibré* | Skill gap status badge |
| **Critical Shortage** | *Escasez Crítica* | *Pénurie Critique* | Severe talent deficit |
| **Moderate Shortage** | *Escasez Moderada* | *Pénurie Modérée* | Moderate talent deficit |
| **Compliant** | *Conforme* | *Conforme* | National quota regulation |
| **Non-Compliant** | *No conforme* | *Non conforme* | National quota regulation |

---

## Labour Market & Regulatory Terminology

| English Term | Spanish (*Español*) | French (*Français*) | Usage Notes |
| :--- | :--- | :--- | :--- |
| **National Quota** | *Cuota de Empleo Nacional* | *Quota d'Emploi National* | Statutory local workforce percentage |
| **Expatriate Ratio** | *Proporción de Expatriados* | *Ratio d'Expatriés* | Share of foreign workforce |
| **Workforce** | *Fuerza laboral* / *Mano de obra* | *Main-d'œuvre* / *Effectifs* | Total employed population |
| **Labour Market Dynamics** | *Dinámica del Mercado Laboral* | *Dynamique du Marché du Travail* | Macroeconomic talent trends |
| **Candidate Funnel** | *Embudo de Candidatos* | *Entonnoir des Candidatures* | Recruitment workflow |
| **Shortlisted** | *En lista corta* / *Preseleccionado* | *Présélectionné* | Candidate stage |
| **Hired** | *Contratado* | *Embauché* | Candidate stage |
| **Monthly Recipient** | *Destinatario Mensual* | *Destinataire Mensuel* | Scheduled report recipient |
| **Quarterly Recipient** | *Destinatario Trimestral* | *Destinataire Trimestriel* | Scheduled report recipient |

---

## Translation Rules & Placeholders

1. **Placeholder Tokens**: All tokens enclosed in curly braces (e.g. `{name}`, `{count}`, `{amount}`, `{sector}`, `{entity}`) must be preserved exactly as-is in target strings.
2. **Do-Not-Translate Compliance**: Any item in `i18n/do-not-translate.json` (cities such as *Malabo*, *Bata*; demo people such as *María Esono*, *Pedro Nsue*; company names such as *Bioko Marine Services*, *GETESA*; tokens such as *FCFA*, *CSV*, *PDF*) must not be translated or altered.
3. **Punctuation and Formatting**: Preserve colon, semicolon, hyphens, and quotation marks consistent with standard official Spanish and French typography (e.g. appropriate non-breaking space before colons in French when applicable).
