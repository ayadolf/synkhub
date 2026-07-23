from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from io import BytesIO
from datetime import datetime
from urllib.parse import quote

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

from app.database import get_db
from app.models.user import User
from app.models.workspace import Member, Workspace
from app.models.board import Board
from app.models.postit import Postit
from app.models.risk import Risk
from app.routes.auth import get_current_user

router = APIRouter(tags=["pdf"])

OCP_GREEN = colors.HexColor("#13A538")
OCP_DARK = colors.HexColor("#163E2C")
OCP_ORANGE = colors.HexColor("#E27954")
LIGHT_GREEN = colors.HexColor("#AECC53")
LIGHT_BG = colors.HexColor("#F0FDF4")


def _get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='DocTitle',
        parent=styles['Title'],
        fontSize=22,
        textColor=OCP_DARK,
        spaceAfter=6,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=OCP_GREEN,
        spaceAfter=20,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=OCP_DARK,
        spaceBefore=20,
        spaceAfter=10,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        name='SubSection',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=OCP_GREEN,
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BodyText2',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='SmallText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.gray,
    ))
    styles.add(ParagraphStyle(
        name='CellStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
    ))

    return styles


def _header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.gray)
    canvas.drawString(2 * cm, 1.5 * cm, f"Genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')}")
    canvas.drawRightString(A4[0] - 2 * cm, 1.5 * cm, f"Page {doc.page}")
    canvas.setStrokeColor(OCP_GREEN)
    canvas.setLineWidth(2)
    canvas.line(2 * cm, A4[1] - 1.8 * cm, A4[0] - 2 * cm, A4[1] - 1.8 * cm)
    canvas.line(2 * cm, 1.8 * cm, A4[0] - 2 * cm, 1.8 * cm)
    canvas.restoreState()


@router.get("/api/boards/{board_id}/pdf")
def generate_pdf(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouve")

    membership = db.query(Member).filter(
        Member.workspace_id == board.workspace_id,
        Member.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Acces refuse")

    workspace = db.query(Workspace).filter(Workspace.id == board.workspace_id).first()
    members = db.query(Member).filter(Member.workspace_id == board.workspace_id).all()
    member_users = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            member_users.append({
                "name": user.username or user.email,
                "role": m.role or "membre",
            })

    postits = db.query(Postit).filter(Postit.board_id == board_id).all()
    risks = db.query(Risk).filter(Risk.board_id == board_id).order_by(Risk.created_at.desc()).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = _get_styles()
    elements = []

    elements.append(Spacer(1, 2 * cm))
    elements.append(Paragraph("Rapport de Brainstorming", styles['DocTitle']))
    elements.append(Paragraph("Synthese Analytique et Registre des Risques SI", styles['DocSubtitle']))
    elements.append(Spacer(1, 1 * cm))

    info_data = [
        ["Board:", board.title],
        ["Workspace:", workspace.name if workspace else "N/A"],
        ["Date:", datetime.now().strftime("%d/%m/%Y")],
        ["Genere par:", current_user.username or current_user.email],
    ]
    info_table = Table(info_data, colWidths=[4 * cm, 12 * cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), OCP_DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, OCP_GREEN),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.lightgrey),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 1 * cm))

    elements.append(Paragraph("Membres du Workspace", styles['SectionTitle']))
    members_data = [["Nom", "Role"]]
    for m in member_users:
        members_data.append([m["name"], m["role"]])

    members_table = Table(members_data, colWidths=[10 * cm, 6 * cm])
    members_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), OCP_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BOX', (0, 0), (-1, -1), 1, OCP_GREEN),
    ]))
    elements.append(members_table)
    elements.append(Spacer(1, 1 * cm))

    elements.append(Paragraph("Post-its du Brainstorming", styles['SectionTitle']))
    elements.append(Paragraph(
        f"Nombre total de post-its: {len(postits)}",
        styles['BodyText2']
    ))

    if postits:
        postits_data = [["#", "Contenu", "Auteur"]]
        for i, p in enumerate(postits[:20], 1):
            content = (p.content or "")[:80]
            if len(p.content or "") > 80:
                content += "..."
            author = "Anonyme"
            if p.author_id:
                u = db.query(User).filter(User.id == p.author_id).first()
                if u:
                    author = u.username or u.email
            postits_data.append([str(i), Paragraph(content, styles['CellStyle']), author])

        postits_table = Table(postits_data, colWidths=[1 * cm, 11 * cm, 4 * cm])
        postits_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), OCP_DARK),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, OCP_DARK),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(postits_table)

    elements.append(PageBreak())

    elements.append(Paragraph("Registre des Risques SI", styles['SectionTitle']))
    elements.append(Paragraph(
        f"Nombre total de risques identifies: {len(risks)}",
        styles['BodyText2']
    ))

    if risks:
        for i, risk in enumerate(risks, 1):
            score = risk.probability * risk.impact
            if score >= 15:
                level = "critique"
            elif score >= 8:
                level = "eleve"
            elif score >= 4:
                level = "moyen"
            else:
                level = "faible"

            elements.append(Spacer(1, 8 * mm))

            risk_header = [[
                Paragraph(f"<b>Risque #{i}</b>", styles['CellStyle']),
                Paragraph(f"<b>{risk.title}</b>", styles['CellStyle']),
                Paragraph(f"<b>[{level.upper()}]</b>", styles['CellStyle']),
            ]]
            risk_header_table = Table(risk_header, colWidths=[2.5 * cm, 10 * cm, 3.5 * cm])
            risk_header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), LIGHT_BG),
                ('BOX', (0, 0), (-1, 0), 1, OCP_GREEN),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
            ]))
            elements.append(risk_header_table)

            risk_details = [
                ["Description:", Paragraph(risk.description or "Aucune description", styles['CellStyle'])],
                ["Categorie:", Paragraph(risk.category or "N/A", styles['CellStyle'])],
                ["Probabilite:", Paragraph(f"{risk.probability}/5", styles['CellStyle'])],
                ["Impact:", Paragraph(f"{risk.impact}/5", styles['CellStyle'])],
                ["Score:", Paragraph(f"{score}/25", styles['CellStyle'])],
                ["Traitement:", Paragraph(risk.treatment or "N/A", styles['CellStyle'])],
                ["Action:", Paragraph(risk.treatment_action or "Aucune action definie", styles['CellStyle'])],
                ["Proprietaire:", Paragraph(risk.owner or "Non assigne", styles['CellStyle'])],
            ]

            details_table = Table(risk_details, colWidths=[3.5 * cm, 12.5 * cm])
            details_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (0, -1), OCP_DARK),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.lightgrey),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]))
            elements.append(details_table)
    else:
        elements.append(Paragraph(
            "Aucun risque identifie pour ce board.",
            styles['BodyText2']
        ))

    elements.append(Spacer(1, 2 * cm))
    elements.append(HRFlowable(width="100%", color=OCP_GREEN, thickness=2))
    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph(
        "Ce rapport a ete genere automatiquement par la plateforme de brainstorming collaboratif.",
        styles['SmallText']
    ))
    elements.append(Paragraph(
        f"Board ID: {board_id} | Genere le {datetime.now().strftime('%d/%m/%Y a %H:%M:%S')}",
        styles['SmallText']
    ))

    doc.build(elements, onFirstPage=_header_footer, onLaterPages=_header_footer)

    buffer.seek(0)
    filename = f"rapport_{board.title[:30].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    # Use RFC5987 encoding (filename*) with percent-encoding to avoid Latin-1 header encoding errors
    disposition = f"attachment; filename*=UTF-8''{quote(filename)}"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": disposition},
    )
