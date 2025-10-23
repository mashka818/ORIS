const PDFDocument = require('pdfkit');

function transliterate(text) {
  // Simple transliteration for Cyrillic to Latin for PDF compatibility
  const map = {
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh','З':'Z','И':'I',
    'Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T',
    'У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'',
    'Э':'E','Ю':'Yu','Я':'Ya',
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
    'э':'e','ю':'yu','я':'ya'
  };
  return text.split('').map(char => map[char] || char).join('');
}

function generateBookingPDF(booking, clinic) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with ORIS cross logo
      const logoX = 50;
      const logoY = 40;
      const logoSize = 80;
      
      // Blue circle background
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2)
         .fillAndStroke('#1e40af', '#1e40af');
      
      // Green/yellow cross
      const crossColor = '#4ade80';
      const crossWidth = 24;
      const crossHeight = 50;
      const centerX = logoX + logoSize/2;
      const centerY = logoY + logoSize/2;
      
      // Vertical bar
      doc.rect(centerX - crossWidth/2, centerY - crossHeight/2, crossWidth, crossHeight)
         .fill(crossColor);
      
      // Horizontal bar
      doc.rect(centerX - crossHeight/2, centerY - crossWidth/2, crossHeight, crossWidth)
         .fill(crossColor);
      
      // ORIS text
      doc.fontSize(28)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('ORIS', 145, 55);
      
      doc.fontSize(11)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Set klinik', 145, 88);

      // Booking number
      doc.fontSize(14)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text(`Zayavka #${booking.id}`, 400, 60, { align: 'right' });

      // Line
      doc.moveTo(50, 145)
         .lineTo(545, 145)
         .lineWidth(2)
         .strokeColor('#e5e7eb')
         .stroke();

      // Title
      doc.fontSize(26)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('BOOKING CONFIRMATION', 50, 175, { align: 'center' });

      // Success checkmark
      doc.circle(297.5, 245, 28)
         .lineWidth(4)
         .strokeColor('#10b981')
         .stroke();
      
      doc.moveTo(282, 245)
         .lineTo(293, 256)
         .lineTo(313, 236)
         .lineWidth(4)
         .strokeColor('#10b981')
         .stroke();

      // Info box background
      doc.roundedRect(70, 300, 455, 280, 12)
         .fillAndStroke('#f9fafb', '#e5e7eb');

      let yPos = 330;
      const spacing = 55;

      // Clinic
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('CLINIC:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(transliterate(clinic.name), 100, yPos + 16);

      // Patient
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('PATIENT:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(transliterate(booking.name), 100, yPos + 16);

      // Phone
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('PHONE:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(booking.phone, 100, yPos + 16);

      // Date
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('DATE:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(booking.date, 100, yPos + 16);

      // Time
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('TIME:', 100, yPos);
      
      const [startH, startM] = booking.time.split(':').map(Number);
      const endMinutes = startH * 60 + startM + 30;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const timeRange = `${booking.time} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(timeRange, 100, yPos + 16);

      // Important notice
      yPos += 80;
      doc.roundedRect(80, yPos, 435, 90, 10)
         .fillAndStroke('#dbeafe', '#60a5fa');
      
      doc.fontSize(11)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('IMPORTANT:', 100, yPos + 18);
      
      doc.fontSize(10)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text('Please arrive 10 minutes before your appointment.', 100, yPos + 40, { width: 395 })
         .text('Please bring your ID document.', 100, yPos + 60, { width: 395 });

      // Footer
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .font('Helvetica-Oblique')
         .text('This document confirms your appointment.', 50, 740, { 
           align: 'center',
           width: 495
         });
      
      const now = new Date();
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .font('Helvetica')
         .text(`Generated: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`, 50, 760, { 
           align: 'center',
           width: 495
         });

      doc.end();
    } catch (err) {
      console.error('PDF generation error:', err);
      reject(err);
    }
  });
}

module.exports = { generateBookingPDF };


