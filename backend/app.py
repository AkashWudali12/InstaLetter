from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pdfplumber
import base64
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.utils import simpleSplit
import os
from dotenv import load_dotenv
from datetime import datetime


load_dotenv()

app = Flask(__name__)
CORS(app)

LEFT_MARGIN = 72  # 1 inch
RIGHT_MARGIN = 72  # 1 inch
TOP_MARGIN = 720  # 1 inch from the top
LINE_HEIGHT = 14  # Approximate line spacing
FONT_NAME = "Helvetica"
FONT_SIZE = 12
PAGE_WIDTH, PAGE_HEIGHT = letter

# exported environment variables locally
GEMINI_API_KEY = os.getenv('GEMINI_KEY')

@app.route('/api/get_key', methods=['POST'])
def get_key():
    return jsonify({
        "key": GEMINI_API_KEY
    }), 200

@app.route('/api/parse_pdf', methods=['POST'])
def parse_pdf():
    data = request.get_json()
    
    if not data or 'data' not in data or 'filename' not in data:
        return jsonify({'success': False, 'message': 'Invalid payload.'}), 400

    filename = data['filename']
    base64_data = data['data']
    
    try:
        pdf_binary = base64.b64decode(base64_data.split(',')[1])
        with pdfplumber.open(io.BytesIO(pdf_binary)) as pdf:
            all_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n"
        
        return jsonify({'success': True, 'parsed_text': all_text}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error parsing PDF: {str(e)}'}), 500


@app.route('/api/cover_letter_blob', methods=['POST'])
def get_cl_blob():
    data = request.get_json()
    
    if not data or "cover-letter" not in data:
        return jsonify({'success': False, 'message': 'Invalid payload.'}), 400
    
    cover_letter = data["cover-letter"]
    
    # Replace the [Date] placeholder with the current date
    current_date = datetime.now().strftime("%B %d, %Y")  # e.g., "October 05, 2024"
    cover_letter = cover_letter.replace("[Date]", current_date)

    # Set the font and formatting parameters
    FONT_NAME = "Times-Roman"
    FONT_SIZE = 12
    LINE_HEIGHT = 14
    LEFT_MARGIN = 72   # 1 inch
    RIGHT_MARGIN = 72  # 1 inch
    TOP_MARGIN = 720   # approx. 1 inch from top
    PAGE_WIDTH, PAGE_HEIGHT = letter
    
    try:
        pdf_blob = io.BytesIO()
        pdf_canvas = canvas.Canvas(pdf_blob, pagesize=letter)
        pdf_canvas.setFont(FONT_NAME, FONT_SIZE)

        x = LEFT_MARGIN
        y = TOP_MARGIN

        # Split cover letter into lines
        lines = cover_letter.splitlines()
        
        for line in lines:
            line = line.rstrip()  # remove trailing spaces if any

            # If the line is empty, it's a paragraph break - add one blank line
            if line.strip() == "":
                y -= LINE_HEIGHT
                continue

            # Wrap lines if needed
            wrapped_lines = simpleSplit(line, FONT_NAME, FONT_SIZE, PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN)
            for wrapped_line in wrapped_lines:
                if y < 72:  # If near bottom margin, start a new page
                    pdf_canvas.showPage()
                    pdf_canvas.setFont(FONT_NAME, FONT_SIZE)
                    y = TOP_MARGIN
                pdf_canvas.drawString(x, y, wrapped_line)
                y -= LINE_HEIGHT

        pdf_canvas.save()
        pdf_blob.seek(0)
        
        return send_file(
            pdf_blob,
            as_attachment=True,
            download_name="cover_letter.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error creating PDF: {str(e)}'}), 500




if __name__ == '__main__':
    app.run(debug=True)
