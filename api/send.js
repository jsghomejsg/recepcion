import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, telefono, email, matricula, marca, modelo, observaciones, firma, fotos } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const attachments = [];
    let fotosHtml = '';
    
    // 1. Adjuntar y preparar la imagen de la firma
    if (firma) {
      attachments.push({
        filename: 'firma.png',
        content: firma.split("base64,")[1],
        encoding: 'base64',
        cid: 'signatureImage'
      });
    }

    // 2. Adjuntar las fotos de evidencia y preparar su visualización en el documento
    if (fotos && Array.isArray(fotos)) {
      fotos.forEach((foto, index) => {
        if (foto) {
          const cidName = `evidencia_foto_${index + 1}`;
          attachments.push({
            filename: `${cidName}.jpg`,
            content: foto.split("base64,")[1],
            encoding: 'base64',
            cid: cidName
          });
          // Las metemos maquetadas para que se impriman de forma ordenada
          fotosHtml += `
            <div style="display: inline-block; width: 45%; margin: 2%; text-align: center; border: 1px solid #ccc; padding: 5px; page-break-inside: avoid;">
              <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; color: #555;">Evidencia Fotográfica ${index + 1}</p>
              <img src="cid:${cidName}" style="width: 100%; max-height: 200px; object-fit: contain;" />
            </div>
          `;
        }
      });
    }

    // Direcciones de envío
    const destinatarios = [process.env.GMAIL_USER];
    if (email) {
      destinatarios.push(email);
    }

    // 3. Diseño del documento oficial de recepción para imprimir
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: destinatarios,
      subject: `DOCUMENTO DE RECEPCIÓN PRO - Matrícula: ${matricula || 'N/A'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
            .documento { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; background: #fff; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0; color: #111; }
            .subtitle { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            .seccion { margin-bottom: 25px; }
            .seccion-titulo { font-size: 16px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; margin-bottom: 15px; border-left: 4px solid #333; text-transform: uppercase; }
            .grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .grid td { padding: 8px 0; font-size: 14px; vertical-align: top; }
            .label { font-weight: bold; color: #555; width: 30%; }
            .valor { color: #000; width: 70%; }
            .observaciones-box { border: 1px dashed #ccc; padding: 15px; background: #fafafa; min-height: 60px; font-size: 14px; line-height: 1.5; }
            .firma-contenedor { margin-top: 20px; text-align: center; page-break-inside: avoid; }
            .firma-linea { border-top: 1px solid #999; width: 250px; margin: 10px auto 5px auto; }
            .boton-imprimir { background: #222; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            @media print {
              .boton-imprimir { display: none !important; }
              body { padding: 0; }
              .documento { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="documento">
            <!-- Botón directo de impresión -->
            <div style="text-align: right;">
              <a href="#" onclick="window.print();return false;" class="boton-imprimir">🖨️ Imprimir / Guardar PDF</a>
            </div>

            <div class="header">
              <table style="width: 100%;">
                <tr>
                  <td>
                    <h1 class="title">ORDEN DE RECEPCIÓN</h1>
                    <p class="subtitle">Detalle Digital de Estado de Vehículo</p>
                  </td>
                  <td style="text-align: right; font-size: 12px; color: #666; vertical-align: middle;">
                    <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}<br>
                    <strong>Contacto Taller:</strong> ${process.env.GMAIL_USER}
                  </td>
                </tr>
              </table>
            </div>

            <!-- DATOS DEL CLIENTE -->
            <div class="seccion">
              <div class="seccion-titulo">Datos del Cliente</div>
              <table class="grid">
                <tr>
                  <td class="label">Nombre del Cliente:</td>
                  <td class="valor">${nombre || 'No especificado'}</td>
                </tr>
                <tr>
                  <td class="label">Teléfono:</td>
                  <td class="valor">${telefono || 'No especificado'}</td>
                </tr>
                <tr>
                  <td class="label">Correo Electrónico:</td>
                  <td class="valor">${email || 'No especificado'}</td>
                </tr>
              </table>
            </div>

            <!-- DATOS DEL VEHÍCULO -->
            <div class="seccion">
              <div class="seccion-titulo">Datos del Vehículo</div>
              <table class="grid">
                <tr>
                  <td class="label">Marca / Modelo:</td>
                  <td class="valor">${marca || ''} ${modelo || 'No especificado'}</td>
                </tr>
                <tr>
                  <td class="label">Matrícula:</td>
                  <td class="valor" style="font-size: 16px; font-weight: bold; letter-spacing: 1px;">${matricula || 'No especificada'}</td>
                </tr>
              </table>
            </div>

            <!-- ESTADO Y OBSERVACIONES -->
            <div class="seccion">
              <div class="seccion-titulo">Observaciones y Estado General</div>
              <div class="observaciones-box">
                ${observaciones ? observaciones.replace(/\n/g, '<br>') : 'Sin observaciones de daños o estado previas al servicio.'}
              </div>
            </div>

            <!-- CLAUSULA Y FIRMA -->
            <div class="seccion" style="page-break-inside: avoid;">
              <div class="seccion-titulo">Cláusula Legal y Conformidad</div>
              <p style="font-size: 11px; color: #666; text-align: justify; line-height: 1.4; margin-bottom: 20px;">
                Con la firma del presente documento, el cliente autoriza expresamente al centro de detallado a manipular y conducir el vehículo para los servicios de limpieza contratados. El centro no se hace responsable de objetos de valor dejados en el interior no declarados previamente. De acuerdo con la LOPD y RGPD, sus datos serán tratados con la única finalidad de gestionar el servicio técnico y el envío de la orden digitalizada a su dirección de correo electrónico.
              </p>
              
              <div class="firma-contenedor">
                <p style="font-size: 13px; font-weight: bold; margin: 0;">Firma del Cliente</p>
                ${firma ? `<img src="cid:signatureImage" style="max-width: 250px; max-height: 100px;" />` : '<div style="height:60px;"></div>'}
                <div class="firma-linea"></div>
                <p style="font-size: 12px; color: #555; margin: 0;">${nombre || 'D./Dña. Cliente'}</p>
              </div>
            </div>

            <!-- IMÁGENES DE EVIDENCIA -->
            ${fotosHtml ? `
              <div class="seccion" style="page-break-before: auto; margin-top: 30px;">
                <div class="seccion-titulo">Evidencias Fotográficas de Estado</div>
                <div style="text-align: center;">
                  ${fotosHtml}
                </div>
              </div>
            ` : ''}

          </div>
        </body>
        </html>
      `,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
