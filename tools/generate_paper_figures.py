"""
Generates publication-quality charts, graphs, and flowcharts for the IEEE 6-page research paper.
Refined for single-column (3.5 inch / COL_W) embedding with large, crisp, legible typography.
"""
import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

FIGURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'paper_figures'))
os.makedirs(FIGURES_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['font.size'] = 8.5
plt.rcParams['axes.labelsize'] = 8.5
plt.rcParams['axes.titlesize'] = 9.0
plt.rcParams['xtick.labelsize'] = 7.5
plt.rcParams['ytick.labelsize'] = 7.5
plt.rcParams['legend.fontsize'] = 7.5

def generate_figure1_architecture():
    """Generates Figure 1: Clean vertical / stacked layout fitting single column (3.6 in wide)"""
    fig, ax = plt.subplots(figsize=(3.6, 3.8), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 5)
    ax.set_ylim(0, 6.2)

    def draw_box(x, y, w, h, title, items, bg_color='#F8FAFC', border_color='#0F172A', title_color='#0F172A'):
        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.06,rounding_size=0.08",
            facecolor=bg_color, edgecolor=border_color, linewidth=1.1
        )
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.22, title, ha='center', va='center', fontweight='bold', fontsize=7.8, color=title_color)
        for idx, item in enumerate(items):
            ax.text(x + 0.12, y + h - 0.48 - idx*0.22, f"• {item}", ha='left', va='center', fontsize=6.8, color='#334155')

    # Top: Vendor Portal
    draw_box(
        0.3, 4.6, 4.4, 1.45,
        "Vendor Bid Gateway (:8001)",
        [
            "FastAPI + Jinja2 + Tailwind CSS",
            "15-Character GSTIN Mod-36 Pre-Validation",
            "Multi-Envelope PDF Submission (Tech/Fin/Tax)"
        ],
        bg_color='#F0FDF4', border_color='#16A34A', title_color='#15803D'
    )

    # Middle: Shared Persistence Layer
    draw_box(
        0.3, 2.7, 4.4, 1.45,
        "Shared Persistence Ledger Store",
        [
            "SQLite3 (WAL Mode, Concurrent Read/Write)",
            "Master 'bids' (Status: Pending AI Verification)",
            "Hash-Chained 'audit_logs' Append-Only Store"
        ],
        bg_color='#EFF6FF', border_color='#2563EB', title_color='#1D4ED8'
    )

    # Bottom: Officer Console
    draw_box(
        0.3, 0.8, 4.4, 1.45,
        "Officer Verification Console (:5173)",
        [
            "React 18 + Vite Single-Page Application",
            "Deterministic GFR 149 Rule Evaluation",
            "Compliance Score (Sc) & Risk Matrix (Rk)"
        ],
        bg_color='#FEF2F2', border_color='#DC2626', title_color='#B91C1C'
    )

    # Core engine badge at bottom
    core_rect = patches.FancyBboxPatch(
        (0.3, 0.05), 4.4, 0.55,
        boxstyle="round,pad=0.04,rounding_size=0.06",
        facecolor='#FAF5FF', edgecolor='#9333EA', linewidth=1.0
    )
    ax.add_patch(core_rect)
    ax.text(2.5, 0.32, "OCR & Forensics Engine: pdfplumber + Tesseract (300 DPI)\nSHA-256 Tamper-Evident Forward-Secure Ledger",
            ha='center', va='center', fontsize=6.2, fontweight='bold', color='#6B21A8')

    # Connecting arrows
    arrow = dict(arrowstyle="->", lw=1.3, color='#334155')
    ax.annotate("", xy=(2.5, 4.15), xytext=(2.5, 4.6), arrowprops=arrow)
    ax.text(2.65, 4.38, "Submit", fontsize=6.5, color='#475569')

    ax.annotate("", xy=(2.5, 2.25), xytext=(2.5, 2.7), arrowprops=arrow)
    ax.text(2.65, 2.48, "Sync", fontsize=6.5, color='#475569')

    ax.annotate("", xy=(2.5, 0.6), xytext=(2.5, 0.8), arrowprops=arrow)

    plt.tight_layout()
    path = os.path.join(FIGURES_DIR, 'fig1_system_architecture.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated Refined Figure 1: {path}")

def generate_figure3_latency():
    """Generates Figure 3: Latency comparison with adjusted labels to prevent clipping"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 2.6), dpi=300)

    labels = ['Manual Review\n(3-Member TEC)', 'GeM-BidVerify AI\n(Automated)']
    times_sec = [1512.0, 1.37]
    colors = ['#EF4444', '#10B981']

    bars = ax1.bar(labels, times_sec, color=colors, width=0.45, edgecolor='#1E293B', linewidth=1.0)
    ax1.set_yscale('log')
    ax1.set_ylabel('Processing Time (s, Log Scale)', fontweight='bold', fontsize=8)
    ax1.set_title('(a) Total Duration per Bid Envelope', fontweight='bold', fontsize=8.5)
    ax1.grid(axis='y', linestyle='--', alpha=0.5)
    ax1.set_ylim(0.5, 8000)

    ax1.text(0, 1800.0, '1,512.0 s\n(25.2 min)', ha='center', va='bottom', fontsize=7.5, fontweight='bold')
    ax1.text(1, 2.2, '1.37 s\n(1,103× Speedup)', ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#047857')

    stages = [
        'Document\nClassification',
        'Text Extraction\n& Raster OCR',
        'Registry &\nTax Checks',
        'GFR 149 Rule\nEvaluation',
        'Audit Logging\n& Signing'
    ]
    sub_times = [0.18, 1.12, 0.04, 0.02, 0.01]
    stage_colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#64748B']

    bars2 = ax2.barh(stages, sub_times, color=stage_colors, edgecolor='#1E293B', height=0.55, linewidth=1.0)
    ax2.set_xlabel('Execution Latency (Seconds)', fontweight='bold', fontsize=8)
    ax2.set_title('(b) Automated Sub-Process Latency', fontweight='bold', fontsize=8.5)
    ax2.grid(axis='x', linestyle='--', alpha=0.5)
    ax2.invert_yaxis()

    for bar, t in zip(bars2, sub_times):
        pct = (t / 1.37) * 100
        ax2.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height()/2, f"{t:.2f} s ({pct:.1f}%)",
                 va='center', fontsize=7.0, fontweight='bold', color='#1E293B')

    ax2.set_xlim(0, 1.45)
    plt.tight_layout()
    path = os.path.join(FIGURES_DIR, 'fig3_latency_breakdown.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated Refined Figure 3: {path}")

def generate_figure6_hash_chain():
    """Generates Figure 6: Vertical 3-block hash chain designed specifically for single column width (3.6 in)"""
    fig, ax = plt.subplots(figsize=(3.6, 3.2), dpi=300)
    ax.axis('off')
    ax.set_xlim(0, 5)
    ax.set_ylim(0, 5.8)

    def draw_chain_block(x, y, w, h, title, prev_h, action, data, cur_h, border='#0F172A', bg='#F8FAFC'):
        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.05,rounding_size=0.08",
            facecolor=bg, edgecolor=border, linewidth=1.1
        )
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.20, title, ha='center', va='center', fontweight='bold', fontsize=7.2, color='#0F172A')
        ax.text(x + 0.12, y + h - 0.45, f"Prev Hash: {prev_h}", ha='left', va='center', fontsize=6.0, family='monospace', color='#475569')
        ax.text(x + 0.12, y + h - 0.70, f"Event: {action} | {data}", ha='left', va='center', fontsize=6.4, color='#1E293B')
        ax.text(x + 0.12, y + 0.20, f"SHA-256 Hash: {cur_h}", ha='left', va='center', fontsize=6.2, family='monospace', fontweight='bold', color='#1D4ED8')

    # Block 1: Bid Ingestion
    draw_chain_block(0.3, 4.0, 4.4, 1.5, "Block j-1: Bid Ingestion", "H_0 (GENESIS)", "VENDOR_SUBMIT", "Bid: BID/89201", "d4a8...7b21")

    # Block 2: AI Verification
    draw_chain_block(0.3, 2.1, 4.4, 1.5, "Block j: AI Verification", "d4a8...7b21 (Valid Link)", "AI_VERIFY", "Sc=92, Rk=8 (AI_QUALIFIED)", "9f3c...e842")

    # Block 3: Officer Signoff
    draw_chain_block(0.3, 0.2, 4.4, 1.5, "Block j+1: Officer Signoff", "9f3c...e842 (Valid Link)", "OFFICER_SIGN", "officer_priyansh (APPROVED)", "7a1e...5c90")

    # Linking arrows
    arrow = dict(arrowstyle="->", lw=1.4, color='#2563EB')
    ax.annotate("", xy=(2.5, 3.6), xytext=(2.5, 4.0), arrowprops=arrow)
    ax.text(2.65, 3.8, "SHA-256", fontsize=6.2, fontweight='bold', color='#1D4ED8')

    ax.annotate("", xy=(2.5, 1.7), xytext=(2.5, 2.1), arrowprops=arrow)
    ax.text(2.65, 1.9, "SHA-256", fontsize=6.2, fontweight='bold', color='#1D4ED8')

    # Tamper callout at top
    callout = patches.FancyBboxPatch(
        (0.3, 5.55), 4.4, 0.22,
        boxstyle="round,pad=0.02,rounding_size=0.04",
        facecolor='#FEF3C7', edgecolor='#D97706', linewidth=0.8
    )
    ax.add_patch(callout)
    ax.text(2.5, 5.66, "Tamper Resistance: Modification of Block j breaks hash at j+1",
            ha='center', va='center', fontsize=6.0, fontweight='bold', color='#92400E')

    plt.tight_layout()
    path = os.path.join(FIGURES_DIR, 'fig6_audit_hash_chain.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated Refined Figure 6: {path}")

if __name__ == '__main__':
    generate_figure1_architecture()
    generate_figure3_latency()
    generate_figure6_hash_chain()
