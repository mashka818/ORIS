const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

      // Register Arial font for Cyrillic support
      const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
      const arialBoldPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
      
      if (fs.existsSync(arialPath)) {
        doc.registerFont('Arial', arialPath);
      }
      if (fs.existsSync(arialBoldPath)) {
        doc.registerFont('Arial-Bold', arialBoldPath);
      }

      // Header with ORIS logo (as in logo.svg)
      const logoX = 50;
      const logoY = 35;
      const logoSize = 75;
      const centerX = logoX + logoSize/2;
      const centerY = logoY + logoSize/2;
      
      // Outer blue circle with yellow stroke (#001051)
      doc.circle(centerX, centerY, logoSize/2)
         .lineWidth(1.5)
         .fillAndStroke('#001051', '#FFD150');
      
      // Text on circle arc (white text) - СЕТЬ КЛИНИК
      doc.save();
      doc.fontSize(7)
         .fillColor('#ffffff')
         .font('Arial');
      
      // Position text on top arc of circle
      const textY = centerY - logoSize/2 + 12;
      doc.text('СЕТЬ КЛИНИК', centerX - 20, textY, { width: 40, align: 'center' });
      doc.restore();
      
      // Inner white circle
      const whiteCircleRadius = logoSize/2 - 10;
      doc.circle(centerX, centerY, whiteCircleRadius)
         .fill('#ffffff');
      
      // Yellow cross (#FFD150) inside white circle
      const crossColor = '#FFD150';
      const crossWidth = 11;
      const crossHeight = 30;
      
      // Vertical bar of cross
      doc.rect(centerX - crossWidth/2, centerY - crossHeight/2, crossWidth, crossHeight)
         .fill(crossColor);
      
      // Horizontal bar of cross
      doc.rect(centerX - crossHeight/2, centerY - crossWidth/2, crossHeight, crossWidth)
         .fill(crossColor);
      
      // ORIS text (big, next to logo)
      doc.fontSize(28)
         .fillColor('#001051')
         .font('Arial-Bold')
         .text('ОРИС', 140, 50);
      
      // Clinic name (Сеть клиник) - small text under ORIS
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text(clinic.name, 140, 82);

      // Booking number
      doc.fontSize(14)
         .fillColor('#1e40af')
         .font('Arial-Bold')
         .text(`Заявка №${booking.id}`, 400, 60, { align: 'right' });

      // Line
      doc.moveTo(50, 135)
         .lineTo(545, 135)
         .lineWidth(2)
         .strokeColor('#e5e7eb')
         .stroke();

      // Title
      doc.fontSize(26)
         .fillColor('#1e40af')
         .font('Arial-Bold')
         .text('ПОДТВЕРЖДЕНИЕ ЗАПИСИ', 50, 165, { align: 'center' });

      // Success checkmark
      doc.circle(297.5, 230, 28)
         .lineWidth(4)
         .strokeColor('#10b981')
         .stroke();
      
      doc.moveTo(282, 230)
         .lineTo(294, 241)
         .lineTo(313, 222)
         .lineWidth(4)
         .strokeColor('#10b981')
         .stroke();

      // Info box background (с равными отступами)
      doc.roundedRect(60, 285, 475, 320, 12)
         .fillAndStroke('#f9fafb', '#e5e7eb');

      let yPos = 310;  // Равный отступ сверху (25px)
      const spacing = 58;

      // Clinic
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text('КЛИНИКА:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Arial-Bold')
         .text(clinic.name, 100, yPos + 18);

      // Patient
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text('ПАЦИЕНТ:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Arial-Bold')
         .text(booking.name, 100, yPos + 18);

      // Phone
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text('ТЕЛЕФОН:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Arial-Bold')
         .text(booking.phone, 100, yPos + 18);

      // Date
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text('ДАТА:', 100, yPos);
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Arial-Bold')
         .text(booking.date, 100, yPos + 18);

      // Time
      yPos += spacing;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Arial')
         .text('ВРЕМЯ:', 100, yPos);
      
      const [startH, startM] = booking.time.split(':').map(Number);
      const endMinutes = startH * 60 + startM + 30;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const timeRange = `${booking.time} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      
      doc.fontSize(15)
         .fillColor('#1f2937')
         .font('Arial-Bold')
         .text(timeRange, 100, yPos + 18);

      // Important notice
      yPos += 85;
      const importantBoxHeight = 105;
      doc.roundedRect(70, yPos, 455, importantBoxHeight, 10)
         .fillAndStroke('#dbeafe', '#60a5fa');
      
      doc.fontSize(11)
         .fillColor('#1e40af')
         .font('Arial-Bold')
         .text('ВАЖНО:', 90, yPos + 20);
      
      doc.fontSize(10)
         .fillColor('#1f2937')
         .font('Arial')
         .text('Пожалуйста, приходите за 10 минут до назначенного времени.', 90, yPos + 45, { width: 415 })
         .text('Пожалуйста, возьмите с собой удостоверение личности.', 90, yPos + 70, { width: 415 });

      // Footer - под синим окошком с отступом
      const footerY = yPos + importantBoxHeight + 25;
      
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .font('Arial')
         .text('Данный документ подтверждает вашу запись на прием.', 50, footerY, { 
           align: 'center',
           width: 495
         });
      
      const now = new Date();
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .font('Arial')
         .text(`Создан: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`, 50, footerY + 16, { 
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


