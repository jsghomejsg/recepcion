import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu-correo@gmail.com', // 👈 ASEGÚRATE DE QUE AQUÍ ESTÁ TU CORREO EXACTO DE GMAIL
        pass: process.env.GMAIL_PASS, // Esto lee directamente las 16 letras de Vercel
      },
    });

    // Configuración del correo que se envía
    const mailOptions = {
      from: 'tu-correo@gmail.com', // 👈 AQUÍ TAMBIÉN TU CORREO
      to: 'tu-correo@gmail.com',   // A quién le llega (puedes poner el mismo)
      subject: 'Nueva Recepción Pro Registrada',
      text: 'Se ha procesado una nueva recepción correctamente en el sistema.',
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
