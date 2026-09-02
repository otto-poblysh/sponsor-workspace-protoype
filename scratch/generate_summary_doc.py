import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Sets background color of a cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets cell internal padding (in twips: 20 twips = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout_box(doc, title, text, border_color="2563EB", bg_color="F8FAFC"):
    """Adds a stylish callout box with a thick left accent border."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(title)
    run_title.font.name = "Arial"
    run_title.font.size = Pt(10.5)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.15
    run_text = p2.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.italic = True
    run_text.font.color.rgb = RGBColor(30, 41, 59)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_document():
    doc = Document()
    
    # Page setup: Standard US Letter, 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Palette definition
    NAVY = RGBColor(15, 23, 42)       # #0F172A
    BLUE = RGBColor(37, 99, 235)      # #2563EB
    MUTED = RGBColor(71, 85, 105)     # #475569
    DARK_TEXT = RGBColor(30, 41, 59)  # #1E293B
    
    # --- DOCUMENT HEADER ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_kicker = title_p.add_run("iCUBEFARM WORKFORCE INTELLIGENCE PLATFORM\n")
    run_kicker.font.name = "Arial"
    run_kicker.font.size = Pt(9.5)
    run_kicker.font.bold = True
    run_kicker.font.color.rgb = BLUE
    
    run_title = title_p.add_run("The 4 Strategic Portals & Target ICPs: Feature Matrix")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = NAVY
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(2)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("Executive Feature Directory & Conversation Guide for Stakeholder Engagements")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = MUTED
    
    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(12)
    p_div_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="CBD5E1"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(p_div_border)
    
    # --- SECTION 1: EXECUTIVE OVERVIEW & MATRIX ---
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(10)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. Executive Summary & ICP Alignment Matrix")
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(13)
    r_h1.font.bold = True
    r_h1.font.color.rgb = NAVY
    
    intro_p = doc.add_paragraph()
    intro_p.paragraph_format.space_after = Pt(8)
    intro_p.paragraph_format.line_spacing = 1.15
    r_intro = intro_p.add_run(
        "iCUBEFARM deploys four purpose-built employment portals tailored to distinct market segments and decision-maker "
        "profiles (Ideal Customer Profiles - ICPs). Each portal addresses fundamentally different operational, regulatory, "
        "and governance motives, ensuring that our commercial positioning speaks directly to each buyer's mandate."
    )
    r_intro.font.name = "Arial"
    r_intro.font.size = Pt(10)
    r_intro.font.color.rgb = DARK_TEXT
    
    # Summary Table
    matrix_data = [
        ("Portal Name", "Target ICP (Buyer)", "Core Mandate", "Primary Strategic Lever"),
        (
            "1. Public Sector Jobs Portal",
            "Ministry of Public Functions / Civil Service Commission",
            "Civil service recruitment, meritocracy, public payroll cap control",
            "Merit-based competitive exams, blind screening, regional quota equity"
        ),
        (
            "2. Private Sector Jobs Portal",
            "Minister of Labor / Labor Inspectorate",
            "National labor market oversight, private employer compliance, skills intelligence",
            "National LMIS dashboard, private employer verification, local content tracking"
        ),
        (
            "3. Pan-African Community Portal",
            "Pan-African Orgs, Chambers of Commerce, Business Councils",
            "Community job creation, member value/retention, donor reporting",
            "Free ATS for member companies, cross-border mobility, audited impact data"
        ),
        (
            "4. Corporate Multinational Portal",
            "Conglomerate HR / Group CHRO (e.g., Dangote, Nestlé)",
            "Cross-border multi-subsidiary talent management, reducing agency spend",
            "Inter-subsidiary talent marketplace, silver-medalist pooling, group visibility"
        )
    ]
    
    tbl = doc.add_table(rows=len(matrix_data), cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(1.5), Inches(1.7), Inches(1.8), Inches(1.8)]
    
    for row_idx, row_data in enumerate(matrix_data):
        row = tbl.rows[row_idx]
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            
            r = p.add_run(cell_value)
            r.font.name = "Arial"
            
            if row_idx == 0:
                set_cell_background(cell, "0F172A")
                r.font.bold = True
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                r.font.size = Pt(8.5)
                r.font.color.rgb = DARK_TEXT
                if col_idx == 0:
                    r.font.bold = True
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # Helper function for rendering Portal sections
    def render_portal_section(number, title, icp_name, mandate_text, pain_text, features, pitch_title, pitch_quote):
        hp = doc.add_paragraph()
        hp.paragraph_format.space_before = Pt(14)
        hp.paragraph_format.space_after = Pt(4)
        rh = hp.add_run(f"2.{number} {title}")
        rh.font.name = "Arial"
        rh.font.size = Pt(13)
        rh.font.bold = True
        rh.font.color.rgb = NAVY
        
        # Meta info paragraph
        meta_p = doc.add_paragraph()
        meta_p.paragraph_format.space_before = Pt(0)
        meta_p.paragraph_format.space_after = Pt(6)
        meta_p.paragraph_format.line_spacing = 1.15
        
        rm1 = meta_p.add_run("Target Customer (ICP): ")
        rm1.font.bold = True
        rm1.font.size = Pt(9.5)
        rm1.font.color.rgb = BLUE
        
        rm2 = meta_p.add_run(f"{icp_name}\n")
        rm2.font.bold = True
        rm2.font.size = Pt(9.5)
        rm2.font.color.rgb = NAVY
        
        rm3 = meta_p.add_run("Core Mandate: ")
        rm3.font.bold = True
        rm3.font.size = Pt(9.5)
        rm3.font.color.rgb = DARK_TEXT
        
        rm4 = meta_p.add_run(f"{mandate_text}\n")
        rm4.font.size = Pt(9.5)
        rm4.font.color.rgb = DARK_TEXT
        
        rm5 = meta_p.add_run("Primary Pain Points Solved: ")
        rm5.font.bold = True
        rm5.font.size = Pt(9.5)
        rm5.font.color.rgb = DARK_TEXT
        
        rm6 = meta_p.add_run(f"{pain_text}")
        rm6.font.size = Pt(9.5)
        rm6.font.color.rgb = DARK_TEXT
        
        # Features heading
        f_head = doc.add_paragraph()
        f_head.paragraph_format.space_before = Pt(6)
        f_head.paragraph_format.space_after = Pt(4)
        rf = f_head.add_run("Top 12 Most Critical Features:")
        rf.font.bold = True
        rf.font.size = Pt(10)
        rf.font.color.rgb = NAVY
        
        # Features list
        for idx, (feat_name, feat_desc) in enumerate(features, 1):
            fp = doc.add_paragraph()
            fp.paragraph_format.left_indent = Inches(0.2)
            fp.paragraph_format.space_before = Pt(1)
            fp.paragraph_format.space_after = Pt(2)
            fp.paragraph_format.line_spacing = 1.15
            
            r_num = fp.add_run(f"{idx}. {feat_name}: ")
            r_num.font.name = "Arial"
            r_num.font.bold = True
            r_num.font.size = Pt(9)
            r_num.font.color.rgb = NAVY
            
            r_desc = fp.add_run(feat_desc)
            r_desc.font.name = "Arial"
            r_desc.font.size = Pt(9)
            r_desc.font.color.rgb = DARK_TEXT
        
        # Callout box for conversation pitch
        add_callout_box(doc, pitch_title, pitch_quote)

    # --- PORTAL 1 ---
    p1_features = [
        ("Civil Service Cadre & Grade Band Taxonomy", "Pre-configured alignment with public administration job classifications (e.g., Categories A/B/C, Grades 1–15, Administrative, Diplomatic, Health scales)."),
        ("Inter-Ministerial Requisition & Quota Approval", "Structured pipeline where line ministries (Health, Education, Works) submit staffing requests for central quota and budget clearance."),
        ("Merit-Based Competitive Examination Engine", "Automated intake, scoring, and ranking of civil service exam results to produce objective, defensible merit lists."),
        ("Blind & Anonymized Candidate Screening", "Automated redaction of applicant photos, names, home regions, and tribal markers during initial evaluation to eliminate nepotism accusations."),
        ("National ID & Civil Registry Verification", "Direct integration with national identity databases to prevent ghost applicants, age falsification, and duplicate submissions."),
        ("Geographic & Regional Balance Monitoring", "Real-time dashboard tracking applicant intake and selections across all national provinces and districts to guarantee fair representation."),
        ("Mass-Volume Citizen Intake Scalability", "Resilient cloud infrastructure capable of processing 100,000+ simultaneous citizen applications without crashing during open intake windows."),
        ("Official Gazette Publishing Engine", "Automated compilation of legally compliant public notices formatted for state gazettes, government portals, and official press bulletins."),
        ("Multi-Signature Ministerial Approval Workflows", "Hierarchical sign-off controls (Director of Civil Service → Secretary General → Minister) before candidate appointments are finalized."),
        ("State Headcount & Wage Bill Cap Verification", "Enforces checks against Ministry of Finance budget authorizations before vacancies can be declared or filled."),
        ("Transparent Citizen Status Tracking", "Public-facing portal enabling citizens to track application milestones transparently, eliminating public suspicions of backroom hiring."),
        ("Immutable Anti-Corruption Audit Trail", "Tamper-proof audit logging of every candidate score modification, status shift, and appointment decision for State Auditors.")
    ]
    render_portal_section(
        number=1,
        title="Public Sector Jobs Employment Portal",
        icp_name="Ministry of Public Functions / Civil Service Commission / Government Recruiter",
        mandate_text="Civil service recruitment, meritocracy, public workforce staffing, and payroll headcount control.",
        pain_text="Crushing applicant volumes, public accusations of nepotism and favoritism, ghost applicants, regional imbalance, and strict budget caps.",
        features=p1_features,
        pitch_title="Conversation Pitch Angle (When speaking to a Minister of Public Functions):",
        pitch_quote='"This portal provides your ministry with an unassailable shield of transparency and meritocracy. You can process 100,000 citizen applicants, objectively rank them by competitive exam scores and verified credentials, guarantee fair geographic representation across every province, and eliminate paper-based corruption before appointments are signed."'
    )

    # --- PORTAL 2 ---
    p2_features = [
        ("National LMIS Command Dashboard", "Executive cockpit delivering real-time private sector labor metrics: total registered employers, vacancy velocity, applicant volume, and placement rates."),
        ("Private Employer Directory & Compliance Registry", "Sovereign directory of all operating private enterprises with one-click verification, compliance tracking (Verified/Pending), and tax ID auditing."),
        ("National Skill Gap & Shortage Diagnostics", "Proprietary analytics detecting undersupplied competencies across sectors, providing hard evidence to reform technical education (TVET) and university funding."),
        ("Local Content & Nationalization Tracking", "Automated tracking of national vs. expatriate hiring ratios to enforce compliance with national labor codes and local-content decrees."),
        ("Multi-Province Regional Labor Slicing", "Filterable mapping across administrative provinces, economic corridors, and municipalities to address regional employment disparities."),
        ("Strategic Sector Workforce Analytics", "Disaggregated employment insights across national economic pillars (Oil & Gas, Mining, Banking, Telecoms, Construction, Agro-processing)."),
        ("Automated Official Labor Reports (PDF/Excel)", "One-click generation and instant export of comprehensive labor market publications for the Head of State, Cabinet, and Parliament."),
        ("Scheduled Ministerial Cabinet Digests", "Automated weekly and monthly intelligence briefs dispatched directly to ministerial cabinets, directors, and regional inspectorates."),
        ("Immutable Regulatory Audit Trails", "Legal-grade, timestamped records of all company inspections, verifications, and status changes to satisfy national audit requirements."),
        ("Private Sector Vacancy & Hiring Funnel Oversight", "Macro-level monitoring of private-sector job postings, recruitment stages, and hiring velocity to detect economic slowdowns early."),
        ("Institutional Partner Dissemination Lists", "Managed distribution engine delivering official state labor publications to international agencies (ILO, UNDP, World Bank, AfDB)."),
        ("Tri-Lingual National Localization (ES / FR / EN)", "Native multilingual toggling supporting plurilingual national governance (essential for CEMAC, Equatorial Guinea, and regional integration).")
    ]
    render_portal_section(
        number=2,
        title="Private Sector Jobs National Employment Portal",
        icp_name="Minister of Labor / National Labor Inspectorate",
        mandate_text="Sovereign oversight, private sector labor compliance, and national employment data consolidation.",
        pain_text="Private sector hiring is a black box, companies conceal vacancies, foreign firms bypass local-content laws, and manual labor inspections are inefficient.",
        features=p2_features,
        pitch_title="Conversation Pitch Angle (When speaking to a Minister of Labor):",
        pitch_quote='"You cannot regulate what you cannot see. This portal transforms your ministry from reactive paper inspection to a real-time national Labor Market Information System (LMIS). You can see every private employer, verify their local content compliance, immediately detect national skill shortages, and hand the Head of State an evidence-backed employment report with one click."'
    )

    # --- PORTAL 3 ---
    p3_features = [
        ("Network-Wide Member Employment Dashboard", "Aggregated view of net job creation, active applications, and placement milestones across the entire cross-border member network."),
        ("Member Company Directory & Accreditation", "Structured portfolio of accredited corporate members categorized by industry committee, membership tier, and regional chapter."),
        ("'Software-as-a-Benefit' Member ATS Provisioning", "Ability to gift member businesses enterprise recruitment software for free as a marquee membership retention perk."),
        ("Cross-Border & Regional Trade Corridor Coverage", "Multi-country tracking spanning regional African markets (e.g., Ethiopia, Kenya, Rwanda, Ghana, Nigeria) aligned with AfCFTA corridors."),
        ("Community Skill-Gap & Capacity Diagnostics", "Aggregated intelligence showing missing competencies across member industries, giving the association the blueprint for targeted training bootcamps."),
        ("Donor-Ready Impact & Placement Reports", "One-click generation of audited impact reports detailing jobs created, youth placement, and gender representation to secure international grants."),
        ("Cross-Border Talent Mobility & Diaspora Sourcing", "Regional discovery mechanisms connecting member employers with specialized talent and diaspora professionals across Africa."),
        ("Association Team & Regional Chapter Governance", "Multi-tier administrative controls for regional chapter heads, sector working groups, and the central executive secretariat."),
        ("Scheduled Member CEO Trend Briefings", "Automated monthly economic digests and hiring benchmarks emailed to member business leaders and executive committees."),
        ("Co-Branded Community Talent Exchange", "Fully customizable portal environment establishing the platform as the definitive community job board branded under the association's banner."),
        ("Direct Bridge to Community Job Seekers", "Integrated job seeker hub giving local talent direct access to vacancies posted across all member companies."),
        ("Trilingual Continental Parity (EN / FR / ES)", "Full trilingual interface and video localization bridging Anglophone, Francophone, and Lusophone/Hispanophone member companies.")
    ]
    render_portal_section(
        number=3,
        title="Pan-African Community Employment Portal",
        icp_name="Pan-African Organizations / Regional Business Councils / Chambers of Commerce",
        mandate_text="Member company advocacy, regional trade integration (AfCFTA), and community job creation.",
        pain_text="Cannot force companies to share data, must provide tangible ROI for membership dues, and need hard employment data to win donor funding.",
        features=p3_features,
        pitch_title="Conversation Pitch Angle (When speaking to a Chamber of Commerce or Business Association):",
        pitch_quote='"You don\'t need regulatory authority to get private sector employment data. By provisioning modern recruitment tools to your member businesses for free, you give them immense membership value. In return, their hiring activity automatically feeds your community dashboard—giving you the exact cross-border impact data you need to secure donor funding and guide industrial policy."'
    )

    # --- PORTAL 4 ---
    p4_features = [
        ("Multi-Entity & Multi-Business-Unit Hierarchy", "Hierarchical data modeling: Group Holding Company → Regional Operating Units → Legal Subsidiaries (e.g., Cement vs. Sugar) → Local Plants/Offices."),
        ("Cross-Entity Internal Talent Marketplace", "Internal mobility engine enabling employees in one subsidiary or country to discover and apply for transfer opportunities across the entire conglomerate."),
        ("Central Group HR Oversight vs. Local HR Autonomy", "Group CHRO sees consolidated talent pipeline and hiring velocity, while local subsidiary HR teams manage their own day-to-day candidate pipelines independently."),
        ("Group-Wide 'Silver Medalist' Talent Pooling", "Centralized candidate pool allowing high-caliber applicants who were runner-ups in one subsidiary to be instantly discovered and invited by another business unit."),
        ("AI-Powered Candidate Screening & Match Scoring", "High-volume automated screening matching candidates against competency frameworks with objective 0–100% fit scores."),
        ("Side-by-Side Finalist Comparison Matrix (2–5 Candidates)", "Comparative canvas showing competency overlap, unique strengths, gap analysis, and compensation alignment for final executive review."),
        ("Unified Global Employer Branding with Local Sites", "Central corporate brand standards enforced across all careers pages, with localized subsidiary styling, languages, and country perks."),
        ("Multi-Country Currency, Tax & Labor Adaptability", "Configurable compliance parameters for compensation bands, tax regimes, and notice periods across operating countries (e.g., Nigeria, Ghana, Kenya, South Africa)."),
        ("Recruitment Pipeline & Stage Aging Analytics", "Deep funnel diagnostics identifying hiring bottlenecks, stage drop-offs, and time-in-stage across different business units."),
        ("Collaborative Cross-Border Hiring Panels", "Shared evaluation scorecards and private notes allowing functional leaders at Group HQ to co-evaluate candidates with local plant managers."),
        ("Executive C-Suite Recruitment Reports & Canvas", "Natural-language report generator compiling recruitment ROI, agency cost savings, diversity metrics, and time-to-fill for the Board and CHRO."),
        ("Enterprise Role-Based Access & Data Privacy Fencing", "Robust data segregation ensuring strict compliance with regional data protection laws (e.g., GDPR, NDPR) and local labor privacy standards.")
    ]
    render_portal_section(
        number=4,
        title="Corporate Multinational Employment Portal",
        icp_name="Corporate Multinationals & Conglomerates (e.g., Dangote Group, Nestlé, MTN)",
        mandate_text="Centralized group-wide workforce acquisition, cross-subsidiary internal mobility, and agency spend reduction.",
        pain_text="Subsidiaries operate as isolated silos, each buys its own local ATS or agency, zero internal talent mobility, and Group HQ lacks pipeline visibility.",
        features=p4_features,
        pitch_title="Conversation Pitch Angle (When speaking to a Group CHRO or Multinational Executive):",
        pitch_quote='"Stop letting your subsidiaries operate as isolated silos with separate recruitment agencies and conflicting systems. This portal gives Group HQ full visibility over your entire continental talent pipeline, creates an internal talent marketplace so you don\'t lose top people to competitors, and lets you redeploy qualified candidates across subsidiaries with zero agency fees."'
    )

    output_path = "/Users/akamaotto/code/icubefarm/sponsor-workspace-prototype/iCUBEFARM_4_Portals_Executive_Summary.docx"
    doc.save(output_path)
    print("Document successfully created at:", output_path)

if __name__ == "__main__":
    build_document()
