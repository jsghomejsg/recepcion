import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Aquí recibimos todos los datos reales que rellenas en la pantalla
    const { nombre, telefono, matricula, marca, modelo, observaciones, firma, fotos } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Preparamos los archivos adjuntos (fotos y firma) si existen en el formulario
    const attachments = [];
    
    if (firma) {
      attachments.push({
        filename: 'firma.png',
        content: firma.split("base64,")[1],
        encoding: 'base64',
        cid: 'signatureImage'
      });
    }

    if (fotos && Array.isArray(fotos)) {
      fotos.forEach((foto, index) => {
        if (foto) {
          attachments.push({
            filename: `evidencia_foto_${index + 1}.jpg`,
            content: foto.split("base64,")[1],
            encoding: 'base64'
          });
        }
      });
    }

    // Diseñamos el contenido del correo con los datos del coche y del cliente
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Nueva Recepción Pro - Matrícula: ${matricula || 'N/A'}`,
      html: `
        <h2>Nueva Recepción de Vehículo Registrada</h2>
        <hr />
        <p><strong>Cliente:</strong> ${nombre || 'No especificado'}</p>
        <p><strong>Teléfono:</strong> ${telefono || 'No especificado'}</p>
        <p><strong>Vehículo:</strong> ${marca || ''} ${modelo || ''}</p>
        <p><strong>Matrícula:</strong> ${matricula || 'No especificada'}</p>
        <p><strong>Observaciones / Estado:</strong> ${observaciones || 'Sin observaciones'}</p>
        <br />
        <p><strong>Firma del cliente:</strong></p>
        ${firma ? `<img src="cid:signatureImage" width="300"/>` : '<p>No firmada</p>'}
        <br />
        <p><em>Las fotos adjuntas se encuentran en los archivos anexos de este correo.</em></p>
      `,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
